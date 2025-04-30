// Polyfill Node.js modules for the browser
import process from 'process';
import assert from 'assert';
import { Buffer } from 'buffer';

// Make the polyfills available globally in the browser environment
window.process = process;
window.assert = assert;
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import '@solana/wallet-adapter-react-ui/styles.css'

const wallets = [
  new PhantomWalletAdapter()
];

const network = 'devnet'; // or 'mainnet-beta' if you want main Solana

const endpoint = 'https://api.devnet.solana.com'; // devnet endpoint

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
