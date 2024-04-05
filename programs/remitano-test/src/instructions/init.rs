use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::states::Config;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Config::INIT_SPACE,
        seeds = [
            b"config", 
            token.key().as_ref(),
            creator.key().as_ref()
        ],
        bump
    )]
    pub config: Account<'info, Config>,
    /// CHECK: This account is not read or written
    #[account(
        init,
        payer = creator,
        space = 8,
        seeds = [
            b"token-authority",
            config.key().as_ref()
        ],
        bump
    )]
    pub token_authority: AccountInfo<'info>,

    #[account()]
    pub token: Account<'info, Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = token,
        associated_token::authority = token_authority
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(ctx: Context<Initialize>) -> Result<()> {
    let creator = ctx.accounts.creator.key();
    let token = &ctx.accounts.token;
    let bump = ctx.bumps.config;
    let token_auth_bump = ctx.bumps.token_authority;

    let config = &mut ctx.accounts.config;
    **config = Config {
        creator,
        token: token.key(),
        bump,
        token_auth_bump,
        token_decimals: u64::pow(10, token.decimals.into()),
    };

    Ok(())
}
