use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};
use std::mem::size_of;

declare_id!("BzGNGfCEfvbWYTByUicHR3MmcJYz9DwTMHvtrFmaBAgG");

#[program]
pub mod sequence_lottery {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        sequence_length: u8,
        reveal_interval: i64,
        ticket_price: u64,
        prize_amount: u64,
    ) -> Result<()> {
        require!(sequence_length > 0 && sequence_length <= 10, LotteryError::InvalidSequenceLength);
        require!(reveal_interval > 0, LotteryError::InvalidRevealInterval);
        require!(ticket_price > 0, LotteryError::InvalidTicketPrice);
        require!(prize_amount > 0, LotteryError::InvalidPrizeAmount);

        let lottery = &mut ctx.accounts.lottery;
        lottery.authority = ctx.accounts.authority.key();
        lottery.sequence_length = sequence_length;
        lottery.reveal_interval = reveal_interval;
        lottery.ticket_price = ticket_price;
        lottery.prize_amount = prize_amount;
        lottery.next_ticket_id = 1;
        lottery.winning_sequence = [0; 10]; // Will be set when drawing
        lottery.current_reveal_index = 0;
        lottery.last_reveal_timestamp = 0;
        lottery.state = LotteryState::Active;
        
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>, sequence: [u8; 10]) -> Result<()> {
        let lottery = &ctx.accounts.lottery;
        require!(lottery.state == LotteryState::Active, LotteryError::LotteryClosed);
        
        // Validate sequence values (assuming numbers 1-45 for a lottery)
        for i in 0..lottery.sequence_length as usize {
            require!(sequence[i] > 0 && sequence[i] <= 45, LotteryError::InvalidSequenceValue);
        }
        
        // Transfer tokens from buyer to lottery vault
        let transfer_instruction = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.lottery_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        
        token::transfer(cpi_ctx, lottery.ticket_price)?;
        
        // Create ticket
        let ticket = &mut ctx.accounts.ticket;
        ticket.owner = ctx.accounts.buyer.key();
        ticket.lottery = lottery.key();
        ticket.ticket_id = lottery.next_ticket_id;
        ticket.sequence = sequence;
        ticket.claimed = false;
        
        // Update lottery
        let lottery = &mut ctx.accounts.lottery;
        lottery.next_ticket_id += 1;
        
        Ok(())
    }
    
    pub fn reveal_next_number(ctx: Context<RevealNumber>, random_seed: u64) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        require!(lottery.state == LotteryState::Active, LotteryError::LotteryClosed);
        require!(
            lottery.current_reveal_index < lottery.sequence_length,
            LotteryError::AllNumbersRevealed
        );
        
        let current_time = Clock::get()?.unix_timestamp;
        
        // Check if enough time has passed since last reveal
        if lottery.current_reveal_index > 0 {
            require!(
                current_time >= lottery.last_reveal_timestamp + lottery.reveal_interval,
                LotteryError::TooEarlyForReveal
            );
        }
        
        // Generate pseudo-random number based on various inputs
        let random_value = generate_random_number(
            random_seed,
            lottery.current_reveal_index,
            current_time,
            ctx.accounts.authority.key().to_bytes(),
        );
        
        // Store the index in a local variable to avoid borrowing issues
        let current_index = lottery.current_reveal_index as usize;
        
        // Set the winning number (1-45)
        lottery.winning_sequence[current_index] = (random_value % 45 + 1) as u8;
        
        lottery.current_reveal_index += 1;
        lottery.last_reveal_timestamp = current_time;
        
        // Check if we've revealed all numbers
        if lottery.current_reveal_index == lottery.sequence_length {
            lottery.state = LotteryState::Completed;
        }
        
        Ok(())
    }
    
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let lottery = &ctx.accounts.lottery;
        let ticket = &mut ctx.accounts.ticket;
        
        require!(lottery.state == LotteryState::Completed, LotteryError::LotteryNotCompleted);
        require!(!ticket.claimed, LotteryError::AlreadyClaimed);
        require!(ticket.lottery == lottery.key(), LotteryError::TicketLotteryMismatch);
        
        // Check if ticket has winning sequence
        let mut is_winner = true;
        for i in 0..lottery.sequence_length as usize {
            if ticket.sequence[i] != lottery.winning_sequence[i] {
                is_winner = false;
                break;
            }
        }
        
        require!(is_winner, LotteryError::NotWinningTicket);
        
        // Transfer prize to winner
        let seeds = &[
            b"lottery".as_ref(),
            &lottery.key().to_bytes(),
            &[ctx.bumps.lottery_authority],
        ];
        let signer = &[&seeds[..]];
        
        let transfer_instruction = Transfer {
            from: ctx.accounts.lottery_vault.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: ctx.accounts.lottery_authority.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            signer,
        );
        
        token::transfer(cpi_ctx, lottery.prize_amount)?;
        
        // Mark ticket as claimed
        ticket.claimed = true;
        
        Ok(())
    }
    
    pub fn transfer_ticket(ctx: Context<TransferTicket>) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        let lottery = &ctx.accounts.lottery;
        
        // Ensure the current owner is the signer
        require!(
            ticket.owner == ctx.accounts.current_owner.key(),
            LotteryError::NotTicketOwner
        );
        
        // Check lottery state - can only transfer if still active
        require!(
            lottery.state == LotteryState::Active,
            LotteryError::LotteryClosed
        );
        
        // Transfer ownership
        ticket.owner = ctx.accounts.new_owner.key();
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(sequence_length: u8, reveal_interval: i64, ticket_price: u64, prize_amount: u64)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<Lottery>(),
        seeds = [b"lottery", authority.key().as_ref()],
        bump
    )]
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        seeds = [b"lottery", lottery.key().as_ref()],
        bump,
    )]
    /// CHECK: This is a PDA that acts as the authority for the lottery vault
    pub lottery_authority: UncheckedAccount<'info>,
    
    /// CHECK: This is a token account that will be initialized
    #[account(mut)]
    pub lottery_vault: AccountInfo<'info>,
    
    /// CHECK: This is the token mint
    pub mint: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        init,
        payer = buyer,
        space = 8 + size_of::<Ticket>(),
        seeds = [b"ticket", lottery.key().as_ref(), &lottery.next_ticket_id.to_le_bytes()],
        bump
    )]
    pub ticket: Account<'info, Ticket>,
    
    /// CHECK: This is the lottery vault token account
    #[account(mut)]
    pub lottery_vault: AccountInfo<'info>,
    
    /// CHECK: This is the buyer's token account
    #[account(mut)]
    pub buyer_token_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RevealNumber<'info> {
    #[account(
        mut,
        constraint = lottery.authority == authority.key() @ LotteryError::Unauthorized
    )]
    pub lottery: Account<'info, Lottery>,
    
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        seeds = [b"lottery", lottery.key().as_ref()],
        bump,
    )]
    /// CHECK: This is a PDA that acts as the authority for the lottery vault
    pub lottery_authority: UncheckedAccount<'info>,
    
    #[account(
        mut,
        constraint = ticket.owner == winner.key() @ LotteryError::NotTicketOwner,
        constraint = ticket.lottery == lottery.key() @ LotteryError::TicketLotteryMismatch,
    )]
    pub ticket: Account<'info, Ticket>,
    
    /// CHECK: This is the lottery vault token account
    #[account(mut)]
    pub lottery_vault: AccountInfo<'info>,
    
    /// CHECK: This is the winner's token account
    #[account(mut)]
    pub winner_token_account: AccountInfo<'info>,
    
    pub winner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferTicket<'info> {
    pub lottery: Account<'info, Lottery>,
    
    #[account(mut)]
    pub ticket: Account<'info, Ticket>,
    
    pub current_owner: Signer<'info>,
    
    /// CHECK: This is just an account we're transferring ownership to
    pub new_owner: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Lottery {
    pub authority: Pubkey,
    pub sequence_length: u8,
    pub reveal_interval: i64, // Time between reveals in seconds
    pub ticket_price: u64,
    pub prize_amount: u64,
    pub next_ticket_id: u64,
    pub winning_sequence: [u8; 10], // Support up to 10 numbers in sequence
    pub current_reveal_index: u8,
    pub last_reveal_timestamp: i64,
    pub state: LotteryState,
}

#[account]
pub struct Ticket {
    pub owner: Pubkey,
    pub lottery: Pubkey,
    pub ticket_id: u64,
    pub sequence: [u8; 10], // User's chosen sequence
    pub claimed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum LotteryState {
    Active,
    Completed,
}

#[error_code]
pub enum LotteryError {
    #[msg("Invalid sequence length")]
    InvalidSequenceLength,
    #[msg("Invalid reveal interval")]
    InvalidRevealInterval,
    #[msg("Invalid ticket price")]
    InvalidTicketPrice,
    #[msg("Invalid prize amount")]
    InvalidPrizeAmount,
    #[msg("Invalid sequence value")]
    InvalidSequenceValue,
    #[msg("Lottery is closed")]
    LotteryClosed,
    #[msg("All numbers have been revealed")]
    AllNumbersRevealed,
    #[msg("Too early for next reveal")]
    TooEarlyForReveal,
    #[msg("Lottery not completed yet")]
    LotteryNotCompleted,
    #[msg("Ticket already claimed")]
    AlreadyClaimed,
    #[msg("Not a winning ticket")]
    NotWinningTicket,
    #[msg("Not the ticket owner")]
    NotTicketOwner,
    #[msg("Ticket lottery mismatch")]
    TicketLotteryMismatch,
    #[msg("Unauthorized")]
    Unauthorized,
}

// Simple pseudo-random number generator function
fn generate_random_number(seed: u64, index: u8, timestamp: i64, authority: [u8; 32]) -> u64 {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    use std::hash::{Hash, Hasher};
    
    seed.hash(&mut hasher);
    index.hash(&mut hasher);
    timestamp.hash(&mut hasher);
    authority.hash(&mut hasher);
    
    hasher.finish()
}