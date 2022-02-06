
//import sweb3 = require('@solana/web3.js');
import * as sweb3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
//import base58 = require('bs58');
//import base58 from 'bs58';
//import splToken = require('@solana/spl-token');
import * as splToken from '@solana/spl-token'

export const RENT_PER_TOKEN_ACCOUNT_IN_SOL = 0.00203928;
export const MAX_CLOSE_INSTRUCTIONS = 16;


export interface EmptyAccounts {
    publicKeys: sweb3.PublicKey[];
    size: number;
    amount: number;
}

export interface TotalRedemptions {
    totalCloses: number;
    totalSolRedeemed: number;
}


export async function getTotalRedemptions(connection: sweb3.Connection, account: sweb3.PublicKey) : Promise<TotalRedemptions|null> {
    const buffer = await connection.getAccountInfo(account);
    if(!buffer || !buffer.data){
        console.log("Could net get account info for "+account.toBase58());
        return null;
    }
    const closedAccounts = buffer.data.readInt32LE(8)
    return {
        totalCloses: closedAccounts,
        totalSolRedeemed: RENT_PER_TOKEN_ACCOUNT_IN_SOL * closedAccounts
    }
}


export async function findEmptyTokenAccounts(connection: sweb3.Connection, owner: sweb3.PublicKey) : Promise<EmptyAccounts> {
    const response = await connection.getTokenAccountsByOwner(owner,{programId: splToken.TOKEN_PROGRAM_ID});
    console.log(response);
    const emptyAccounts: sweb3.PublicKey[] = [];
    let openLamports = 0;
    for (let account of response.value){
        console.log(account.pubkey.toBase58());
        let isEmpty = false;
        const offsetInBytes = 8*8;
        if(account.account.data.readBigUInt64LE){
            const amount = account.account.data.readBigUInt64LE(offsetInBytes);
            console.log("amount: "+amount);
            isEmpty = amount === 0n;
        } else {
            // readBigUInt64LE not available in older versions
            isEmpty = true;
            for (let i = 0; i<8; i++){
                if(account.account.data[offsetInBytes+i]!==0){
                    isEmpty = false;
                    break;
                }
            }
            console.log("account empty: "+isEmpty);
        }
        if(isEmpty){
            console.log("account empty!");
            emptyAccounts.push(account.pubkey);
            openLamports += account.account.lamports;
        }
    }
    return {
        publicKeys: emptyAccounts,
        size: emptyAccounts.length,
        amount: openLamports / sweb3.LAMPORTS_PER_SOL
    };

}

export async function createCloseEmptyAccountsTransactions(owner: sweb3.PublicKey, accountPKs: sweb3.PublicKey[], cntAccount?: sweb3.PublicKey, program?: anchor.Program): Promise<sweb3.Transaction[]> {

    const closeInstructions = accountPKs.map(accPK => splToken.Token.createCloseAccountInstruction(
        splToken.TOKEN_PROGRAM_ID,
        accPK,
        owner,
        owner,
        []
    ));

    let transactions: sweb3.Transaction[] = [];
    
    while(closeInstructions.length>0){
        const transaction = new sweb3.Transaction();
        for (let i = 0; i < MAX_CLOSE_INSTRUCTIONS; i++) {
            const nextInstr = closeInstructions.pop();
            if(nextInstr){
                transaction.add(nextInstr);
            } else {
                break;
            }
        }

        if(cntAccount && program){
            console.log("Program is here! "+program);
            const cntInstruction = program.instruction.count(
                {
                accounts:
                {
                  feecntrAccount: cntAccount,
                  instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        
                }
              });
              console.log("instruction created! ");
            transaction.add(cntInstruction);
        }

        transactions.push(transaction);
    }
    return transactions;
}
