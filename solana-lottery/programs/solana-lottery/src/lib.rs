use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

declare_id!("4d4Nd6vvFzAgasyzC2tkp9cWaMKEaT36ygKLJgCFnCm9"); // Replace with your program ID

#[program]
pub mod nft_minter {
    use super::*;

    pub fn mint_nft(
        ctx: Context<MintNFT>,
        uri: String, 
        name: String, 
        symbol: String,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let mint_authority = &ctx.accounts.mint_authority;
        let token_program = &ctx.accounts.token_program;

        // Initialize mint
        let mint_key = mint.key();
        let mint_seeds: &[&[u8]] = &[b"mint", mint_key.as_ref()];

        let signer = &[&mint_seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                MintTo {
                    mint: mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: mint_authority.to_account_info(),
                },
                signer,
            ),
            1, // NFT (only one token)
        )?;

        msg!("NFT Minted: {} - {}", name, symbol);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintNFT<'info, AssociatedToken> {
    #[account(init, payer = payer, mint::decimals = 0, mint::authority = mint_authority, mint::freeze_authority = mint_authority)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(init, payer = payer, associated_token::mint = mint, associated_token::authority = mint_authority)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

