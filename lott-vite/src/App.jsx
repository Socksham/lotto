import { Routes, Route, Link } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import WalletConnection from "./components/WalletConnection";
import AdminPanel from "./components/AdminPanel";
import LotteryStatusDashboard from "./components/Dashboard";
import MyTickets from "./components/MyTickets";
import MintTicket from "./components/MintTicket";
import ContractInteraction from "./components/ContractInteractions";
import Navbar from "./components/Navbar";

const amoyChainId = 80002;

function App() {
  return (
    <ThirdwebProvider desiredChainId={amoyChainId} clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}>
      <Navbar />

      <Routes>
        <Route path="/" element={<h1>Welcome to the App</h1>} />
        <Route path="/wallet" element={<WalletConnection />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dashboard" element={<LotteryStatusDashboard />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/mint" element={<MintTicket />} />
        <Route path="/contract" element={<ContractInteraction />} />
      </Routes>
    </ThirdwebProvider>
  );
}

export default App;