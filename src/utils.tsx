
import * as sweb3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import * as splToken from '@solana/spl-token'
import { ReactElement } from 'react';


export interface EmptyAccountInfo {
    id: number,
    address: string,
    link: string,
    image?: string,
    name?: string
  }

export async function getEmptyAccountInfos(connection: sweb3.Connection, accounts: sweb3.PublicKey[]) : Promise<EmptyAccountInfo[]> {
    return accounts.map((acc , i) => {const adr =acc.toBase58(); return {address: adr, id: i, link:getSolscanLink(adr)}});
}

function getSolscanLink(address: string) : string {
    return "https://solscan.io/address/"+address;
}

// function getReactLink(link: string, text: string) : ReactElement {
//     return <a href={link}>{text}</a>;
// }

