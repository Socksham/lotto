import { Routes, Route, Link } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import WalletConnection from "./components/WalletConnection";
import LandingPage from "./components/LandingPage";
import AdminPanel from "./components/AdminPanel";
import LotteryStatusDashboard from "./components/Dashboard";
import MyTickets from "./components/MyTickets";
import MintTicket from "./components/MintTicket";
import TradeTickets from "./components/TradeTickets";
import ContractInteraction from "./components/ContractInteractions";
import Navbar from "./components/Navbar";
import { ThirdwebProvider as T5 } from "thirdweb/react";
import React from "react";

const amoyChainId = 80002;

const navComp = <Navbar/>

function App() {
  return (
    <ThirdwebProvider
      desiredChainId={amoyChainId}
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
    >
      <T5>
        <Routes>
          <Route path="/" element={<LandingPage Nav={navComp}/>} />
          <Route path="/wallet" element={<WalletConnection Nav={navComp}/>} />
          <Route path="/admin" element={<AdminPanel Nav={navComp}/>} />
          <Route path="/dashboard" element={<LotteryStatusDashboard Nav={navComp}/>} />
          <Route path="/my-tickets" element={<MyTickets Nav={navComp}/>} />
          <Route path="/mint" element={<MintTicket Nav={navComp}/>} />
          <Route path="/trade" element={<TradeTickets />}  />
          <Route path="/contract" element={<ContractInteraction Nav={navComp}/>} />
        </Routes>
      </T5>
    </ThirdwebProvider>
  );
}

export default App; 
