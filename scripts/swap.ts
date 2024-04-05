import * as anchor from "@coral-xyz/anchor";
import { web3, utils, BN } from '@coral-xyz/anchor';
import { getProgram } from './utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

function getConfigAddress(): string {
    return process.argv[2]
}

function getAmount(): string {
    return process.argv[3]
}

function getSolToToken(): string {
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
    const userAta = getAssociatedTokenAddressSync(token, program.provider.publicKey, true)

    await program.methods.swap(
        new anchor.BN(getAmount()),
        getSolToToken() == '1',
      )
      .accounts({
        config,
        token,
        tokenVault,
        tokenAuthority,
        userAta,
      })
      .rpc()
}

main()
    .then(console.log)
    .catch(console.log)