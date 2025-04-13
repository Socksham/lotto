import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import { clusterApiUrl } from "@solana/web3.js";

import '@solana/wallet-adapter-react-ui/styles.css';

const endpoint = clusterApiUrl("devnet"); // or 'mainnet-beta'

const wallets = [new PhantomWalletAdapter()];

createRoot(document.getElementById("root")).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <StrictMode>
          <App />
        </StrictMode>
        ,
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
