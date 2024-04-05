import * as anchor from "@coral-xyz/anchor";
import { web3, utils, BN } from '@coral-xyz/anchor';
import { getProgram } from './utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

function getTokenMint(): string {
    return process.argv[2]
}

async function main() {
    const program = getProgram()

    const token = new web3.PublicKey(getTokenMint());

    const [config] = web3.PublicKey.findProgramAddressSync([
        utils.bytes.utf8.encode("config"),
        token.toBytes(),
        program.provider.publicKey.toBytes()
    ], program.programId);

    const [tokenAuthority] = web3.PublicKey.findProgramAddressSync([
        utils.bytes.utf8.encode("token-authority"),
        config.toBytes()
    ], program.programId);

    const tokenVault = getAssociatedTokenAddressSync(token, tokenAuthority, true)


    await program.methods.initialize()
        .accounts({
            config,
            token,
            tokenVault,
            tokenAuthority,
        })
        .rpc();
    console.log(`Config address`, config.toString())
}

main()
    .then(console.log)
    .catch(console.log)