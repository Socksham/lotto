import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Lottery from './components/Lottery';
import WalletContext from './components/WalletProvider';

const App = () => {
  return (
    <WalletContext>
      <div>
        <h1>Sequence Lottery dApp</h1>
        <WalletMultiButton />
        <Lottery />
      </div>
    </WalletContext>
  );
};

export default App;
