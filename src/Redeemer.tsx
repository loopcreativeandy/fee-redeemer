import { useEffect, useState } from "react";
import { Container, Paper, Snackbar } from "@material-ui/core";
import styled from 'styled-components';
import Alert from "@mui/material/Alert";
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { DataGrid, GridColDef, GridSelectionModel, GridValueGetterParams } from '@mui/x-data-grid';

import * as anchor from "@project-serum/anchor";

// import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import { getEmptyAccountInfos, EmptyAccountInfo, getSolscanLink, getSelectedPKsToClose } from "./utils"
import { EmptyAccount, TotalRedemptions, findEmptyTokenAccounts, createCloseEmptyAccountsTransactions, getTotalRedemptions, getPKsToClose} from "./fee-redeemer";
import { Header } from "./Header";
import { RedeemButton } from "./RedeemButton";
import Link from "@mui/material/Link";

export interface RedeemerProps {
  connection: anchor.web3.Connection;
  rpcHost: string;
  frcntrProgramId: anchor.web3.PublicKey;
  frcntrAccount: anchor.web3.PublicKey;
  donationAddress: anchor.web3.PublicKey;
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

const emptyAccountsColumns: GridColDef[] = [
  { field: 'id', headerName: 'id', width: 40} ,
  { field: 'account', headerName: 'address', width: 400,
  renderCell: (cellValues) => {
    const adr = cellValues.row.account.publicKey.toBase58();
    return <Link href={getSolscanLink(adr)} target="_blank">{adr}</Link>;
  } },
  { field: 'lamports', headerName: 'lamports', width: 100} ,
  { field: 'mint', headerName: 'mint', width: 400,
  renderCell: (cellValues) => {
    const adr = cellValues.row.account.mint.toBase58();
    return <Link href={getSolscanLink(adr)} target="_blank">{adr}</Link>;
  } },
  { field: 'name', headerName: 'name', width: 200} ,
  //   valueGetter: (params: GridValueGetterParams) =>
  //     `${params.row.firstName || ''} ${params.row.lastName || ''}`,
  // },
  
  
];


const Redeemer = (props: RedeemerProps) => {
  const connection = props.connection;
  //const [balance, setBalance] = useState<number>();
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyAccount[]>();
  const [totalRedemptions, setTotalRedemptions] = useState<TotalRedemptions>();
  const [emptyAccountInfos, setEmptyAccountInfos] = useState<EmptyAccountInfo[]>();
  const [showTable, setShowTable] = useState<boolean>(false);
  //const [isInTransaction, setIsInTransaction] = useState(false); 
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>();
  const [donationPercentage, setDonationPercentage] = useState<number>(10);

  const handleDonationChange = (event: Event, newValue: number | number[]) => {
    setDonationPercentage(newValue as number);
  };

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

      setEmptyAccounts(updatedEA);
      
      const totalInfo = await getTotalRedemptions(connection,props.frcntrAccount);

      if(totalInfo){
        setTotalRedemptions(totalInfo);
      }

      
    })();
  };

  const enableTable = async () => {
    if(!emptyAccounts) return;
    setShowTable(true);

    const updateStateCallback = (data : EmptyAccountInfo[]) => {
      setEmptyAccountInfos(undefined);setEmptyAccountInfos(data);}
      const eaInfos = await getEmptyAccountInfos(connection, emptyAccounts, updateStateCallback);
      if (eaInfos) {
        setEmptyAccountInfos(eaInfos);
        const allIDs : number[] = eaInfos.map(ea=>ea.id);
        setSelectionModel(allIDs); // select all
      }

  }

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
      if (wallet && wallet.publicKey && emptyAccounts && emptyAccounts.length>0) {

        const closablePKs = getPKsToClose(emptyAccounts);
        let selectedPKs = closablePKs;
        if(selectionModel && emptyAccountInfos){
          console.log(selectionModel.length+ " empty accounts selected.");
          selectedPKs = getSelectedPKsToClose(emptyAccountInfos, selectionModel);
          console.log(selectedPKs.length+ " accounts in queue.");
        }

        const transactions = await createCloseEmptyAccountsTransactions(wallet.publicKey, selectedPKs, props.frcntrAccount, program, donationPercentage, props.donationAddress);
        for (const ta of transactions){
          const txid = await wallet.sendTransaction(ta,connection);
          console.log(txid);
          const instrCnt = ta.instructions.length;
          console.log("Attempting to close accounts ("+ instrCnt + " instructions)");

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
      //loadEmptyAccounts();
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
                <Stack spacing={2} direction="row" alignItems="center">
                <p>Donate:</p>
                <Slider aria-label="Donation Percentage" defaultValue={10} step={1} min={0} max={100} onChange={handleDonationChange} color="secondary"/>
                <p>{donationPercentage}%</p>
                </Stack>
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
      {!showTable ? <p onClick={enableTable} style={{ color: "white", textAlign: "center", cursor: "pointer"}}>Show Details</p> : 
      emptyAccountInfos && emptyAccountInfos.length>0 ?
      <div style={{ width: '100%' }}>
          <DataGrid sx={{
              color: "white",
              border: 2,
            }}
            autoHeight
            rows={emptyAccountInfos}
            columns={emptyAccountsColumns}
            checkboxSelection
            selectionModel={selectionModel}
            onSelectionModelChange={setSelectionModel}
          />
      </div>
      :<p>No empty accounts.</p>}
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
