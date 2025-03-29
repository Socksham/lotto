import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { useAddress } from "@thirdweb-dev/react";
import { ethers } from "ethers";

const TradeTickets = () => {
  const [listedTickets, setListedTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const address = useAddress();

  useEffect(() => {
    if (address) {
      fetchMyTickets();
      fetchListedTickets();
    }
  }, [address]);

  const fetchListedTickets = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      // We'll need to add this functionality to the smart contract
      const listings = await contract.getListedTickets();
      setListedTickets(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      const balance = await contract.balanceOf(address);
      
      const ticketPromises = [];
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const ticket = await contract.tickets(tokenId);
        const uri = await contract.tokenURI(tokenId);
        
        ticketPromises.push({
          id: tokenId.toString(),
          ...ticket,
          uri
        });
      }
      
      const ticketData = await Promise.all(ticketPromises);
      setMyTickets(ticketData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setMessage("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const listTicketForSale = async (tokenId, price) => {
    try {
      setLoading(true);
      const contract = await getContract();
      const priceInWei = ethers.utils.parseEther(price);
      
      const tx = await contract.listTicketForSale(tokenId, priceInWei);
      await tx.wait();
      
      setMessage("Ticket listed successfully!");
      await fetchListedTickets();
      await fetchMyTickets();
    } catch (error) {
      console.error("Error listing ticket:", error);
      setMessage(error.message || "Failed to list ticket");
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async (tokenId, price) => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      const tx = await contract.buyTicket(tokenId, { value: price });
      await tx.wait();
      
      setMessage("Ticket purchased successfully!");
      await fetchListedTickets();
      await fetchMyTickets();
    } catch (error) {
      console.error("Error buying ticket:", error);
      setMessage(error.message || "Failed to buy ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">Ticket Marketplace</h2>
        
        {/* Listed Tickets Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-purple-400">Available Tickets</h3>
          {loading ? (
            <p className="text-gray-400">Loading marketplace...</p>
          ) : listedTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listedTickets.map((listing) => (
                <div key={listing.tokenId} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-gray-300">Ticket #{listing.tokenId}</span>
                    <span className="px-2 py-1 bg-green-600 text-white text-sm rounded">
                      {ethers.utils.formatEther(listing.price)} ETH
                    </span>
                  </div>
                  
                  <button
                    onClick={() => buyTicket(listing.tokenId, listing.price)}
                    disabled={loading || listing.seller === address}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                             text-white rounded transition-colors"
                  >
                    {listing.seller === address ? "Your Listing" : "Buy Ticket"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No tickets currently listed for sale</p>
          )}
        </div>

        {/* My Tickets Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-purple-400">My Tickets</h3>
          {loading ? (
            <p className="text-gray-400">Loading your tickets...</p>
          ) : myTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-gray-300">Ticket #{ticket.id}</span>
                    <span className="px-2 py-1 bg-purple-600 text-white text-sm rounded">
                      {ticket.claimed ? "Claimed" : "Active"}
                    </span>
                  </div>
                  
                  {/* Listing Form */}
                  <div className="mt-4">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Price in ETH"
                      className="w-full p-2 bg-gray-600 text-white rounded mb-2"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                    />
                    <button
                      onClick={() => listTicketForSale(ticket.id, listingPrice)}
                      disabled={loading || !listingPrice}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                               text-white rounded transition-colors"
                    >
                      List for Sale
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">You don't have any tickets to list</p>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded ${
            message.includes("success") 
              ? "bg-green-900/30 text-green-400" 
              : "bg-red-900/30 text-red-400"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeTickets;