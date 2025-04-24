// src/components/RevealNumbers.jsx
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';

const RevealNumbers = ({ program, lotteryState, refreshData }) => {
  const wallet = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isAuthority = lotteryState && wallet.publicKey 
    ? lotteryState.authority.toString() === wallet.publicKey.toString()
    : false;

  const handleReveal = async () => {
    setError('');
    setSuccess('');
    
    if (!isAuthority) {
      setError('Only the lottery authority can reveal numbers');
      return;
    }
    
    if (lotteryState.roundComplete) {
      setError('Round is already complete');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Find lottery state PDA
      const [lotteryStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("lottery_state")],
        program.programId
      );
      
      // Get recent blockhash for randomness
      const { blockhash } = await program.provider.connection.getLatestBlockhash();
      const recentBlockhashInfo = await program.provider.connection.getAccountInfo(
        new PublicKey(blockhash.substring(0, 32))
      );
      
      // Execute reveal_number instruction
      await program.methods
        .revealNumber()
        .accounts({
          lotteryState: lotteryStatePDA,
          authority: wallet.publicKey,
          recentBlockhash: recentBlockhashInfo ? 
            recentBlockhashInfo.publicKey : 
            new PublicKey("SysvarRecentB1ockHashes11111111111111111111"),
        })
        .rpc();
      
      setSuccess('Number revealed successfully!');
      refreshData();
    } catch (error) {
      console.error("Error revealing number:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewRound = async () => {
    setError('');
    setSuccess('');
    
    if (!isAuthority) {
      setError('Only the lottery authority can start a new round');
      return;
    }
    
    if (!lotteryState.roundComplete) {
      setError('Current round is not complete yet');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Find lottery state PDA
      const [lotteryStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("lottery_state")],
        program.programId
      );
      
      // Execute start_new_round instruction
      await program.methods
        .startNewRound()
        .accounts({
          lotteryState: lotteryStatePDA,
          authority: wallet.publicKey,
        })
        .rpc();
      
      setSuccess('New round started successfully!');
      refreshData();
    } catch (error) {
      console.error("Error starting new round:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeUntilNextReveal = () => {
    if (!lotteryState) return '';
    
    const revealInterval = 172800; // 2 days in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const nextRevealTime = lotteryState.lastRevealTime.toNumber() + revealInterval;
    
    if (currentTime >= nextRevealTime) {
      return 'Ready to reveal';
    }
    
    const secondsRemaining = nextRevealTime - currentTime;
    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="reveal-numbers">
      <h2>Lottery Status - Round {lotteryState?.currentRound.toString()}</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="revealed-numbers">
        <h3>Revealed Numbers</h3>
        <div className="numbers-grid">
          {Array(6).fill(0).map((_, idx) => {
            const hasRevealedNumber = lotteryState && idx < lotteryState.currentRevealIndex;
            return (
              <div key={idx} className={`number-box ${hasRevealedNumber ? 'revealed' : ''}`}>
                {hasRevealedNumber ? lotteryState.revealedNumbers[idx] : '?'}
              </div>
            );
          })}
        </div>
        
        <p>Next reveal: {formatTimeUntilNextReveal()}</p>
        
        {isAuthority && (
          <div className="admin-controls">
            <button 
              onClick={handleReveal}
              disabled={isSubmitting || lotteryState.roundComplete}
            >
              Reveal Next Number
            </button>
            
            <button
              onClick={handleStartNewRound}
              disabled={isSubmitting || !lotteryState.roundComplete}
            >
              Start New Round
            </button>
          </div>
        )}
      </div>
      
      {lotteryState?.roundComplete && (
        <div className="round-complete">
          <h3>Round Complete!</h3>
          <p>Winning combination: {lotteryState.revealedNumbers.slice(0, 6).join('-')}</p>
        </div>
      )}
    </div>
  );
};

export default RevealNumbers;