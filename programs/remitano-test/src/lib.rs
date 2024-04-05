use anchor_lang::prelude::*;

mod instructions;
mod states;

use instructions::*;

declare_id!("9ZXve67dGXtRVTiK9CyiFHX6wQXJALxY6bKhm4Tn6mx9");

#[program]
pub mod remitano_test {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize_handler(ctx)
    }

    pub fn provide_liquidity(
        ctx: Context<ProvideLiquidity>,
        lamport_amount: u64,
        token_amount: u64,
    ) -> Result<()> {
        provide_liquidity_handler(ctx, lamport_amount, token_amount)
    }

    pub fn swap(ctx: Context<Swap>, amount: u64, sol_to_token: bool) -> Result<()> {
        swap_handler(ctx, amount, sol_to_token)
    }
}
