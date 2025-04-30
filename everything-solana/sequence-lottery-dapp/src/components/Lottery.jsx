import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const { SystemProgram, Keypair, Transaction } = web3;

const lotteryProgramID = new web3.PublicKey('BzGNGfCEfvbWYTByUicHR3MmcJYz9DwTMHvtrFmaBAgG'); // Contract ID
const lotteryProgram = new Program(idl, lotteryProgramID);

const Lottery = () => {
  const [sequence, setSequence] = useState([]);
  const [ticketPrice, setTicketPrice] = useState(0);
  const wallet = useWallet();
  
  const buyTicket = async (sequence) => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(
      new web3.Connection(web3.clusterApiUrl('devnet'), 'processed'),
      wallet,
      {}
    );
    const program = new Program(idl, lotteryProgramID, provider);

    try {
      const transaction = await program.rpc.buyTicket(sequence, {
        accounts: {
          lottery: lotteryAccount,
          ticket: ticketAccount,
          buyer: wallet.publicKey,
          buyerTokenAccount: buyerTokenAccount,
          lotteryVault: lotteryVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      });

      console.log('Transaction Signature:', transaction);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Buy Lottery Ticket</h2>
      <button onClick={() => buyTicket([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}>
        Buy Ticket
      </button>
    </div>
  );
};

export default Lottery;