import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor"

import idl from '../idl/idl.json'; // You'll need to export this from your Anchor program

// Set up program ID from the contract
const programId = new PublicKey('422dg28A2Z3zS5DrpdXQKKrpxrMayZWkpbgWT6Yb64xx');

// Constants from your contract
const MINT_PRICE = 10_000_000; // 0.01 SOL in lamports

// Get the lottery PDA
const getLotteryPDA = () => {
  const [lotteryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('lottery')],
    programId
  );
  return lotteryPDA;
};

// Get the program instance
export const getProgram = (wallet) => {
  const network = clusterApiUrl('devnet');
  const connection = new Connection(network, 'confirmed');

  const provider = new AnchorProvider(
    connection, 
    wallet, 
    { commitment: 'confirmed' }
  );

  console.log("Loaded IDL:", idl); // Add this before `new Program(...)`
  console.log(programId)
  console.log(provider)
  console.log('IDL types:', idl.types); // check for missing or malformed type definitions
  console.log(idl.types);
  console.log(idl.accounts);
  console.log(idl.types.find(t => t.name === 'Ticket'));
  console.log(idl.accounts.find(a => a.name === 'Ticket'));

  const program = new Program(idl, provider);

  console.log(program)

  return { program, connection, provider };
};

// Initialize the lottery - only needs to be done once by admin
export const initializeLottery = async (wallet) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        lottery: lotteryPDA,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  } catch (error) {
    console.error("Error initializing lottery:", error);
    throw error;
  }
};

// Mint a ticket
export const mintTicket = async (wallet, numbers) => {
  const { program, connection } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    // Get SlotHashes account address
    const slotHashesAddress = new PublicKey('SysvarS1otHashes111111111111111111111111111');

    const tx = await program.methods
      .mintTicket(numbers)
      .accounts({
        lottery: lotteryPDA,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
        slotHashes: slotHashesAddress,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error minting ticket:", error);
    throw error;
  }
};

// Get lottery state
export const getLotteryState = async (wallet) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const lotteryState = await program.account.lottery.fetch(lotteryPDA);
    return lotteryState;
  } catch (error) {
    console.error("Error fetching lottery state:", error);
    throw error;
  }
};

// List a ticket for sale
export const listTicket = async (wallet, ticketId, price) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const tx = await program.methods
      .listTicket(new BN(ticketId), new BN(price))
      .accounts({
        lottery: lotteryPDA,
        user: wallet.publicKey,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error listing ticket:", error);
    throw error;
  }
};

// Delist a ticket
export const delistTicket = async (wallet, ticketId) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const tx = await program.methods
      .delistTicket(new BN(ticketId))
      .accounts({
        lottery: lotteryPDA,
        user: wallet.publicKey,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error delisting ticket:", error);
    throw error;
  }
};

// Buy a ticket
export const buyTicket = async (wallet, ticketId, seller, price) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    // For this function, we need to get the marketplace address
    // This should be defined in your contract or configuration
    const marketplaceAddress = new PublicKey('YOUR_MARKETPLACE_ADDRESS');

    const tx = await program.methods
      .buyTicket(new BN(ticketId))
      .accounts({
        lottery: lotteryPDA,
        user: wallet.publicKey,
        seller: seller,
        marketplace: marketplaceAddress,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error buying ticket:", error);
    throw error;
  }
};

// Claim prize
export const claimPrize = async (wallet, ticketId) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const tx = await program.methods
      .claimPrize(new BN(ticketId))
      .accounts({
        lottery: lotteryPDA,
        user: wallet.publicKey,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error claiming prize:", error);
    throw error;
  }
};

// Reveal a number (admin only)
export const revealNumber = async (wallet) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();
  const slotHashesAddress = new PublicKey('SysvarS1otHashes111111111111111111111111111');

  try {
    const tx = await program.methods
      .revealNumber()
      .accounts({
        lottery: lotteryPDA,
        admin: wallet.publicKey,
        slotHashes: slotHashesAddress,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error revealing number:", error);
    throw error;
  }
};

// Start a new round (admin only)
export const startNewRound = async (wallet) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const tx = await program.methods
      .startNewRound()
      .accounts({
        lottery: lotteryPDA,
        admin: wallet.publicKey,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error starting new round:", error);
    throw error;
  }
};

// Get user's tickets
export const getUserTickets = async (wallet) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const lotteryState = await program.account.lottery.fetch(lotteryPDA);
    
    // Filter tickets owned by the current user
    const userTickets = lotteryState.tickets.map((ticket, index) => {
      if (ticket.owner.toBase58() === wallet.publicKey.toBase58()) {
        return {
          id: index,
          numbers: ticket.numbers,
          claimed: ticket.claimed,
          mintTime: ticket.mintTime.toString(),
        };
      }
      return null;
    }).filter(ticket => ticket !== null);

    return userTickets;
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    throw error;
  }
};

// Get marketplace listings
export const getMarketplaceListings = async (wallet) => {
  const { program } = getProgram(wallet);
  const lotteryPDA = getLotteryPDA();

  try {
    const lotteryState = await program.account.lottery.fetch(lotteryPDA);
    
    // Get active listings
    const listings = lotteryState.marketplaceListings
      .filter(listing => listing.active)
      .map(listing => {
        const ticket = lotteryState.tickets[listing.ticketId.toNumber()];
        return {
          ticketId: listing.ticketId.toNumber(),
          seller: listing.seller.toBase58(),
          price: listing.price.toNumber(),
          numbers: ticket.numbers,
        };
      });

    return listings;
  } catch (error) {
    console.error("Error fetching marketplace listings:", error);
    throw error;
  }
};