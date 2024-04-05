import { AnchorProvider, Program, Wallet, setProvider, utils } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Signer, TransactionMessage } from "@solana/web3.js";
import * as fs from 'node:fs';
import * as path from 'path';
import dotenv from "dotenv";
import { RemitanoTest } from "../target/types/remitano_test";

dotenv.config()

export function getSigner(): Wallet {
    const secret = JSON.parse(fs.readFileSync(process.env.WALLET, "utf8"))
    const wallet = new Wallet(Keypair.fromSecretKey(Uint8Array.from(secret)))
    return wallet
  }
  
  export function getProgram(): Program<RemitanoTest> {
    const connection = getConnection()
    const provider = new AnchorProvider(connection, getSigner(), {})
    setProvider(provider)
    const idlPath = path.join("./target", "idl", `remitano_test.json`);
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    return new Program(idl, process.env.PROGRAM_ID);
  }
  
  export function getConnection(): Connection {
    const CLUSTER_RPC = process.env.CLUSTER
    return new Connection(CLUSTER_RPC)
  }