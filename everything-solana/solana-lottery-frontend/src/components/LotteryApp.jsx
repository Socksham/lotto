// src/components/LotteryApp.jsx
import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor"
// import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import idl from '../idl/idl.json';

import MintTicket from './MintTicket';
import TicketList from './TicketList';
import RevealNumbers from './RevealNumbers';
import Marketplace from './Marketplace';

const programID = new PublicKey('BzGNGfCEfvbWYTByUicHR3MmcJYz9DwTMHvtrFmaBAgG');

const LotteryApp = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const [lotteryState, setLotteryState] = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mint');

  useEffect(() => {
    const initProgram = async () => {
      if (wallet.connected) {
        try {
          setIsLoading(true);
          
          // Create provider
          const provider = new AnchorProvider(
            connection,
            wallet,
            AnchorProvider.defaultOptions()
          );
          
          // Create program
          const programInstance = new Program(idl, provider);
          setProgram(programInstance);
          
          // Get lottery state
          await fetchLotteryState(programInstance);
          
          // Get user tickets
          await fetchUserTickets(programInstance);
          
          setIsLoading(false);
        } catch (error) {
          console.error("Error initializing program:", error);
          setIsLoading(false);
        }
      }
    };

    initProgram();
  }, [wallet.connected, connection, wallet]);

  const fetchLotteryState = async (programInstance) => {
    try {
      // Fetch the lottery state PDA
      const [lotteryStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("lottery_state")],
        programID
      );

      console.log(lotteryStatePDA)

      console.log(programInstance.account.lottery)
      
      const state = await programInstance.account.lottery.fetch(lotteryStatePDA);
      setLotteryState(state);
    } catch (error) {
      console.error("Error fetching lottery state:", error);
    }
  };

  const fetchUserTickets = async (programInstance) => {
    if (!wallet.publicKey) return;
    
    try {

      console.log(programInstance.account.lottery)
      // Query for all ticket accounts owned by the user
      const tickets = await programInstance.account.ticketAccount.all([
        {
          memcmp: {
            offset: 8, // After the account discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      
      setUserTickets(tickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
    }
  };

  const refreshData = async () => {
    if (program) {
      setIsLoading(true);
      await fetchLotteryState(program);
      await fetchUserTickets(program);
      setIsLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="not-connected">
        <p>Please connect your wallet to use the lottery app</p>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading lottery data...</div>;
  }

  return (
    <div className="lottery-app">
      <div className="tabs">
        <button 
          className={activeTab === 'mint' ? 'active' : ''} 
          onClick={() => setActiveTab('mint')}
        >
          Buy Tickets
        </button>
        <button 
          className={activeTab === 'mytickets' ? 'active' : ''} 
          onClick={() => setActiveTab('mytickets')}
        >
          My Tickets
        </button>
        <button 
          className={activeTab === 'reveal' ? 'active' : ''} 
          onClick={() => setActiveTab('reveal')}
        >
          Lottery Status
        </button>
        <button 
          className={activeTab === 'marketplace' ? 'active' : ''} 
          onClick={() => setActiveTab('marketplace')}
        >
          Marketplace
        </button>
      </div>
      
      <div className="lottery-info">
        <p>Current Round: {lotteryState?.currentRound.toString()}</p>
        <p>Prize Pool: {lotteryState ? (lotteryState.accumulatedPrize / web3.LAMPORTS_PER_SOL).toFixed(2) : 0} SOL</p>
        <p>Round Complete: {lotteryState?.roundComplete ? 'Yes' : 'No'}</p>
        <button onClick={refreshData}>Refresh Data</button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'mint' && (
          <MintTicket 
            program={program} 
            refreshData={refreshData}
            lotteryState={lotteryState}
          />
        )}
        
        {activeTab === 'mytickets' && (
          <TicketList 
            tickets={userTickets} 
            program={program}
            lotteryState={lotteryState}
            refreshData={refreshData}
          />
        )}
        
        {activeTab === 'reveal' && (
          <RevealNumbers 
            program={program} 
            lotteryState={lotteryState}
            refreshData={refreshData}
          />
        )}
        
        {activeTab === 'marketplace' && (
          <Marketplace 
            program={program}
            wallet={wallet}
            refreshData={refreshData}
          />
        )}
      </div>
    </div>
  );
};

export default LotteryApp;