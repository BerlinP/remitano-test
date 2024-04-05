use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
    token_2022::{transfer_checked, TransferChecked},
};
use solana_program::system_instruction;

use crate::states::Config;

#[derive(Accounts)]
pub struct ProvideLiquidity<'info> {
    #[account(
        mut,
        seeds = [
            b"config", 
            config.token.as_ref(),
            config.creator.as_ref(),
        ],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: This account is not read or written
    #[account(
        mut,
        seeds = [
            b"token-authority",
            config.key().as_ref()
        ],
        bump = config.token_auth_bump
    )]
    pub token_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = token,
        associated_token::authority = token_authority
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        constraint = token.key() == config.token
    )]
    pub token: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token,
        associated_token::authority = provider,
    )]
    provider_ata: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub provider: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> ProvideLiquidity<'info> {
    pub fn transfer_token_ctx(&self) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            from: self.provider_ata.to_account_info(),
            to: self.token_vault.to_account_info(),
            authority: self.provider.to_account_info(),
            mint: self.token.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();

        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn transfer_lamports(&self, amount: u64) -> Result<()> {
        let from_account = self.provider.clone();
        let to_account = self.token_authority.clone();
        let sys_program = self.system_program.clone();

        // Create the transfer instruction
        let transfer_instruction =
            system_instruction::transfer(from_account.key, &to_account.key(), amount);

        // Invoke the transfer instruction
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                from_account.to_account_info(),
                to_account.to_account_info(),
                sys_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

pub fn provide_liquidity_handler(
    ctx: Context<ProvideLiquidity>,
    lamport_amount: u64,
    token_amount: u64,
) -> Result<()> {
    if lamport_amount > 0 {
        ctx.accounts.transfer_lamports(lamport_amount)?;
    }
    if token_amount > 0 {
        transfer_checked(
            ctx.accounts.transfer_token_ctx(),
            token_amount,
            ctx.accounts.token.decimals,
        )?;
    }
    Ok(())
}
