use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
    token_2022::{transfer_checked, TransferChecked},
};
use solana_program::{native_token::LAMPORTS_PER_SOL, system_instruction};

use crate::states::Config;

#[derive(Accounts)]
pub struct Swap<'info> {
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
    pub token_authority: AccountInfo<'info>,

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
        init_if_needed,
        payer = user,
        associated_token::mint = token,
        associated_token::authority = user,
    )]
    user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Swap<'info> {
    pub fn transfer_token_out(&self, amount: u64) -> Result<()> {
        let config_key = self.config.key();
        let config = self.config.clone();

        let authority_seed = &[
            &b"token-authority"[..],
            &config_key.as_ref(),
            &[config.token_auth_bump],
        ];

        let cpi_accounts = TransferChecked {
            from: self.token_vault.to_account_info(),
            to: self.user_ata.to_account_info(),
            authority: self.token_authority.to_account_info(),
            mint: self.token.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();

        transfer_checked(
            CpiContext::new(cpi_program, cpi_accounts).with_signer(&[authority_seed]),
            amount,
            self.token.decimals,
        )
    }

    pub fn transfer_token_in(&self, amount: u64) -> Result<()> {
        let cpi_accounts = TransferChecked {
            from: self.user_ata.to_account_info(),
            to: self.token_vault.to_account_info(),
            authority: self.user.to_account_info(),
            mint: self.token.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();

        transfer_checked(
            CpiContext::new(cpi_program, cpi_accounts),
            amount,
            self.token.decimals,
        )
    }

    pub fn transfer_lamports_in(&self, amount: u64) -> Result<()> {
        let from_account = self.user.clone();
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

    pub fn transfer_lamports_out(&self, amount: u64) -> Result<()> {
        let to_account = self.user.clone();
        let from_account = self.token_authority.clone();

        **from_account.try_borrow_mut_lamports()? -= amount;
        **to_account.try_borrow_mut_lamports()? += amount;
        Ok(())
    }
}

pub fn swap_handler(ctx: Context<Swap>, amount: u64, sol_to_token: bool) -> Result<()> {
    let config = &ctx.accounts.config;
    if sol_to_token {
        let amount_out = u64::try_from(
            (amount as u128)
                .checked_mul(10)
                .unwrap()
                .checked_mul(config.token_decimals.into())
                .unwrap()
                .checked_div(LAMPORTS_PER_SOL.into())
                .unwrap(),
        )
        .unwrap();
        ctx.accounts.transfer_lamports_in(amount)?;
        ctx.accounts.transfer_token_out(amount_out)?;
    } else {
        let amount_out = u64::try_from(
            (amount as u128)
                .checked_mul(LAMPORTS_PER_SOL.into())
                .unwrap()
                .checked_div(config.token_decimals.into())
                .unwrap()
                .checked_div(10)
                .unwrap(),
        )
        .unwrap();
        ctx.accounts.transfer_token_in(amount)?;
        ctx.accounts.transfer_lamports_out(amount_out)?;
    }
    Ok(())
}
