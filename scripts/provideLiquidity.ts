import * as anchor from "@coral-xyz/anchor";
import { web3, utils, BN } from '@coral-xyz/anchor';
import { getProgram } from './utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

function getConfigAddress(): string {
    return process.argv[2]
}

function getTokenAmount(): string {
    return process.argv[3]
}

function getLamportAmount(): string {
    return process.argv[4]
}

async function main() {
    const program = getProgram()

    const config = new web3.PublicKey(getConfigAddress());

    const configData = await program.account.config.fetch(config)

    const token = configData.token

    const [tokenAuthority] = web3.PublicKey.findProgramAddressSync([
        utils.bytes.utf8.encode("token-authority"),
        config.toBytes()
    ], program.programId);

    const tokenVault = getAssociatedTokenAddressSync(token, tokenAuthority, true)
    const providerAta = getAssociatedTokenAddressSync(token, program.provider.publicKey, true)

    await program.methods.provideLiquidity(
        new anchor.BN(getLamportAmount()),
        new anchor.BN(getTokenAmount()),
      )
      .accounts({
        config,
        token,
        tokenVault,
        tokenAuthority,
        providerAta,
      })
      .rpc()
}

main()
    .then(console.log)
    .catch(console.log)