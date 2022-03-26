
import * as sweb3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import * as splToken from '@solana/spl-token'
import { EmptyAccount } from './fee-redeemer';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';


export interface EmptyAccountInfo {
    id: number,
    account: EmptyAccount,
    lamports: number,
    image?: string,
    name?: string
  }

export async function getEmptyAccountInfos(connection: sweb3.Connection, accounts: EmptyAccount[]) : Promise<EmptyAccountInfo[]> {
    return accounts.map((acc , i) => {
        const adr =acc.publicKey.toBase58();
         return {account: acc, 
            id: i, 
            link:getSolscanLink(adr),
            lamports: acc.lamports
    }});
}

export function getSolscanLink(address: string) : string {
    return "https://solscan.io/address/"+address;
}


