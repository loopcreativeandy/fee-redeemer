import { useEffect, useState } from "react";
import { Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {EmptyAccounts, findEmptyTokenAccounts, createCloseEmptyAccountsTransactions} from "./fee-redeemer";

export interface RedeemerProps {
  connection: anchor.web3.Connection;
}

const Redeemer = (props: RedeemerProps) => {
  const connection = props.connection;
  const [balance, setBalance] = useState<number>();
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyAccounts>();
  //const [isInTransaction, setIsInTransaction] = useState(false); 
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const w2 = useWallet();
  const wallet = useAnchorWallet();

  const loadEmptyAccounts = () => {
    (async () => {
      if (!wallet) return;
      console.log("Finding empty token accounts");
      const updatedEA = await findEmptyTokenAccounts(connection,wallet.publicKey);
      console.log("Found  "+updatedEA.size);

      setEmptyAccounts(updatedEA);
    })();
  };

  useEffect(loadEmptyAccounts, [
    wallet,
    connection,
  ]);

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, connection]);

  const onRedeem = async () => {
    try {
      //setIsInTransaction(true);
      if (wallet && emptyAccounts && emptyAccounts.size>0) {
        const transactions = await createCloseEmptyAccountsTransactions(wallet.publicKey, emptyAccounts.publicKeys);
        for (const ta of transactions){
          const txid = await w2.sendTransaction(ta,connection);
          console.log(txid);
          console.log("Redeem sent");

          const res = await connection.confirmTransaction(txid, 'confirmed');
          if(!res.value.err){
            setAlertState({
              open: true,
              message: "Successfully redeemed some SOL!",
              severity: "success",
            });
          } else {
            setAlertState({
              open: true,
              message: res.value.err.toString(),
              severity: "warning",
            });
          }
        }

      }
    } catch (error: any) {
      let message = error.msg || "Redeem failed!";

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      //setIsInTransaction(false);
      loadEmptyAccounts();
    }
  }

  return (
    <main>
       <div style={{display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center', height: '100vh'}}>
      <h1>Fee Redeemer</h1>
      <div>
      {!wallet ? (
          <WalletDialogButton>Connect Wallet</WalletDialogButton>
        ) : (
          <div>
            {emptyAccounts && <p>You have {emptyAccounts?.size} empty token accounts and could redeem {emptyAccounts?.amount} SOL!</p>}
          <button
            disabled={!wallet}
            onClick={onRedeem}
          >Redeem</button>
          
          {wallet && <p>Your Balance: {(balance || 0).toLocaleString()} SOL</p>}
          </div>
        )}
        </div>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
      
      </div>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

export default Redeemer;
