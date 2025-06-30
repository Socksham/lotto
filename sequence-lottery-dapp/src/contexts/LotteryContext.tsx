import React, { createContext, useContext, useState, useEffect } from 'react'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey, Connection } from '@solana/web3.js'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { IDL } from '../idl/sequence_lottery'
import idl from '../idl/idl.json'
import { Lottery, Ticket, LotteryState } from '../types'

interface LotteryContextType {
  lottery: Lottery | null
  tickets: Ticket[]
  loading: boolean
  error: string | null
  initializeLottery: (
    sequenceLength: number,
    revealInterval: number,
    ticketPrice: number,
    prizeAmount: number
  ) => Promise<void>
  buyTicket: (sequence: number[]) => Promise<void>
  revealNextNumber: (randomSeed: number) => Promise<void>
  claimPrize: (ticketId: number) => Promise<void>
  transferTicket: (ticketId: number, newOwner: PublicKey) => Promise<void>
  refreshData: () => Promise<void>
}

const LotteryContext = createContext<LotteryContextType | null>(null)

export const LotteryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [lottery, setLottery] = useState<Lottery | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const programId = new PublicKey('BzGNGfCEfvbWYTByUicHR3MmcJYz9DwTMHvtrFmaBAgG')

  const getProvider = () => {
    if (!wallet || !connection) return null
    return new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    )
  }

  const getProgram = () => {
    const provider = getProvider()
    if (!provider) return null
    const prg = new anchor.Program(idl, provider)
    console.log(prg)
    return prg
  }

  const refreshData = async () => {
    if (!wallet?.publicKey) return;
  
    setLoading(true);
    setError(null);
    try {
      const program = getProgram();
      if (!program) {
        setLottery(null);
        setTickets([]);
        return;
      }
  
      // Fetch lottery account
      const [lotteryPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('lottery'), wallet.publicKey.toBuffer()],
        program.programId
      );
  
      try {
        const lotteryAccount = await program.account.lottery.fetch(lotteryPDA);
        setLottery({
          publicKey: lotteryPDA,
          authority: lotteryAccount.authority,
          sequenceLength: lotteryAccount.sequenceLength.toNumber(), // Convert BN to number
          revealInterval: lotteryAccount.revealInterval.toNumber(), // Convert BN to number
          ticketPrice: lotteryAccount.ticketPrice.toNumber(), // Convert BN to number
          prizeAmount: lotteryAccount.prizeAmount.toNumber(), // Convert BN to number
          nextTicketId: lotteryAccount.nextTicketId.toNumber(), // Convert BN to number
          winningSequence: lotteryAccount.winningSequence.map(n => n.toNumber()), // Convert BN[] to number[]
          currentRevealIndex: lotteryAccount.currentRevealIndex,
          lastRevealTimestamp: lotteryAccount.lastRevealTimestamp.toNumber(), // Convert if needed
          state: lotteryAccount.state.toString(), // Convert enum to string
        });
      } catch (err) {
        console.log('No lottery account found');
        setLottery(null);
      }
  
      // Fetch tickets
      try {
        const ticketAccounts = await program.account.ticket.all();
        setTickets(
          ticketAccounts.map((acc) => ({
            publicKey: acc.publicKey,
            owner: acc.account.owner,
            lottery: acc.account.lottery,
            ticketId: acc.account.ticketId.toNumber(), // Convert BN to number
            sequence: acc.account.sequence.map(n => n.toNumber()), // Convert BN[] to number[]
            claimed: acc.account.claimed,
          }))
        );
      } catch (err) {
        console.log('No tickets found');
        setTickets([]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to fetch lottery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData()
  }, [wallet, connection])

  async function createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey
  ) {
    return anchor.web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: associatedToken,
      space: 165,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      programId: anchor.utils.token.TOKEN_PROGRAM_ID,
    });
  }

  const initializeLottery = async (
    sequenceLength: number,
    revealInterval: number,
    ticketPrice: number,
    prizeAmount: number
  ) => {
    if (!wallet || !wallet.publicKey) throw new Error('Wallet not connected');
    const program = getProgram();
    if (!program) throw new Error('Program not initialized');
  
    setLoading(true);
    setError(null);
    try {
      const [lotteryPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('lottery'), wallet.publicKey.toBuffer()],
        program.programId
      );
  
      const [lotteryAuthorityPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('lottery'), lotteryPDA.toBuffer()],
        program.programId
      );
  
      const mint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      
      // Correct way to get associated token account address
      const lotteryVault = await anchor.utils.token.associatedTokenAddress({
        mint,
        owner: lotteryAuthorityPDA,
      });
  
      // Create the associated token account if needed
      try {
        const vaultInfo = await connection.getAccountInfo(lotteryVault);
        if (!vaultInfo) {
          const createATAInstruction = await createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            lotteryVault,
            lotteryAuthorityPDA,
            mint
          );
          
          const tx = new anchor.web3.Transaction().add(createATAInstruction);
          await program.provider.sendAndConfirm(tx);
          console.log('Created vault account');
        }
      } catch (err) {
        console.log('Vault account check failed:', err);
        throw new Error('Failed to create vault account');
      }
  
      // Initialize the lottery
      const txHash = await program.methods
        .initialize(
          sequenceLength,
          new anchor.BN(revealInterval),
          new anchor.BN(ticketPrice),
          new anchor.BN(prizeAmount)
        )
        .accounts({
          lottery: lotteryPDA,
          lotteryAuthority: lotteryAuthorityPDA,
          lotteryVault: lotteryVault,
          mint: mint,
          authority: wallet.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
  
      console.log('Transaction successful:', txHash);
      await refreshData();
    } catch (err) {
      console.error('Full error details:', err);
      setError(`Initialization failed: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async (sequence: number[]) => {
    if (!wallet || !lottery) throw new Error('Wallet not connected or no lottery')
    const program = getProgram()
    if (!program) throw new Error('Program not initialized')

    setLoading(true)
    setError(null)
    try {
      const sequenceArray = new Array(10).fill(0)
      sequence.forEach((num, idx) => (sequenceArray[idx] = num))

      const ticketPDA = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from('ticket'),
          lottery.publicKey.toBuffer(),
          new anchor.BN(lottery.nextTicketId).toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      )[0]

      await program.methods
        .buyTicket(sequenceArray)
        .accounts({
          lottery: lottery.publicKey,
          ticket: ticketPDA,
          buyer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      await refreshData()
    } catch (err) {
      console.error('Error buying ticket:', err)
      setError('Failed to buy ticket')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const revealNextNumber = async (randomSeed: number) => {
    if (!wallet || !lottery) throw new Error('Wallet not connected or no lottery')
    const program = getProgram()
    if (!program) throw new Error('Program not initialized')

    setLoading(true)
    setError(null)
    try {
      await program.methods
        .revealNextNumber(new anchor.BN(randomSeed))
        .accounts({
          lottery: lottery.publicKey,
          authority: wallet.publicKey,
        })
        .rpc()

      await refreshData()
    } catch (err) {
      console.error('Error revealing number:', err)
      setError('Failed to reveal number')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const claimPrize = async (ticketId: number) => {
    if (!wallet || !lottery) throw new Error('Wallet not connected or no lottery')
    const program = getProgram()
    if (!program) throw new Error('Program not initialized')

    setLoading(true)
    setError(null)
    try {
      const ticket = tickets.find((t) => t.ticketId.eq(new anchor.BN(ticketId)))
      if (!ticket) throw new Error('Ticket not found')

      const [lotteryAuthorityPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('lottery'), lottery.publicKey.toBuffer()],
        program.programId
      )

      await program.methods
        .claimPrize()
        .accounts({
          lottery: lottery.publicKey,
          lotteryAuthority: lotteryAuthorityPDA,
          ticket: ticket.publicKey,
          winner: wallet.publicKey,
        })
        .rpc()

      await refreshData()
    } catch (err) {
      console.error('Error claiming prize:', err)
      setError('Failed to claim prize')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const transferTicket = async (ticketId: number, newOwner: PublicKey) => {
    if (!wallet || !lottery) throw new Error('Wallet not connected or no lottery')
    const program = getProgram()
    if (!program) throw new Error('Program not initialized')

    setLoading(true)
    setError(null)
    try {
      const ticket = tickets.find((t) => t.ticketId.eq(new anchor.BN(ticketId)))
      if (!ticket) throw new Error('Ticket not found')

      await program.methods
        .transferTicket()
        .accounts({
          lottery: lottery.publicKey,
          ticket: ticket.publicKey,
          currentOwner: wallet.publicKey,
          newOwner,
        })
        .rpc()

      await refreshData()
    } catch (err) {
      console.error('Error transferring ticket:', err)
      setError('Failed to transfer ticket')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <LotteryContext.Provider
      value={{
        lottery,
        tickets,
        loading,
        error,
        initializeLottery,
        buyTicket,
        revealNextNumber,
        claimPrize,
        transferTicket,
        refreshData,
      }}
    >
      {children}
    </LotteryContext.Provider>
  )
}

export const useLottery = () => {
  const context = useContext(LotteryContext)
  if (!context) {
    throw new Error('useLottery must be used within a LotteryProvider')
  }
  return context
}