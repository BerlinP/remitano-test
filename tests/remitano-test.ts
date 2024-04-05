import * as anchor from "@coral-xyz/anchor";
import { web3, utils } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../wallet.json";

import { RemitanoTest } from "../target/types/remitano_test";
import { expect, use } from "chai";

const keypair = web3.Keypair.fromSecretKey(new Uint8Array(wallet));

describe("remitano-test", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RemitanoTest as Program<RemitanoTest>;
  let tokenMint: web3.PublicKey
  let tokenAuthority: web3.PublicKey
  let configPDA: web3.PublicKey
  let tokenVault: web3.PublicKey
  let userATA: web3.PublicKey

  before(async () => {
    tokenMint = await createMint(
      provider.connection,
      keypair, // rent payer for this account
      provider.publicKey, // mint authority
      provider.publicKey, // freeze authority
      8, // decimals
    );

    [configPDA] = web3.PublicKey.findProgramAddressSync([
      utils.bytes.utf8.encode("config"),
      tokenMint.toBytes(),
      provider.publicKey.toBytes(),
    ], program.programId);

    [tokenAuthority] = web3.PublicKey.findProgramAddressSync([
      utils.bytes.utf8.encode("token-authority"),
      configPDA.toBytes()
    ], program.programId);

    tokenVault = getAssociatedTokenAddressSync(tokenMint, tokenAuthority, true)

    const userTokenATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      keypair,
      tokenMint,
      keypair.publicKey,
    );
    userATA = userTokenATA.address
    await mintTo(provider.connection, keypair, tokenMint, userATA, keypair, 100 * 1_000_000_000)
  })

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize()
    .accounts({
      config: configPDA,
      token: tokenMint,
      tokenVault,
      tokenAuthority,
      creator: provider.publicKey
    })
    .signers([keypair])
    .rpc({skipPreflight: true});
    console.log("Your transaction signature", tx);
  });

  it("Provide liquidity", async () => {
    await program.methods.provideLiquidity(
      new anchor.BN('10000000000'),
      new anchor.BN('10000000000'),
    )
    .accounts({
      config: configPDA,
      token: tokenMint,
      tokenVault,
      tokenAuthority,
      providerAta: userATA,
      provider: provider.publicKey
    })
    .rpc({skipPreflight: true})
    const lamportBalance = await provider.connection.getBalance(tokenAuthority)
    const tokenBalance = await provider.connection.getTokenAccountBalance(tokenVault)
    expect(lamportBalance/web3.LAMPORTS_PER_SOL).closeTo(10, 1e-3)
    expect(tokenBalance.value.amount).eq('10000000000')
  })

  it("Swap from sol to token", async () => {
    const lamportBalanceBefore = await provider.connection.getBalance(provider.publicKey)
    const tokenBalanceBefore = await provider.connection.getTokenAccountBalance(userATA)
    await program.methods.swap(
      new anchor.BN('100000000'),
      true
    )
    .accounts({
      config: configPDA,
      token: tokenMint,
      tokenVault,
      tokenAuthority,
      userAta: userATA,
      user: provider.publicKey
    })
    .rpc({
      skipPreflight: true
    })
    
    const lamportBalanceAfter = await provider.connection.getBalance(provider.publicKey)
    const tokenBalanceAfter = await provider.connection.getTokenAccountBalance(userATA)
    expect((lamportBalanceBefore - lamportBalanceAfter)/web3.LAMPORTS_PER_SOL).closeTo(0.1, 1e-5)
    expect(tokenBalanceAfter.value.uiAmount - tokenBalanceBefore.value.uiAmount).eq(1)
  })

  it("Swap from token to sol", async () => {
    const lamportBalanceBefore = await provider.connection.getBalance(provider.publicKey)
    const tokenBalanceBefore = await provider.connection.getTokenAccountBalance(userATA)
    await program.methods.swap(
      new anchor.BN('100000000'),
      false
    )
    .accounts({
      config: configPDA,
      token: tokenMint,
      tokenVault,
      tokenAuthority,
      userAta: userATA,
      user: provider.publicKey
    })
    .rpc({
      skipPreflight: true
    })
    const lamportBalanceAfter = await provider.connection.getBalance(provider.publicKey)
    const tokenBalanceAfter = await provider.connection.getTokenAccountBalance(userATA)
    expect((lamportBalanceAfter - lamportBalanceBefore)/web3.LAMPORTS_PER_SOL).closeTo(0.1, 1e-5)
    expect(tokenBalanceBefore.value.uiAmount - tokenBalanceAfter.value.uiAmount).eq(1)
  })
});
