use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub creator: Pubkey,
    pub token: Pubkey,
    pub token_decimals: u64,
    pub bump: u8,
    pub token_auth_bump: u8,
}
