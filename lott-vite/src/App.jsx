import MintTicket from "./components/MintTicket";
import ContractInteraction from "./components/contractInteractions";
import WalletConnection from "./components/WalletConnection";
import "./App.css";
import { ThirdwebProvider } from '@thirdweb-dev/react';

const amoyChainId = 80002;

function App() {
  return (
    <>
      <ThirdwebProvider desiredChainId={amoyChainId} clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}>
        <WalletConnection />
        <MintTicket />
        <ContractInteraction />
      </ThirdwebProvider>
    </>
  );
}

export default App;
