use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::{CreateMetadataAccountV3, CreateMasterEditionV3};
use mpl_token_metadata::state::{DataV2, Collection, Creator, Uses};
use mpl_token_metadata::ID as MetadataID;
use std::str::FromStr;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Replace with your program ID

#[program]
pub mod lottery_v2 {
    use super::*;

    // Constants
    const MINT_PRICE: u64 = 10_000_000; // 0.01 SOL in lamports
    const OWNER_FEE_BP: u16 = 100; // 1% in basis points
    const MARKETPLACE_FEE_BP: u16 = 200; // 2% in basis points
    const REVEAL_INTERVAL: i64 = 172800; // 2 days in seconds
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let lottery_state = &mut ctx.accounts.lottery_state;
        lottery_state.authority = ctx.accounts.authority.key();
        lottery_state.current_round = 1;
        lottery_state.current_reveal_index = 0;
        lottery_state.last_reveal_time = Clock::get()?.unix_timestamp;
        lottery_state.accumulated_prize = 0;
        lottery_state.round_complete = false;
        lottery_state.token_id_counter = 0;
        
        Ok(())
    }
    
    pub fn mint_ticket(ctx: Context<MintTicket>, numbers: [u8; 6]) -> Result<()> {
        let lottery_state = &mut ctx.accounts.lottery_state;
        let ticket_account = &mut ctx.accounts.ticket_account;
        let payment = ctx.accounts.payment;
        
        // Validate payment
        require!(payment.lamports() >= MINT_PRICE, LotteryError::InsufficientPayment);
        
        // Validate numbers (0-99 range)
        for num in numbers.iter() {
            require!(*num <= 99, LotteryError::InvalidNumberRange);
        }
        
        // Calculate fees and prize contribution
        let owner_fee = (MINT_PRICE as u128 * OWNER_FEE_BP as u128 / 10000) as u64;
        let prize_contribution = MINT_PRICE - owner_fee;
        
        // Transfer owner fee
        let owner_fee_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.payment.key(),
            &lottery_state.authority,
            owner_fee,
        );
        anchor_lang::solana_program::program::invoke(
            &owner_fee_ix,
            &[
                ctx.accounts.payment.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.authority.to_account_info(),
            ],
        )?;
        
        // Add to prize pool
        lottery_state.accumulated_prize += prize_contribution;
        
        // Initialize ticket data
        lottery_state.token_id_counter += 1;
        ticket_account.owner = ctx.accounts.payment.key();
        ticket_account.numbers = numbers;
        ticket_account.claimed = false;
        ticket_account.token_id = lottery_state.token_id_counter;
        
        // Create NFT metadata and mint
        create_nft(ctx, numbers)?;
        
        emit!(TicketMinted {
            token_id: lottery_state.token_id_counter,
            owner: ctx.accounts.payment.key(),
            numbers,
        });
        
        Ok(())
    }
    
    pub fn reveal_number(ctx: Context<RevealNumber>) -> Result<()> {
        let lottery_state = &mut ctx.accounts.lottery_state;
        
        require!(!lottery_state.round_complete, LotteryError::RoundComplete);
        
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= lottery_state.last_reveal_time + REVEAL_INTERVAL,
            LotteryError::TooEarlyForReveal
        );
        
        // Generate pseudo-random number using recent blockhash
        // Note: In production, consider using a VRF like Switchboard
        let recent_blockhash = ctx.accounts.recent_blockhash.to_account_info().data.borrow();
        let number = (recent_blockhash[0] % 100) as u8;
        
        // Store revealed number
        let reveal_index = lottery_state.current_reveal_index as usize;
        lottery_state.revealed_numbers[reveal_index] = number;
        
        // Update state
        lottery_state.current_reveal_index += 1;
        lottery_state.last_reveal_time = current_time;
        
        // Check if all numbers revealed
        if lottery_state.current_reveal_index == 6 {
            lottery_state.round_complete = true;
        }
        
        emit!(NumberRevealed {
            round: lottery_state.current_round,
            number,
            reveal_index: reveal_index as u8,
        });
        
        Ok(())
    }
    
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let lottery_state = &mut ctx.accounts.lottery_state;
        let ticket_account = &mut ctx.accounts.ticket_account;
        
        // Check conditions
        require!(lottery_state.round_complete, LotteryError::RoundNotComplete);
        require!(ticket_account.owner == ctx.accounts.claimer.key(), LotteryError::NotTicketOwner);
        require!(!ticket_account.claimed, LotteryError::AlreadyClaimed);
        
        // Check if ticket is a winner
        let mut is_winner = true;
        for i in 0..6 {
            if ticket_account.numbers[i] != lottery_state.revealed_numbers[i] {
                is_winner = false;
                break;
            }
        }
        
        require!(is_winner, LotteryError::TicketNotWinner);
        
        // Mark ticket as claimed
        ticket_account.claimed = true;
        
        // Transfer prize
        let prize = lottery_state.accumulated_prize;
        lottery_state.accumulated_prize = 0;
        
        let prize_ix = anchor_lang::solana_program::system_instruction::transfer(
            &lottery_state.to_account_info().key(),
            &ctx.accounts.claimer.key(),
            prize,
        );
        anchor_lang::solana_program::program::invoke(
            &prize_ix,
            &[
                lottery_state.to_account_info(),
                ctx.accounts.claimer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        emit!(PrizeAwarded {
            winner: ctx.accounts.claimer.key(),
            amount: prize,
        });
        
        Ok(())
    }
    
    pub fn start_new_round(ctx: Context<StartNewRound>) -> Result<()> {
        let lottery_state = &mut ctx.accounts.lottery_state;
        
        require!(lottery_state.round_complete, LotteryError::RoundNotComplete);
        
        lottery_state.current_round += 1;
        lottery_state.current_reveal_index = 0;
        lottery_state.round_complete = false;
        lottery_state.last_reveal_time = Clock::get()?.unix_timestamp;
        
        // Reset revealed numbers array
        for i in 0..6 {
            lottery_state.revealed_numbers[i] = 0;
        }
        
        emit!(NewRoundStarted {
            round: lottery_state.current_round,
        });
        
        Ok(())
    }
    
    pub fn list_ticket(ctx: Context<ListTicket>, price: u64) -> Result<()> {
        let ticket_account = &mut ctx.accounts.ticket_account;
        let listing_account = &mut ctx.accounts.listing_account;
        
        require!(price > 0, LotteryError::InvalidPrice);
        require!(ticket_account.owner == ctx.accounts.owner.key(), LotteryError::NotTicketOwner);
        
        listing_account.seller = ctx.accounts.owner.key();
        listing_account.price = price;
        listing_account.active = true;
        listing_account.ticket_id = ticket_account.token_id;
        
        emit!(TicketListed {
            token_id: ticket_account.token_id,
            seller: ctx.accounts.owner.key(),
            price,
        });
        
        Ok(())
    }
    
    pub fn delist_ticket(ctx: Context<DelistTicket>) -> Result<()> {
        let listing_account = &mut ctx.accounts.listing_account;
        
        require!(listing_account.seller == ctx.accounts.owner.key(), LotteryError::NotSeller);
        require!(listing_account.active, LotteryError::NotListed);
        
        listing_account.active = false;
        
        emit!(TicketDelisted {
            token_id: listing_account.ticket_id,
            seller: ctx.accounts.owner.key(),
        });
        
        Ok(())
    }
    
    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        let ticket_account = &mut ctx.accounts.ticket_account;
        let listing_account = &mut ctx.accounts.listing_account;
        let payment = ctx.accounts.payment;
        let seller = &ctx.accounts.seller;
        let authority = &ctx.accounts.authority;
        
        require!(listing_account.active, LotteryError::NotListed);
        require!(payment.lamports() >= listing_account.price, LotteryError::InsufficientPayment);
        require!(payment.key() != seller.key(), LotteryError::CannotBuyOwnTicket);
        
        // Calculate fees
        let price = listing_account.price;
        let owner_fee = (price as u128 * OWNER_FEE_BP as u128 / 10000) as u64;
        let marketplace_fee = (price as u128 * MARKETPLACE_FEE_BP as u128 / 10000) as u64;
        let total_fee = owner_fee + marketplace_fee;
        let seller_amount = price - total_fee;
        
        // Transfer fees to authority
        let fee_ix = anchor_lang::solana_program::system_instruction::transfer(
            &payment.key(),
            &authority.key(),
            total_fee,
        );
        anchor_lang::solana_program::program::invoke(
            &fee_ix,
            &[
                payment.to_account_info(),
                authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        // Transfer payment to seller
        let payment_ix = anchor_lang::solana_program::system_instruction::transfer(
            &payment.key(),
            &seller.key(),
            seller_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &payment_ix,
            &[
                payment.to_account_info(),
                seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        // Transfer ownership
        ticket_account.owner = payment.key();
        
        // Deactivate listing
        listing_account.active = false;
        
        emit!(TicketSold {
            token_id: ticket_account.token_id,
            seller: seller.key(),
            buyer: payment.key(),
            price,
        });
        
        Ok(())
    }
}

// Helper functions to derive PDA addresses for Metaplex accounts
fn find_metadata_account(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"metadata",
            MetadataID.as_ref(),
            mint.as_ref(),
        ],
        &MetadataID,
    )
}

fn find_master_edition_account(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"metadata",
            MetadataID.as_ref(),
            mint.as_ref(),
            b"edition",
        ],
        &MetadataID,
    )
}

// Helper function to create NFT
fn create_nft(ctx: Context<MintTicket>, numbers: [u8; 6]) -> Result<()> {
    // Format numbers as a string for the name
    let numbers_str = format!("{}-{}-{}-{}-{}-{}", 
        numbers[0], numbers[1], numbers[2], numbers[3], numbers[4], numbers[5]);
    
    // Create the NFT metadata
    let name = format!("Lottery Ticket #{}", ctx.accounts.lottery_state.token_id_counter);
    let symbol = "LOTTO".to_string();
    let uri = format!("https://lottery.example.com/metadata/{}.json", ctx.accounts.lottery_state.token_id_counter);
    
    // Create metadata accounts
    let seeds = &[b"lottery_mint".as_ref(), &ctx.accounts.lottery_state.token_id_counter.to_le_bytes()];
    let (mint_address, _bump) = Pubkey::find_program_address(seeds, ctx.program_id);
    
    // Create token mint
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::InitializeMint {
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );
    token::initialize_mint(cpi_context, 0, &ctx.accounts.authority.key(), Some(&ctx.accounts.authority.key()))?;
    
    // Create token account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::InitializeAccount {
            account: ctx.accounts.token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.payment.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );
    token::initialize_account(cpi_context)?;
    
    // Mint token to user's account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::mint_to(cpi_context, 1)?;
    
    // Create metadata
    let creators = vec![
        Creator {
            address: ctx.accounts.authority.key(),
            verified: true,
            share: 100,
        }
    ];
    
    let data_v2 = DataV2 {
        name,
        symbol,
        uri,
        seller_fee_basis_points: 500, // 5%
        creators: Some(creators),
        collection: None,
        uses: None,
    };
    
    // Build metadata instruction
    let create_metadata_ix = CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.authority.to_account_info(),
        payer: ctx.accounts.payment.to_account_info(),
        update_authority: ctx.accounts.authority.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };

    let create_metadata_ctx = CpiContext::new(
        ctx.accounts.metadata_program.to_account_info(),
        create_metadata_ix,
    );
    
    // Execute metadata instruction
    CreateMetadataAccountV3::create_metadata_account_v3(
        create_metadata_ctx,
        data_v2,
        true,  // is_mutable
        true,  // update_authority_is_signer
        None,  // collection details
    )?;
    
    // Create master edition
    let create_master_edition_ix = CreateMasterEditionV3 {
        edition: ctx.accounts.master_edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        update_authority: ctx.accounts.authority.to_account_info(),
        mint_authority: ctx.accounts.authority.to_account_info(),
        payer: ctx.accounts.payment.to_account_info(),
        metadata: ctx.accounts.metadata_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    
    let create_master_edition_ctx = CpiContext::new(
        ctx.accounts.metadata_program.to_account_info(),
        create_master_edition_ix,
    );
    
    // Execute master edition instruction
    CreateMasterEditionV3::create_master_edition_v3(
        create_master_edition_ctx,
        Some(0), // Max supply of 0 means this is a non-fungible token (unique)
    )?;
    
    Ok(())
}

// Account structures
#[account]
pub struct LotteryState {
    pub authority: Pubkey,
    pub current_round: u32,
    pub current_reveal_index: u8,
    pub last_reveal_time: i64,
    pub accumulated_prize: u64,
    pub round_complete: bool,
    pub token_id_counter: u64,
    pub revealed_numbers: [u8; 6],
}

#[account]
pub struct TicketAccount {
    pub owner: Pubkey,
    pub numbers: [u8; 6],
    pub claimed: bool,
    pub token_id: u64,
}

#[account]
pub struct ListingAccount {
    pub seller: Pubkey,
    pub price: u64,
    pub active: bool,
    pub ticket_id: u64,
}

// Context structures for instructions
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 1 + 8 + 8 + 1 + 8 + (6 * 1),
    )]
    pub lottery_state: Account<'info, LotteryState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTicket<'info> {
    #[account(mut)]
    pub lottery_state: Account<'info, LotteryState>,
    
    #[account(
        init,
        payer = payment,
        space = 8 + 32 + (6 * 1) + 1 + 8,
    )]
    pub ticket_account: Account<'info, TicketAccount>,
    
    #[account(mut)]
    pub payment: Signer<'info>,
    
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    
    // NFT-specific accounts
    #[account(
        init,
        payer = payment,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = payment,
        associated_token::mint = mint,
        associated_token::authority = payment,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Metadata account for the NFT
    #[account(
        mut,
        address = find_metadata_account(&mint.key()).0
    )]
    pub metadata_account: UncheckedAccount<'info>,
    
    /// CHECK: Master edition account for the NFT
    #[account(
        mut,
        address = find_master_edition_account(&mint.key()).0
    )]
    pub master_edition: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: Metaplex program
    #[account(address = MetadataID)]
    pub metadata_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RevealNumber<'info> {
    #[account(
        mut,
        constraint = lottery_state.authority == authority.key()
    )]
    pub lottery_state: Account<'info, LotteryState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Used for randomness
    pub recent_blockhash: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub lottery_state: Account<'info, LotteryState>,
    
    #[account(
        mut,
        constraint = ticket_account.owner == claimer.key()
    )]
    pub ticket_account: Account<'info, TicketAccount>,
    
    #[account(mut)]
    pub claimer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartNewRound<'info> {
    #[account(
        mut,
        constraint = lottery_state.authority == authority.key()
    )]
    pub lottery_state: Account<'info, LotteryState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ListTicket<'info> {
    #[account(
        mut,
        constraint = ticket_account.owner == owner.key()
    )]
    pub ticket_account: Account<'info, TicketAccount>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 8 + 1 + 8,
    )]
    pub listing_account: Account<'info, ListingAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DelistTicket<'info> {
    #[account(
        mut,
        constraint = listing_account.seller == owner.key()
    )]
    pub listing_account: Account<'info, ListingAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(
        mut,
        constraint = ticket_account.token_id == listing_account.ticket_id
    )]
    pub ticket_account: Account<'info, TicketAccount>,
    
    #[account(mut)]
    pub listing_account: Account<'info, ListingAccount>,
    
    #[account(mut)]
    pub payment: Signer<'info>,
    
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

// Events
#[event]
pub struct TicketMinted {
    pub token_id: u64,
    pub owner: Pubkey,
    pub numbers: [u8; 6],
}

#[event]
pub struct NumberRevealed {
    pub round: u32,
    pub number: u8,
    pub reveal_index: u8,
}

#[event]
pub struct PrizeAwarded {
    pub winner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct NewRoundStarted {
    pub round: u32,
}

#[event]
pub struct TicketListed {
    pub token_id: u64,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct TicketDelisted {
    pub token_id: u64,
    pub seller: Pubkey,
}

#[event]
pub struct TicketSold {
    pub token_id: u64,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
}

// Error codes
#[error_code]
pub enum LotteryError {
    #[msg("Insufficient payment")]
    InsufficientPayment,
    #[msg("Invalid number range, must be between 0 and 99")]
    InvalidNumberRange,
    #[msg("Round already complete")]
    RoundComplete,
    #[msg("Too early for next reveal")]
    TooEarlyForReveal,
    #[msg("Round not complete")]
    RoundNotComplete,
    #[msg("Not ticket owner")]
    NotTicketOwner,
    #[msg("Prize already claimed")]
    AlreadyClaimed,
    #[msg("Ticket is not a winner")]
    TicketNotWinner,
    #[msg("Price must be greater than 0")]
    InvalidPrice,
    #[msg("Not the seller")]
    NotSeller,
    #[msg("Ticket not listed for sale")]
    NotListed,
    #[msg("Cannot buy your own ticket")]
    CannotBuyOwnTicket,
}