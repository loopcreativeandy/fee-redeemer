
import * as sweb3 from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { EmptyAccount } from './fee-redeemer';
import { GridSelectionModel } from '@mui/x-data-grid';


export interface EmptyAccountInfo {
    id: number,
    account: EmptyAccount,
    lamports: number,
    metadata?: sweb3.PublicKey,
    image?: string,
    name?: string
  }

export async function getEmptyAccountInfos(connection: sweb3.Connection, accounts: EmptyAccount[], callback?: any) : Promise<EmptyAccountInfo[]> {
    const accList = accounts.map((acc , i) => {
        const adr =acc.publicKey.toBase58();
         return {account: acc, 
            id: i, 
            link:getSolscanLink(adr),
            lamports: acc.lamports
    }});

    //accList.forEach(element => populateMetadataInfo(connection, element));
    populateAll(connection, accList, callback);

    return accList;
}

async function populateAll(connection: sweb3.Connection, accounts: EmptyAccountInfo[], callback?:any) {
    for(const acc of accounts){
        await populateMetadataInfo(connection, acc);
    }
    callback(accounts);
}

export function getSolscanLink(address: string) : string {
    return "https://solscan.io/address/"+address;
}

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  );

async function getMetadataAccount(mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
      )
    )[0];
  };

async function populateMetadataInfo(connection: sweb3.Connection, accountInfo: EmptyAccountInfo) {
    const metadataAccount = await getMetadataAccount(accountInfo.account.mint);
    accountInfo.metadata = metadataAccount;
    accountInfo.name = await getNFTName(connection, metadataAccount);
    console.log(metadataAccount.toBase58()+ " "+ accountInfo.name);
}

async function getNFTName(connection: sweb3.Connection, metadataAccount: sweb3.PublicKey) : Promise<string | undefined>{
    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

    if(metadataAccountInfo){
        const nameBuffer = metadataAccountInfo.data.slice(1+32+32+4, 1+32+32+4+32);
        
        const nameLenght = metadataAccountInfo.data.readUInt32LE(1+32+32);
        let name = "";
        for (let j = 0; j< nameLenght; j++){
            if (nameBuffer.readUInt8(j)===0) break;
            name += String.fromCharCode(nameBuffer.readUInt8(j));
        }
        return name;
    }
    return undefined;
}



export function getSelectedPKsToClose(emptyAccountsInfos: EmptyAccountInfo[], selectionModel?: GridSelectionModel): sweb3.PublicKey[] {
    return emptyAccountsInfos.filter(eai => selectionModel?selectionModel.includes(eai.id):true)
    .map(eai=>eai.account.publicKey);
}
