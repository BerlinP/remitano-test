import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { Metaplex } from "@metaplex-foundation/js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { getConnection, getSigner } from "./utils";

// Import our keypair from the wallet file
const connection = getConnection()

const wallet = getSigner()

const metaplex = Metaplex.make(connection);

async function main() {
  try {
    const mintAccount = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      9, // decimals
    );

    console.log("Mint Account Created: ", mintAccount.toBase58());

    const metadata = metaplex.nfts().pdas().metadata({ mint: mintAccount });

    const tx = new Transaction().add(
      createCreateMetadataAccountV3Instruction({
        metadata: metadata,
        mint: mintAccount,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey
      }, {
        createMetadataAccountArgsV3: {
          data: {
            name: "Move Token",
            symbol: "MOVE",
            uri: "",
            sellerFeeBasisPoints: 0,
            collection: null,
            creators: null,
            uses: null
          },
          isMutable: true,
          collectionDetails: null
        }
      })
    );

    // Send transactio on-chain
    await sendAndConfirmTransaction(connection, tx, [wallet.payer]);
    console.log("Metadata Created: ", metadata.toBase58());

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      mintAccount,
      wallet.publicKey,
    );

    console.log("Token Account Created: ", tokenAccount.address.toBase58());

    let decimals = 1_000_000_000;
    const sig = await mintTo(connection, wallet.payer, mintAccount, tokenAccount.address, wallet.payer, 10000 * decimals)

    console.log("Token Minted", sig);
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`)
  }
}

main()