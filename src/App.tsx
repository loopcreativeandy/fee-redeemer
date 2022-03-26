import './App.css';
import { useMemo } from 'react';
import * as anchor from '@project-serum/anchor';

import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';

import { ThemeProvider, createTheme } from '@material-ui/core';
import Redeemer from './Redeemer';

const theme = createTheme({
  palette: {
    type: 'dark',
  },
});

const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;
const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const frcntProgramID = new anchor.web3.PublicKey(process.env.REACT_APP_COUNTER_PROGRAM_ID!);
const frcntAccount = new anchor.web3.PublicKey(process.env.REACT_APP_COUNTER_PROGRAM_ACCOUNT!);
const donationAddress = new anchor.web3.PublicKey(process.env.REACT_APP_DONATION_ADDRESS!);
const connection = new anchor.web3.Connection(rpcHost
  ? rpcHost
  : anchor.web3.clusterApiUrl('mainnet-beta'));


const App = () => {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSlopeWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    [],
  );

  return (
    <ThemeProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletDialogProvider>
            <Redeemer
              connection={connection}
              rpcHost={rpcHost}
              frcntrProgramId={frcntProgramID}
              frcntrAccount={frcntAccount}
              donationAddress={donationAddress}
            />
          </WalletDialogProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
};

export default App;
