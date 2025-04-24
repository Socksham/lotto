// src/components/MintTicket.jsx
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';

const MintTicket = ({ program, refreshData, lotteryState }) => {
  const wallet = useWallet();
  const [numbers, setNumbers] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle number input change
  const handleNumberChange = (index, value) => {
    // Only allow numbers from 0-99
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 99)) {
      const newNumbers = [...numbers];
      newNumbers[index] = value;
      setNumbers(newNumbers);
    }
  };

  // Handle random number generation
  const generateRandomNumbers = () => {
    const randomNumbers = Array(6).fill('').map(() => 
      Math.floor(Math.random() * 100).toString()
    );
    setNumbers(randomNumbers);
  };

  // Mint a ticket
  const mintTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate all numbers are filled
    if (numbers.some(num => num === '')) {
      setError('Please fill in all numbers');
      return;
    }
    
    // Convert to Uint8Array for contract
    const numbersArray = numbers.map(num => parseInt(num));
    
    try {
      setIsSubmitting(true);
      
      // Find lottery state PDA
      const [lotteryStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("lottery_state")],
        program.programId
      );
      
      // Generate a new ticket account with a unique seed
      const ticketSeed = 'ticket-' + Date.now();
      const [ticketPDA] = await PublicKey.findProgramAddress(
        [Buffer.from(ticketSeed), wallet.publicKey.toBuffer()],
        program.programId
      );
      
      // Create a unique mint address for the NFT
      const tokenIdCounter = lotteryState.tokenIdCounter.toNumber() + 1;
      const mintSeed = Buffer.from(`lottery_mint_${tokenIdCounter}`);
      const [mintPDA] = await PublicKey.findProgramAddress(
        [mintSeed],
        program.programId
      );
      
      // Find metadata and master edition PDAs
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          mintPDA.toBuffer()
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      );
      
      const [masterEditionPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          mintPDA.toBuffer(),
          Buffer.from("edition")
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      );
      
      // Execute the mint_ticket instruction
      await program.methods
        .mintTicket(numbersArray)
        .accounts({
          lotteryState: lotteryStatePDA,
          ticketAccount: ticketPDA,
          payment: wallet.publicKey,
          authority: lotteryState.authority,
          mint: mintPDA,
          tokenAccount: await getAssociatedTokenAddress(
            mintPDA,
            wallet.publicKey
          ),
          metadataAccount: metadataPDA,
          masterEdition: masterEditionPDA,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
          rent: web3.SYSVAR_RENT_PUBKEY,
          metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .rpc();
      
      setSuccess('Ticket purchased successfully!');
      setNumbers(['', '', '', '', '', '']);
      refreshData();
    } catch (error) {
      console.error("Error minting ticket:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to get associated token address
  const getAssociatedTokenAddress = async (mint, owner) => {
    return PublicKey.findProgramAddress(
      [
        owner.toBuffer(),
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
        mint.toBuffer(),
      ],
      new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
    ).then(([address]) => address);
  };

  return (
    <div className="mint-ticket">
      <h2>Buy a Lottery Ticket</h2>
      <p>Price: 0.01 SOL per ticket</p>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={mintTicket}>
        <div className="number-inputs">
          {numbers.map((number, index) => (
            <input
              key={index}
              type="text"
              value={number}
              onChange={(e) => handleNumberChange(index, e.target.value)}
              placeholder={`#${index + 1}`}
              maxLength={2}
            />
          ))}
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={generateRandomNumbers}>
            Random Numbers
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Purchasing...' : 'Buy Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MintTicket;