# Deployment and Execution Guide

This guide details the steps for deploying smart contracts, executing test suites.

## Prerequisites

Ensure your development setup includes the following tools:

- **Node.js**: [https://nodejs.org/](https://nodejs.org/)
- **Yarn** (Optional): [https://yarnpkg.com/](https://yarnpkg.com/)
- **Rust**: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
- **Solana CLI**: [https://docs.solana.com/cli/install-solana-cli-tools](https://docs.solana.com/cli/install-solana-cli-tools)
- **Anchor**: [https://project-serum.github.io/anchor/getting-started/installation.html](https://project-serum.github.io/anchor/getting-started/installation.html)

## Project configuration
You can find the configuration example in `.env.example`

## Deploying the Smart Contract

1. **Build the contract**:
   Compile your contract in the project root:

   ```bash
   anchor build
   ```

   Run `anchor keys list` to get the new program id

   Replace the program id on `lib.rs`, `.env`, `Anchor.toml` with the new one

2. **Deploy the contract**:
   Deploy to the network with Anchor:

   ```bash
   anchor deploy
   ```

3. **Upload program's IDL**: `anchor idl init -f target/idl/remitano_test.json`

## Running Tests

The `cluster` property in `Anchor.toml` should be `localnet`

Execute the Anchor-generated test suite:

```bash
anchor test
```

## Script
Remember to update the `.env`
#### The script will read wallet path from `.env`, so don't replace `wallet.json` if you want to run script.
- Create token: `yarn run createToken`
- Init: `yarn run init {tokenAddress}`
- Provide liquidity: `yarn run provideLiquidity {configPDA} {tokenAmount} {lamportAmount}`
- Swap: `yarn run swap {configPDA} {amount} {isSolToToken}`. With isSolToToken = 1 or 0

## Deployments

### Devnet

- Program ID => `9ZXve67dGXtRVTiK9CyiFHX6wQXJALxY6bKhm4Tn6mx9`
- Token => `A48JQmCwFdyVzUc5azETuMaLg9ZRCHnUARjWkbmkFXAd`
- Config => `6WLpiybuKshXkJ38e8xf68n5SWg2URkrQpSH2EyBHFmp`

### Transactions
- Init config: https://explorer.solana.com/tx/26Fq2t3TuZeJVAuN3xAkuMvEYCLr8JiR9ALbdoZHHervdaEHutxHX8JAEudLbD8QCWu8oWpTWGMvYQJMGjv9otcQ?cluster=devnet
- Provide Liquidity: https://explorer.solana.com/tx/3YAZ61vTHCzoWpc5WS6FgWkVaNd9PA5UPg87b6nwX9sur9QngMobNGNzDzDCb2wB98oP4CNXBUanFz9aDK2B4MTY?cluster=devnet
- Swap: 
    - https://explorer.solana.com/tx/3RW2FoXEmbChKBBrTr73jCC4Ppzx37g23WtgWTzGFzQxfUcS1vzUsjCTRbJCPr6wAASfNajuSzzh4dttW9osRnRg?cluster=devnet
    - https://explorer.solana.com/tx/45M6huTvx6xzpkqf6wVEL3c5f6RDVWSBLB3dDreD5831j4WhYJcUVCLei5G5i2jA9CWEwkAmWDLX5Cjv9pE261dd?cluster=devnet