use anchor_lang::prelude::*;
use anchor_lang::solana_program::{pubkey::Pubkey};
use std::collections::BTreeMap; // Add this import

declare_id!("3UJcW6qB7LJJGdJbRqDh4SkWDVGCF15YzkuRtf5nvRJJ");

const MINT_PRICE: u64 = 10_000_000; // 0.01 SOL in lamports
const TRANSACTION_FEE: u64 = 250; // 2.5% in basis points
const OWNER_FEE: u64 = 100; // 1% in basis points
const MARKETPLACE_FEE: u64 = 200; // 2% in basis points
const REVEAL_INTERVAL: i64 = 2 * 24 * 60 * 60; // 2 days in seconds

#[program]
pub mod sequential_lottery {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        lottery.current_round = 0;
        lottery.current_reveal_index = 0;
        lottery.last_reveal_time = Clock::get()?.unix_timestamp;
        lottery.accumulated_prize = 0;
        lottery.round_complete = false;
        lottery.bump = ctx.bumps.lottery; // Simple direct access
        Ok(())
    }

    pub fn mint_ticket(ctx: Context<MintTicket>, numbers: [u8; 6]) -> Result<()> {
        for num in numbers.iter() {
            require!(*num <= 99, ErrorCode::InvalidNumberRange);
        }

        let lottery = &mut ctx.accounts.lottery;
        
        let existing_ticket = lottery.tickets.iter().find(|t| t.numbers == numbers);
        require!(existing_ticket.is_none(), ErrorCode::DuplicateSequence);

        let owner_fee = MINT_PRICE.checked_mul(OWNER_FEE).unwrap() / 10000;
        let prize_contribution = MINT_PRICE.checked_sub(owner_fee).unwrap();

        lottery.accumulated_prize = lottery.accumulated_prize.checked_add(prize_contribution).unwrap();

        let ticket = Ticket {
            numbers,
            claimed: false,
            owner: *ctx.accounts.user.key,
            mint_time: Clock::get()?.unix_timestamp,
        };

        lottery.tickets.push(ticket);

        emit!(TicketMinted {
            ticket_id: lottery.tickets.len() as u64 - 1,
            owner: *ctx.accounts.user.key,
            numbers,
        });

        Ok(())
    }

    // Change the reveal_number function to:
    pub fn reveal_number(ctx: Context<RevealNumber>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        require!(!lottery.round_complete, ErrorCode::RoundComplete);
        require!(
            Clock::get()?.unix_timestamp >= lottery.last_reveal_time + REVEAL_INTERVAL,
            ErrorCode::TooEarlyForReveal
        );

        let slot_hashes_account = ctx.accounts.slot_hashes.to_account_info();
        let _slot_hashes = SlotHashes::from_account_info(&slot_hashes_account)?;
        let recent_slot = _slot_hashes.slot_hashes().first().unwrap().0;
        let number = (recent_slot % 100) as u8;

        // Store current_reveal_index in local variable to avoid borrow conflict
        let reveal_index = lottery.current_reveal_index;
        lottery.revealed_numbers[reveal_index as usize] = number;

        emit!(NumberRevealed {
            round: lottery.current_round,
            number,
            reveal_index,
        });

        lottery.current_reveal_index += 1;
        lottery.last_reveal_time = Clock::get()?.unix_timestamp;

        if lottery.current_reveal_index == 6 {
            lottery.round_complete = true;
        }

        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>, ticket_id: u64) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        require!(lottery.round_complete, ErrorCode::RoundNotComplete);
        require!(ticket_id < lottery.tickets.len() as u64, ErrorCode::InvalidTicketId);

        let revealed_numbers = lottery.revealed_numbers;
        let ticket = &mut lottery.tickets[ticket_id as usize];
        require!(!ticket.claimed, ErrorCode::PrizeAlreadyClaimed);
        require!(*ctx.accounts.user.key == ticket.owner, ErrorCode::NotTicketOwner);

        let mut is_winner = true;
        for i in 0..6 {
            if ticket.numbers[i] != revealed_numbers[i] {
                is_winner = false;
                break;
            }
        }

        require!(is_winner, ErrorCode::NotWinningTicket);

        ticket.claimed = true;
        let prize = lottery.accumulated_prize;
        lottery.accumulated_prize = 0;

        **ctx.accounts.lottery.to_account_info().try_borrow_mut_lamports()? -= prize;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += prize;

        emit!(PrizeAwarded {
            winner: *ctx.accounts.user.key,
            amount: prize,
        });

        Ok(())
    }

    pub fn start_new_round(ctx: Context<StartNewRound>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        require!(lottery.round_complete, ErrorCode::RoundNotComplete);

        lottery.current_round += 1;
        lottery.current_reveal_index = 0;
        lottery.round_complete = false;
        lottery.last_reveal_time = Clock::get()?.unix_timestamp;

        emit!(NewRoundStarted {
            round: lottery.current_round,
        });

        Ok(())
    }

    // For listing a ticket
    pub fn list_ticket(ctx: Context<ListTicket>, ticket_id: u64, price: u64) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        require!(ticket_id < lottery.tickets.len() as u64, ErrorCode::InvalidTicketId);
        
        let ticket = &lottery.tickets[ticket_id as usize];
        require!(*ctx.accounts.user.key == ticket.owner, ErrorCode::NotTicketOwner);
        require!(price > 0, ErrorCode::InvalidPrice);

        // Check if ticket is already listed
        let existing_listing = lottery.marketplace_listings.iter()
            .position(|listing| listing.ticket_id == ticket_id);
        
        if let Some(pos) = existing_listing {
            // Update existing listing
            lottery.marketplace_listings[pos].price = price;
            lottery.marketplace_listings[pos].active = true;
        } else {
            // Add new listing
            lottery.marketplace_listings.push(MarketplaceListing {
                ticket_id,
                seller: *ctx.accounts.user.key,
                price,
                active: true,
            });
        }

        emit!(TicketListed {
            ticket_id,
            seller: *ctx.accounts.user.key,
            price,
        });

        Ok(())
    }

    // For removing a listing
    pub fn delist_ticket(ctx: Context<DelistTicket>, ticket_id: u64) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        require!(ticket_id < lottery.tickets.len() as u64, ErrorCode::InvalidTicketId);
        
        // Find the listing
        let listing_position = lottery.marketplace_listings.iter()
            .position(|listing| listing.ticket_id == ticket_id && listing.active)
            .ok_or(ErrorCode::TicketNotListed)?;
        
        let listing = &lottery.marketplace_listings[listing_position];
        require!(listing.seller == *ctx.accounts.user.key, ErrorCode::NotSeller);

        // Set active to false or remove entirely
        lottery.marketplace_listings[listing_position].active = false;
        // Alternatively: lottery.marketplace_listings.remove(listing_position);

        emit!(TicketDelisted {
            ticket_id,
            seller: *ctx.accounts.user.key,
        });

        Ok(())
    }

    // For buying a ticket
    pub fn buy_ticket(ctx: Context<BuyTicket>, ticket_id: u64) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        
        // Find the listing
        let listing_position = lottery.marketplace_listings.iter()
            .position(|listing| listing.ticket_id == ticket_id && listing.active)
            .ok_or(ErrorCode::TicketNotListed)?;
        
        let listing = &lottery.marketplace_listings[listing_position];
        let price = listing.price;
        let seller = listing.seller;
        
        require!(ctx.accounts.user.lamports() >= price, ErrorCode::InsufficientFunds);
        require!(seller != *ctx.accounts.user.key, ErrorCode::CannotBuyOwnTicket);

        // Calculate fees
        let owner_fee = price.checked_mul(OWNER_FEE).unwrap() / 10000;
        let marketplace_fee = price.checked_mul(MARKETPLACE_FEE).unwrap() / 10000;
        let total_fee = owner_fee.checked_add(marketplace_fee).unwrap();
        let seller_amount = price.checked_sub(total_fee).unwrap();

        // Update ticket ownership
        lottery.tickets[ticket_id as usize].owner = *ctx.accounts.user.key;
        
        // Mark listing as inactive
        lottery.marketplace_listings[listing_position].active = false;

        // Transfer funds
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? -= price;
        **ctx.accounts.lottery.to_account_info().try_borrow_mut_lamports()? += owner_fee;
        **ctx.accounts.marketplace.to_account_info().try_borrow_mut_lamports()? += marketplace_fee;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_amount;

        emit!(TicketSold {
            ticket_id,
            seller,
            buyer: *ctx.accounts.user.key,
            price,
        });

        Ok(())
    }
}

#[account]
pub struct Lottery {
    pub current_round: u64,
    pub current_reveal_index: u8,
    pub last_reveal_time: i64,
    pub accumulated_prize: u64,
    pub round_complete: bool,
    pub tickets: Vec<Ticket>,
    pub revealed_numbers: [u8; 6],
    // Replace HashMap/BTreeMap with a Vec of tuples (or a custom struct)
    pub marketplace_listings: Vec<MarketplaceListing>,
    pub bump: u8,
}

// #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
#[account]
pub struct MarketplaceListing {
    pub ticket_id: u64,
    pub seller: Pubkey,
    pub price: u64,
    pub active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Ticket {
    pub numbers: [u8; 6],
    pub claimed: bool,
    pub owner: Pubkey,
    pub mint_time: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Listing {
    pub seller: Pubkey,
    pub price: u64,
    pub active: bool,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<Lottery>(),
        seeds = [b"lottery"],
        bump
    )]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Slot hashes account for randomness
    pub slot_hashes: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RevealNumber<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    pub admin: Signer<'info>,
    /// CHECK: Slot hashes account for randomness
    pub slot_hashes: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct StartNewRound<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct ListTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct DelistTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Seller account
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    /// CHECK: Marketplace account
    #[account(mut)]
    pub marketplace: AccountInfo<'info>,
}

#[event]
pub struct TicketMinted {
    pub ticket_id: u64,
    pub owner: Pubkey,
    pub numbers: [u8; 6],
}

#[event]
pub struct NumberRevealed {
    pub round: u64,
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
    pub round: u64,
}

#[event]
pub struct TicketListed {
    pub ticket_id: u64,
    pub seller: Pubkey,
    pub price: u64,
}

#[event]
pub struct TicketDelisted {
    pub ticket_id: u64,
    pub seller: Pubkey,
}

#[event]
pub struct TicketSold {
    pub ticket_id: u64,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number range, must be between 0 and 99")]
    InvalidNumberRange,
    #[msg("This number sequence already exists")]
    DuplicateSequence,
    #[msg("Round is complete")]
    RoundComplete,
    #[msg("Too early for next reveal")]
    TooEarlyForReveal,
    #[msg("Round not complete")]
    RoundNotComplete,
    #[msg("Prize already claimed")]
    PrizeAlreadyClaimed,
    #[msg("Not ticket owner")]
    NotTicketOwner,
    #[msg("Ticket numbers don't match")]
    NotWinningTicket,
    #[msg("Invalid ticket ID")]
    InvalidTicketId,
    #[msg("Price must be greater than 0")]
    InvalidPrice,
    #[msg("Ticket not listed")]
    TicketNotListed,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Cannot buy your own ticket")]
    CannotBuyOwnTicket,
    #[msg("Not the seller")]
    NotSeller,
}