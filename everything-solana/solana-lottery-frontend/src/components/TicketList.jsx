// src/components/TicketList.jsx
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const TicketList = ({ tickets, program, lotteryState, refreshData }) => {
  const wallet = useWallet();
  const [listingPrice, setListingPrice] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleListTicket = async (ticketAccount, ticketPubkey) => {
    setError('');
    setSuccess('');
    
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Generate listing account PDA
      const listingSeed = `listing-${Date.now()}`;
      const [listingPDA] = await PublicKey.findProgramAddress(
        [Buffer.from(listingSeed), wallet.publicKey.toBuffer()],
        program.programId
      );
      
      // Convert SOL to lamports
      const priceInLamports = parseFloat(listingPrice) * LAMPORTS_PER_SOL;
      
      // Execute list_ticket instruction
      await program.methods
        .listTicket(new BN(priceInLamports))
        .accounts({
          ticketAccount: ticketPubkey,
          listingAccount: listingPDA,
          owner: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      setSuccess(`Ticket #${ticketAccount.tokenId} listed successfully!`);
      setSelectedTicketId(null);
      setListingPrice('');
      refreshData();
    } catch (error) {
      console.error("Error listing ticket:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimPrize = async (ticketAccount, ticketPubkey) => {
    if (!lotteryState.roundComplete) {
      setError('Round not complete yet. Cannot claim prize.');
      return;
    }
    
    // Check if ticket is a winner
    const isWinner = ticketAccount.numbers.every((num, index) => 
      num === lotteryState.revealedNumbers[index]
    );
    
    if (!isWinner) {
      setError('This ticket is not a winner.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Find lottery state PDA
      const [lotteryStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("lottery_state")],
        program.programId
      );
      
      // Execute claim_prize instruction
      await program.methods
        .claimPrize()
        .accounts({
          lotteryState: lotteryStatePDA,
          ticketAccount: ticketPubkey,
          claimer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      setSuccess('Prize claimed successfully!');
      refreshData();
    } catch (error) {
      console.error("Error claiming prize:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tickets.length === 0) {
    return <div>You don't have any tickets yet.</div>;
  }

  return (
    <div className="ticket-list">
      <h2>My Tickets</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="tickets">
        {tickets.map((ticketData) => {
          const ticket = ticketData.account;
          const ticketPubkey = ticketData.publicKey;
          const ticketNumbers = ticket.numbers.join('-');
          
          return (
            <div key={ticketPubkey.toString()} className="ticket-card">
              <h3>Ticket #{ticket.tokenId.toString()}</h3>
              <p className="ticket-numbers">{ticketNumbers}</p>
              
              {lotteryState.roundComplete && (
                <div className="ticket-actions">
                  <button 
                    onClick={() => handleClaimPrize(ticket, ticketPubkey)}
                    disabled={isSubmitting || ticket.claimed}
                  >
                    {ticket.claimed ? 'Already Claimed' : 'Claim Prize'}
                  </button>
                </div>
              )}
              
              {selectedTicketId === ticket.tokenId.toString() ? (
                <div className="listing-form">
                  <input
                    type="number"
                    step="0.01"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Price in SOL"
                  />
                  <div className="listing-actions">
                    <button 
                      onClick={() => setSelectedTicketId(null)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleListTicket(ticket, ticketPubkey)}
                      disabled={isSubmitting}
                    >
                      List for Sale
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setSelectedTicketId(ticket.tokenId.toString())}
                  className="list-ticket-btn"
                >
                  List for Sale
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketList;