import MintTicket from "./components/MintTicket";
import ContractInteraction from "./components/ContractInteractions";
import WalletConnection from "./components/WalletConnection";
import "./App.css";
import { ThirdwebProvider } from '@thirdweb-dev/react';
import AdminPanel from "./components/AdminPanel";
import LotteryStatusDashboard from "./components/Dashboard";
import MyTickets from "./components/MyTickets";

const amoyChainId = 80002;

function App() {
  return (
    <>
      <ThirdwebProvider desiredChainId={amoyChainId} clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}>
        <WalletConnection />
        <AdminPanel />
        <LotteryStatusDashboard />
        <MyTickets />
        <MintTicket />
        <ContractInteraction />
      </ThirdwebProvider>
    </>
  );
}

export default App;
