import { Routes, Route, Link } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import WalletConnection from "./components/WalletConnection";
import LandingPage from "./components/LandingPage";
import AdminPanel from "./components/AdminPanel";
import LotteryStatusDashboard from "./components/Dashboard";
import MyTickets from "./components/MyTickets";
import MintTicket from "./components/MintTicket";
import ContractInteraction from "./components/ContractInteractions";
import Navbar from "./components/Navbar";
import { ThirdwebProvider as T5 } from "thirdweb/react";
import React from "react";

const amoyChainId = 80002;
function App() {
  return (
    <ThirdwebProvider
      desiredChainId={amoyChainId}
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
    >
      <T5>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/wallet" element={<WalletConnection />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/dashboard" element={<LotteryStatusDashboard />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/mint" element={<MintTicket />} />
          <Route path="/contract" element={<ContractInteraction />} />
        </Routes>
      </T5>
    </ThirdwebProvider>
  );
}

export default App; 
