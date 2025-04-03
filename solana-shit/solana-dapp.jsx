// File structure for your Solana dApp

// 1. src/utils/wallet.js - Connect wallet functionality
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

export const connectWallet = async () => {
  // Setup wallet adapter
  const wallet = new PhantomWalletAdapter();
  await wallet.connect();
  
  // Setup connection to devnet (or mainnet/testnet)
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Create AnchorProvider
  const provider = new AnchorProvider(
    connection,
    wallet,
    { preflightCommitment: 'confirmed' }
  );
  
  return provider;
};

// 2. src/utils/program.js - Program interaction utils
import { IDL } from '../idl/lottery_v2'; // Generated IDL from Anchor
import { PublicKey } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';

export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'); // Your program ID

export const getLotteryProgram = (provider) => {
  return new Program(IDL, PROGRAM_ID, provider);
};

export const getLotteryStateAddress = async () => {
  const [lotteryStateAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('lottery_state')],
    PROGRAM_ID
  );
  return lotteryStateAddress;
};

export const getTicketAddress = async (tokenId) => {
  const [ticketAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('ticket'), tokenId.toBuffer('le', 8)],
    PROGRAM_ID
  );
  return ticketAddress;
};

export const getListingAddress = async (tokenId) => {
  const [listingAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('listing'), tokenId.toBuffer('le', 8)],
    PROGRAM_ID
  );
  return listingAddress;
};

// 3. src/api/lottery.js - API functions for lottery interaction
import { 
  getLotteryProgram, 
  getLotteryStateAddress,
  getTicketAddress,
  getListingAddress
} from '../utils/program';
import { web3, BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export const getCurrentRoundInfo = async (provider) => {
  const program = getLotteryProgram(provider);
  const lotteryStateAddress = await getLotteryStateAddress();
  
  const lotteryState = await program.account.lotteryState.fetch(lotteryStateAddress);
  
  return {
    round: lotteryState.currentRound,
    revealIndex: lotteryState.currentRevealIndex,
    isComplete: lotteryState.roundComplete,
    prize: lotteryState.accumulatedPrize,
    nextRevealTime: lotteryState.lastRevealTime.toNumber() + 172800, // + 2 days
  };
};

export const getRevealedNumbers = async (provider) => {
  const program = getLotteryProgram(provider);
  const lotteryStateAddress = await getLotteryStateAddress();
  
  const lotteryState = await program.account.lotteryState.fetch(lotteryStateAddress);
  
  return lotteryState.revealedNumbers.slice(0, lotteryState.currentRevealIndex);
};

export const mintTicket = async (provider, numbers) => {
  const program = getLotteryProgram(provider);
  const lotteryStateAddress = await getLotteryStateAddress();
  
  // Create a new account for the ticket
  const ticketAccount = web3.Keypair.generate();
  
  await program.methods
    .mintTicket(numbers)
    .accounts({
      lotteryState: lotteryStateAddress,
      ticketAccount: ticketAccount.publicKey,
      payment: provider.wallet.publicKey,
      authority: lotteryStateAddress,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
      metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
    })
    .signers([ticketAccount])
    .rpc();
    
  return ticketAccount.publicKey;
};

export const listTicket = async (provider, tokenId, price) => {
  const program = getLotteryProgram(provider);
  const ticketAddress = await getTicketAddress(new BN(tokenId));
  const listingAddress = await getListingAddress(new BN(tokenId));
  
  await program.methods
    .listTicket(new BN(price))
    .accounts({
      ticketAccount: ticketAddress,
      listingAccount: listingAddress,
      owner: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
};

export const buyTicket = async (provider, tokenId) => {
  const program = getLotteryProgram(provider);
  const ticketAddress = await getTicketAddress(new BN(tokenId));
  const listingAddress = await getListingAddress(new BN(tokenId));
  
  const listing = await program.account.listingAccount.fetch(listingAddress);
  
  await program.methods
    .buyTicket()
    .accounts({
      ticketAccount: ticketAddress,
      listingAccount: listingAddress,
      payment: provider.wallet.publicKey,
      seller: listing.seller,
      authority: (await getLotteryStateAddress()).authority,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
};

// 4. src/components/MintTicket.jsx - Component for minting tickets
import React, { useState } from 'react';
import { mintTicket } from '../api/lottery';

export const MintTicket = ({ provider, onMint }) => {
  const [numbers, setNumbers] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  
  const handleNumberChange = (index, value) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value > 99 ? 99 : value;
    setNumbers(newNumbers);
  };
  
  const handleMint = async () => {
    try {
      setLoading(true);
      const ticketNumbers = numbers.map(n => parseInt(n));
      await mintTicket(provider, ticketNumbers);
      onMint && onMint();
    } catch (error) {
      console.error('Error minting ticket:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Mint New Lottery Ticket</h2>
      <div>
        {numbers.map((num, index) => (
          <input
            key={index}
            type="number"
            min="0"
            max="99"
            value={num}
            onChange={(e) => handleNumberChange(index, e.target.value)}
            style={{ width: '50px', margin: '0 5px' }}
          />
        ))}
      </div>
      <button onClick={handleMint} disabled={loading}>
        {loading ? 'Minting...' : 'Mint Ticket (0.01 SOL)'}
      </button>
    </div>
  );
};

// Additional components would include:
// - TicketDisplay.jsx (for showing ticket details)
// - LotteryInfo.jsx (for current round info)
// - Marketplace.jsx (for buying/selling tickets)
// - UserTickets.jsx (for displaying user's tickets)
// - etc.