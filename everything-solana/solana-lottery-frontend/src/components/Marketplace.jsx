// src/components/Marketplace.jsx
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { web3 } from "@project-serum/anchor";

const Marketplace = ({ program, refreshData }) => {
  const wallet = useWallet();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchListings();
  }, [program]);

  const fetchListings = async () => {
    if (!program) return;

    try {
      setIsLoading(true);

      // Fetch all active listings
      const allListings = await program.account.listingAccount.all([
        {
          memcmp: {
            offset: 8 + 32 + 8, // After discriminator + seller + price
            bytes: "1", // active = true
          },
        },
      ]);

      // Fetch the corresponding ticket account for each listing
      const listingsWithTickets = await Promise.all(
        allListings.map(async (listing) => {
          // Find the ticket account for this listing
          const ticketAccounts = await program.account.ticketAccount.all([
            {
              memcmp: {
                offset: 8 + 32 + 6 * 1 + 1, // After discriminator + owner + numbers + claimed
                bytes: listing.account.ticketId.toString(),
              },
            },
          ]);

          const ticketAccount =
            ticketAccounts.length > 0 ? ticketAccounts[0] : null;

          return {
            listing: listing.account,
            listingPubkey: listing.publicKey,
            ticket: ticketAccount?.account,
            ticketPubkey: ticketAccount?.publicKey,
          };
        })
      );

      setListings(listingsWithTickets.filter((item) => item.ticket !== null));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setIsLoading(false);
    }
  };

  const handleDelist = async (listingPubkey) => {
    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);

      // Execute delist_ticket instruction
      await program.methods
        .delistTicket()
        .accounts({
          listingAccount: listingPubkey,
          owner: wallet.publicKey,
        })
        .rpc();

      setSuccess("Ticket delisted successfully!");
      fetchListings();
      refreshData();
    } catch (error) {
      console.error("Error delisting ticket:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuy = async (listing, listingPubkey, ticketPubkey) => {
    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);

      // Find lottery state PDA for authority
      const [lotteryStatePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("lottery_state")],
        program.programId
      );

      const lotteryState = await program.account.lotteryState.fetch(
        lotteryStatePDA
      );

      // Execute buy_ticket instruction
      await program.methods
        .buyTicket()
        .accounts({
          ticketAccount: ticketPubkey,
          listingAccount: listingPubkey,
          payment: wallet.publicKey,
          seller: listing.seller,
          authority: lotteryState.authority,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setSuccess("Ticket purchased successfully!");
      fetchListings();
      refreshData();
    } catch (error) {
      console.error("Error buying ticket:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading marketplace listings...</div>;
  }

  if (listings.length === 0) {
    return (
      <div className="marketplace">
        <h2>Marketplace</h2>
        <p>No tickets are currently listed for sale.</p>
      </div>
    );
  }

  return (
    <div className="marketplace">
      <h2>Marketplace</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="listings">
        {listings.map((item) => {
          const isOwner =
            item.listing.seller.toString() === wallet.publicKey?.toString();
          const priceInSol = item.listing.price.toNumber() / LAMPORTS_PER_SOL;

          return (
            <div key={item.listingPubkey.toString()} className="listing-card">
              <h3>Ticket #{item.ticket.tokenId.toString()}</h3>
              <p className="ticket-numbers">{item.ticket.numbers.join("-")}</p>
              <p className="price">{priceInSol.toFixed(2)} SOL</p>

              {isOwner ? (
                <button
                  onClick={() => handleDelist(item.listingPubkey)}
                  disabled={isSubmitting}
                  className="delist-btn"
                >
                  Delist
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleBuy(
                      item.listing,
                      item.listingPubkey,
                      item.ticketPubkey
                    )
                  }
                  disabled={isSubmitting}
                  className="buy-btn"
                >
                  Buy Now
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Marketplace;
