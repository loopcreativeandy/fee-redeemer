import { useEffect, useState } from "react";
import { Container, Paper, Snackbar } from "@material-ui/core";
import styled from 'styled-components';
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

// import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {EmptyAccounts, TotalRedemptions, findEmptyTokenAccounts, createCloseEmptyAccountsTransactions, getTotalRedemptions} from "./fee-redeemer";
import { Header } from "./Header";
import { RedeemButton } from "./RedeemButton";

export interface RedeemerProps {
  connection: anchor.web3.Connection;
  rpcHost: string;
  frcntrProgramId: anchor.web3.PublicKey;
  frcntrAccount: anchor.web3.PublicKey;
}

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const MainContainer = styled.div``; // add your owns styles here

const Redeemer = (props: RedeemerProps) => {
  const connection = props.connection;
  //const [balance, setBalance] = useState<number>();
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyAccounts>();
  const [totalRedemptions, setTotalRedemptions] = useState<TotalRedemptions>();
  //const [isInTransaction, setIsInTransaction] = useState(false); 
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  //const w2 = useWallet();
  //const rpcUrl = props.rpcHost;
  const wallet = useWallet();

  const anchorWallet = {
    publicKey: wallet.publicKey,
    signAllTransactions: wallet.signAllTransactions,
    signTransaction: wallet.signTransaction,
  } as anchor.Wallet;

  const provider = new anchor.Provider(connection, anchorWallet, {
    preflightCommitment: 'recent',
  });
  
  const idl = require("./frcnt_IDL.json");
  const program = new anchor.Program(idl, props.frcntrProgramId, provider);



  const loadEmptyAccounts = () => {
    (async () => {
      if (!wallet || !wallet.publicKey) return;
      //console.log("Finding empty token accounts");
      const updatedEA = await findEmptyTokenAccounts(connection,wallet.publicKey);
      //console.log("Found  "+updatedEA.size);
      
      const totalInfo = await getTotalRedemptions(connection,props.frcntrAccount);

      setEmptyAccounts(updatedEA);
      if(totalInfo){
        setTotalRedemptions(totalInfo);
      }
    })();
  };

  useEffect(loadEmptyAccounts, [
    wallet,
    connection,
    props.frcntrAccount
  ]);

  // useEffect(() => {
  //   (async () => {
  //     if (wallet && wallet.publicKey) {
  //       const balance = await connection.getBalance(wallet.publicKey);
  //       setBalance(balance / LAMPORTS_PER_SOL);
  //     }
  //   })();
  // }, [wallet, connection]);

  const onRedeem = async () => {
    try {
      //setIsInTransaction(true);
      if (wallet && wallet.publicKey && emptyAccounts && emptyAccounts.size>0) {



        const transactions = await createCloseEmptyAccountsTransactions(wallet.publicKey, emptyAccounts.publicKeys, props.frcntrAccount, program);
        for (const ta of transactions){
          const txid = await wallet.sendTransaction(ta,connection);
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
      console.trace();

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      // if (wallet && wallet.publicKey) {
      //   const balance = await props.connection.getBalance(wallet.publicKey);
      //   setBalance(balance / LAMPORTS_PER_SOL);
      // }
      //setIsInTransaction(false);
      loadEmptyAccounts();
    }
  }

  return (
    <Container style={{ marginTop: 100 }}>
      <Container maxWidth="xs" style={{ position: 'relative' }}>
        <Paper
          style={{ padding: 24, backgroundColor: '#151A1F', borderRadius: 6 }}
        >
          <h1>Solana Fee Redeemer</h1>
          {!wallet.connected ? (
            <ConnectButton>Connect Wallet</ConnectButton>
          ) : (
            <>
              <Header emptyAccounts={emptyAccounts} totalRedemptions={totalRedemptions} />
              <MainContainer>
                  <RedeemButton
                    emptyAccounts={emptyAccounts}
                    onClick={onRedeem}
                  />
              </MainContainer>
            </>
          )}
          <p style={{ color: "gray"}}>developed and maintained by solandy.sol</p>
          <p style={{ color: "gray"}}>follow me on <a href="https://twitter.com/HeyAndyS">Twitter</a> and <a href="https://www.youtube.com/channel/UCURIDSvXkuDf9XXe0wYnoRg">YouTube</a></p>
        </Paper>
      </Container>

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
    </Container>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

export default Redeemer;
