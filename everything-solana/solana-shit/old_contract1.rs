
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};
use std::mem::size_of;

declare_id!("3UJcW6qB7LJJGdJbRqDh4SkWDVGCF15YzkuRtf5nvRJJ");

#[program]
pub mod sequential_lottery {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        ticket_price: u64,
        max_number: u8,
        numbers_to_pick: u8,
        max_tickets: u32,
    ) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        lottery.authority = ctx.accounts.authority.key();
        lottery.ticket_price = ticket_price;
        lottery.max_number = max_number;
        lottery.numbers_to_pick = numbers_to_pick;
        lottery.max_tickets = max_tickets;
        lottery.tickets_purchased = 0;
        lottery.current_revealed = 0;
        lottery.is_active = true;
        lottery.winning_numbers = vec![0; numbers_to_pick as usize];
        
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>, selected_numbers: Vec<u8>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        let ticket_buyer = &ctx.accounts.ticket_buyer;
        
        // Validate lottery state
        require!(lottery.is_active, LotteryError::LotteryNotActive);
        require!(lottery.tickets_purchased < lottery.max_tickets, LotteryError::MaxTicketsReached);
        
        // Validate selected numbers
        require!(
            selected_numbers.len() == lottery.numbers_to_pick as usize, 
            LotteryError::InvalidNumberCount
        );
        
        for num in &selected_numbers {
            require!(*num > 0 && *num <= lottery.max_number, LotteryError::InvalidNumber);
        }
        
        // Transfer funds for ticket purchase
        let lottery_key = lottery.key();
        let seeds = &[
            b"lottery".as_ref(),
            lottery_key.as_ref(),
            &[ctx.bumps.lottery_vault_authority]
        ];
        let _signer = &[&seeds[..]]; // Prefixed with underscore since we're not using it

        let cpi_accounts = token::Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.lottery_token_account.to_account_info(),
            authority: ticket_buyer.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, lottery.ticket_price)?;
        
        // Create and populate ticket
        let ticket = &mut ctx.accounts.ticket;
        ticket.owner = ticket_buyer.key();
        ticket.lottery = lottery.key();
        ticket.selected_numbers = selected_numbers;
        ticket.claimed = false;
        
        lottery.tickets_purchased += 1;
        
        Ok(())
    }

    pub fn reveal_number(ctx: Context<RevealNumber>, number_index: u8, number: u8) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        
        // Only authority can reveal numbers
        require!(
            lottery.authority == ctx.accounts.authority.key(),
            LotteryError::Unauthorized
        );
        
        // Validate index and state
        require!(lottery.is_active, LotteryError::LotteryNotActive);
        require!(
            number_index as u32 == lottery.current_revealed,
            LotteryError::InvalidRevealIndex
        );
        require!(
            number_index < lottery.numbers_to_pick,
            LotteryError::InvalidRevealIndex
        );
        require!(number > 0 && number <= lottery.max_number, LotteryError::InvalidNumber);
        
        // Reveal the number
        lottery.winning_numbers[number_index as usize] = number;
        lottery.current_revealed += 1;
        
        // If all numbers are revealed, close the lottery
        if lottery.current_revealed as u8 == lottery.numbers_to_pick {
            lottery.is_active = false;
        }
        
        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let lottery = &ctx.accounts.lottery;
        let ticket = &mut ctx.accounts.ticket;
        
        // Validate ticket and lottery state
        require!(!lottery.is_active, LotteryError::LotteryStillActive);
        require!(!ticket.claimed, LotteryError::TicketAlreadyClaimed);
        require!(ticket.lottery == lottery.key(), LotteryError::TicketLotteryMismatch);
        
        // Calculate matches
        let mut matches = 0;
        for num in &ticket.selected_numbers {
            if lottery.winning_numbers.contains(num) {
                matches += 1;
            }
        }
        
        // Determine prize based on matches (simplified example)
        let prize_amount = match matches {
            0..=2 => 0,
            3 => lottery.ticket_price,
            4 => lottery.ticket_price * 10,
            5 => lottery.ticket_price * 100,
            _ => lottery.ticket_price * 1000,
        };
        
        // If there's a prize, transfer the tokens
        if prize_amount > 0 {
            let lottery_key = lottery.key();
            let seeds = &[
                b"lottery".as_ref(),
                lottery_key.as_ref(),
                &[ctx.bumps.lottery_vault_authority]
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = token::Transfer {
                from: ctx.accounts.lottery_token_account.to_account_info(),
                to: ctx.accounts.winner_token_account.to_account_info(),
                authority: ctx.accounts.lottery_vault_authority.to_account_info(),
            };
            
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            
            token::transfer(cpi_ctx, prize_amount)?;
        }
        
        // Mark ticket as claimed
        ticket.claimed = true;
        
        Ok(())
    }

    pub fn end_lottery(ctx: Context<EndLottery>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        
        // Only authority can end lottery
        require!(
            lottery.authority == ctx.accounts.authority.key(),
            LotteryError::Unauthorized
        );
        
        // Close the lottery
        lottery.is_active = false;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<Lottery>() + 256, // Extra space for vector
    )]
    pub lottery: Account<'info, Lottery>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        init,
        payer = ticket_buyer,
        space = 8 + size_of::<Ticket>() + 256, // Extra space for vector
        seeds = [b"ticket", lottery.key().as_ref(), ticket_buyer.key().as_ref(), &[lottery.tickets_purchased.to_le_bytes()[0]]],
        bump,
    )]
    pub ticket: Account<'info, Ticket>,
    
    #[account(mut)]
    pub ticket_buyer: Signer<'info>,
    
    /// CHECK: This is the token account of the buyer and is checked in the token transfer CPI
    #[account(mut)]
    pub buyer_token_account: AccountInfo<'info>,
    
    /// CHECK: This is the token account of the lottery and is checked in the token transfer CPI
    #[account(mut)]
    pub lottery_token_account: AccountInfo<'info>,
    
    /// CHECK: PDA used for transferring tokens
    #[account(
        seeds = [b"lottery", lottery.key().as_ref()],
        bump,
    )]
    pub lottery_vault_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealNumber<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        constraint = lottery.authority == authority.key() @ LotteryError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        mut,
        constraint = ticket.owner == winner.key() @ LotteryError::Unauthorized,
        constraint = ticket.lottery == lottery.key() @ LotteryError::TicketLotteryMismatch,
    )]
    pub ticket: Account<'info, Ticket>,
    
    #[account(mut)]
    pub winner: Signer<'info>,
    
    /// CHECK: This is the token account of the winner and is checked in the token transfer CPI
    #[account(mut)]
    pub winner_token_account: AccountInfo<'info>,
    
    /// CHECK: This is the token account of the lottery and is checked in the token transfer CPI
    #[account(mut)]
    pub lottery_token_account: AccountInfo<'info>,
    
    /// CHECK: PDA used for token transfer authority
    #[account(
        seeds = [b"lottery", lottery.key().as_ref()],
        bump,
    )]
    pub lottery_vault_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EndLottery<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    
    #[account(
        constraint = lottery.authority == authority.key() @ LotteryError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[account]
pub struct Lottery {
    pub authority: Pubkey,
    pub ticket_price: u64,
    pub max_number: u8,
    pub numbers_to_pick: u8,
    pub max_tickets: u32,
    pub tickets_purchased: u32,
    pub current_revealed: u32,  // Changed from usize to u32
    pub is_active: bool,
    pub winning_numbers: Vec<u8>,
}

#[account]
pub struct Ticket {
    pub owner: Pubkey,
    pub lottery: Pubkey,
    pub selected_numbers: Vec<u8>,
    pub claimed: bool,
}

#[error_code]
pub enum LotteryError {
    #[msg("Lottery is not active")]
    LotteryNotActive,
    #[msg("Maximum tickets already purchased")]
    MaxTicketsReached,
    #[msg("Invalid number of selected numbers")]
    InvalidNumberCount,
    #[msg("Selected number is outside valid range")]
    InvalidNumber,
    #[msg("Only the lottery authority can perform this action")]
    Unauthorized,
    #[msg("Invalid reveal index")]
    InvalidRevealIndex,
    #[msg("Lottery is still active")]
    LotteryStillActive,
    #[msg("Ticket has already been claimed")]
    TicketAlreadyClaimed,
    #[msg("Ticket belongs to a different lottery")]
    TicketLotteryMismatch,
}