
import * as React from "react";
import './App.css';


import Redeemer from "./Redeemer";

import * as anchor from "@project-serum/anchor";
import * as sweb3 from '@solana/web3.js';
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from "@solana/wallet-adapter-wallets";

import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";

import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";

const USE_MAINNET = true;

const rpcHost = sweb3.clusterApiUrl(USE_MAINNET?'mainnet-beta':'devnet');
const connection = new anchor.web3.Connection(rpcHost);

function App() {
  
  const endpoint = React.useMemo(() => rpcHost, []);

  const wallets = React.useMemo(
    () => [
        getPhantomWallet(),
        getSlopeWallet(),
        getSolflareWallet(),
        getSolletWallet({ network: rpcHost as WalletAdapterNetwork }),
        getSolletExtensionWallet({ network: rpcHost as WalletAdapterNetwork })
    ],
    []
  );
  

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletDialogProvider>
          <Redeemer
                connection={connection}
              />
        </WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
