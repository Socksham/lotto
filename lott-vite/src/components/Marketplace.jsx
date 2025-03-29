import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { useAddress } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { ShoppingBag, Tag, Ticket, Loader, Search, Filter } from "lucide-react";
import Navbar from "./Navbar";

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [ownedTickets, setOwnedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("buy"); // "buy" or "sell"
  const [listingPrice, setListingPrice] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [message, setMessage] = useState("");
  const [roundInfo, setRoundInfo] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "active", "matching"
  const address = useAddress();

  useEffect(() => {
    if (address) {
      fetchMarketplaceData();
      fetchRoundInfo();
    }
  }, [address]);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      // Fetch listed tickets
      const listedTicketIds = await contract.getAllMarketplaceListings();
      const listingsPromises = listedTicketIds.map(async (id) => {
        const details = await contract.getTicketDetails(id);
        const listing = await contract.getTicketListing(id);
        
        return {
          id: id.toString(),
          numbers: details.numbers.map(n => n.toNumber()),
          price: ethers.utils.formatEther(listing.price),
          seller: listing.seller,
          status: details.status,
          matchedSoFar: details.status.includes("Matched") 
            ? parseInt(details.status) 
            : 0
        };
      });
      
      // Fetch owned tickets
      const ownedTicketIds = await contract.getTicketsOfOwner(address);
      const ownedPromises = ownedTicketIds.map(async (id) => {
        const details = await contract.getTicketDetails(id);
        const listing = await contract.getTicketListing(id);
        
        return {
          id: id.toString(),
          numbers: details.numbers.map(n => n.toNumber()),
          isListed: listing.active,
          price: listing.active ? ethers.utils.formatEther(listing.price) : null,
          status: details.status,
          matchedSoFar: details.status.includes("Matched") 
            ? parseInt(details.status) 
            : 0
        };
      });

      const [fetchedListings, fetchedOwned] = await Promise.all([
        Promise.all(listingsPromises),
        Promise.all(ownedPromises)
      ]);

      setListings(fetchedListings);
      setOwnedTickets(fetchedOwned);
    } catch (error) {
      console.error("Error fetching marketplace data:", error);
      setMessage("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoundInfo = async () => {
    try {
      const contract = await getContract();
      const info = await contract.getCurrentRoundInfo();
      const revealedNumbers = await contract.getRevealedNumbers();
      
      setRoundInfo({
        currentRound: info.round.toNumber(),
        revealIndex: info.revealIndex.toNumber(),
        isComplete: info.isComplete,
        prize: ethers.utils.formatEther(info.prize),
        nextRevealTime: new Date(info.nextRevealTime.toNumber() * 1000),
        revealedNumbers: revealedNumbers.map(n => n.toNumber())
      });
    } catch (error) {
      console.error("Error fetching round info:", error);
    }
  };

  const listTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicketId || !listingPrice) {
      setMessage("Please select a ticket and enter a price");
      return;
    }

    try {
      setLoading(true);
      const contract = await getContract();
      
      // Convert ETH to Wei for contract
      const priceInWei = ethers.utils.parseEther(listingPrice);
      
      const tx = await contract.listTicket(selectedTicketId, priceInWei);
      setMessage("Listing your ticket...");
      await tx.wait();
      
      setMessage("Successfully listed your ticket!");
      await fetchMarketplaceData(); // Refresh data
      
      // Reset form
      setSelectedTicketId(null);
      setListingPrice("");
    } catch (error) {
      console.error("Error listing ticket:", error);
      setMessage(error.message || "Failed to list ticket");
    } finally {
      setLoading(false);
    }
  };

  const cancelListing = async (ticketId) => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      const tx = await contract.delistTicket(ticketId);
      setMessage("Canceling your listing...");
      await tx.wait();
      
      setMessage("Successfully canceled your listing!");
      await fetchMarketplaceData(); // Refresh data
    } catch (error) {
      console.error("Error canceling listing:", error);
      setMessage(error.message || "Failed to cancel listing");
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async (ticketId, price) => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      // Convert ETH price to Wei
      const priceInWei = ethers.utils.parseEther(price);
      
      const tx = await contract.buyTicket(ticketId, {
        value: priceInWei
      });
      setMessage("Purchasing ticket...");
      await tx.wait();
      
      setMessage("Successfully purchased ticket #" + ticketId + "!");
      await fetchMarketplaceData(); // Refresh data
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      setMessage(error.message || "Failed to purchase ticket");
    } finally {
      setLoading(false);
    }
  };

  // Filter listings based on current filter state
  const filteredListings = listings.filter(listing => {
    if (filter === "all") return true;
    if (filter === "active" && listing.status === "Active") return true;
    if (filter === "matching" && listing.matchedSoFar > 0) return true;
    return false;
  });

  // Helper to generate status label and color
  const getStatusLabel = (status, matchedSoFar) => {
    if (status === "Active") return { label: "Active", color: "text-green-400 bg-green-900/30 border-green-700" };
    if (status === "Invalid") return { label: "Invalid", color: "text-red-400 bg-red-900/30 border-red-700" };
    if (matchedSoFar > 0) return { 
      label: `${matchedSoFar}/6 Matched`, 
      color: "text-blue-400 bg-blue-900/30 border-blue-700" 
    };
    return { label: status, color: "text-gray-400 bg-gray-900/30 border-gray-700" };
  };

  // Mock data generators
  const generateMockListings = () => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: 100 + i,
      numbers: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)),
      price: (0.01 + Math.random() * 0.04).toFixed(3),
      seller: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 8)}`,
      status: Math.random() > 0.3 ? "Active" : "Invalid",
      matchedSoFar: Math.floor(Math.random() * 3)
    }));
  };

  const generateMockOwnedTickets = () => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: 200 + i,
      numbers: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)),
      isListed: Math.random() > 0.5,
      price: Math.random() > 0.5 ? (0.01 + Math.random() * 0.04).toFixed(3) : null,
      status: Math.random() > 0.3 ? "Active" : "Invalid",
      matchedSoFar: Math.floor(Math.random() * 3)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <Navbar />

      <div className="container mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Ticket Marketplace
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Buy, sell, and trade lottery tickets
          </p>
        </div>

        {roundInfo && (
          <div className="max-w-3xl mx-auto mb-8 bg-black/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <h3 className="text-lg font-medium text-purple-300 mb-2">Current Round: #{roundInfo.currentRound}</h3>
            <div className="flex justify-center items-center space-x-6 mb-2">
              <div>
                <p className="text-sm text-gray-400">Prize Pool</p>
                <p className="text-xl font-bold">{roundInfo.prize} ETH</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Revealed Numbers</p>
                <div className="flex space-x-2 mt-1">
                  {roundInfo.revealedNumbers.map((num, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {num}
                    </div>
                  ))}
                  {Array(6 - roundInfo.revealedNumbers.length).fill(0).map((_, idx) => (
                    <div key={`empty-${idx}`} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold">
                      ?
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {roundInfo.isComplete 
                ? "Round Complete" 
                : `Next number reveal: ${roundInfo.nextRevealTime.toLocaleString()}`}
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button 
                onClick={() => setSelectedTab("buy")}
                className={`flex-1 py-4 font-medium text-center transition ${
                  selectedTab === "buy" 
                    ? "text-purple-400 border-b-2 border-purple-500" 
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <ShoppingBag className="inline-block h-4 w-4 mr-2" />
                Buy Tickets
              </button>
              <button 
                onClick={() => setSelectedTab("sell")}
                className={`flex-1 py-4 font-medium text-center transition ${
                  selectedTab === "sell" 
                    ? "text-purple-400 border-b-2 border-purple-500" 
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Tag className="inline-block h-4 w-4 mr-2" />
                Sell Tickets
              </button>
            </div>

            {/* Buy Tab */}
            {selectedTab === "buy" && (
              <div className="p-6">
                {/* Filter and Search */}
                <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => setFilter("all")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                          filter === "all" 
                            ? "bg-purple-700/50 text-purple-200" 
                            : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                        }`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setFilter("active")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                          filter === "active" 
                            ? "bg-purple-700/50 text-purple-200" 
                            : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                        }`}
                      >
                        Active
                      </button>
                      <button 
                        onClick={() => setFilter("matching")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                          filter === "matching" 
                            ? "bg-purple-700/50 text-purple-200" 
                            : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                        }`}
                      >
                        Matching
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by ID or numbers..."
                      className="pl-10 pr-4 py-2 bg-gray-800/70 rounded-lg text-gray-300 text-sm w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    {filteredListings.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No tickets available matching your filter</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((listing) => {
                          const statusInfo = getStatusLabel(listing.status, listing.matchedSoFar);
                          return (
                            <div key={listing.id} className="bg-black/40 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-medium text-white">Ticket #{listing.id}</h3>
                                <div className={`px-2 py-1 text-xs rounded-full border ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </div>
                              </div>
                              
                              <div className="flex justify-center mb-4">
                                {listing.numbers.map((num, idx) => (
                                  <div 
                                    key={idx} 
                                    className="w-8 h-8 m-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold"
                                  >
                                    {num}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex justify-between items-center border-t border-gray-800 pt-3 mt-3">
                                <div>
                                  <p className="text-xs text-gray-500">Price</p>
                                  <p className="text-lg font-bold">{listing.price} ETH</p>
                                </div>
                                <button
                                  onClick={() => buyTicket(listing.id, listing.price)}
                                  disabled={loading || !address}
                                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition flex items-center space-x-1"
                                >
                                  <ShoppingBag className="h-4 w-4" />
                                  <span>Buy</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sell Tab */}
            {selectedTab === "sell" && (
              <div className="p-6">
                {!address ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Please connect your wallet to view your tickets</p>
                  </div>
                ) : loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    {ownedTickets.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>You don't own any tickets yet</p>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-purple-300 mb-4">Your Tickets</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          {ownedTickets.map((ticket) => {
                            const statusInfo = getStatusLabel(ticket.status, ticket.matchedSoFar);
                            return (
                              <div 
                                key={ticket.id} 
                                className={`bg-black/40 rounded-xl p-5 border transition ${
                                  selectedTicketId === ticket.id 
                                    ? "border-purple-500" 
                                    : ticket.isListed ? "border-green-800/50" : "border-gray-800 hover:border-gray-700"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="text-lg font-medium text-white">Ticket #{ticket.id}</h3>
                                  <div className={`px-2 py-1 text-xs rounded-full border ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </div>
                                </div>
                                
                                <div className="flex justify-center mb-4">
                                  {ticket.numbers.map((num, idx) => (
                                    <div 
                                      key={idx} 
                                      className="w-8 h-8 m-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold"
                                    >
                                      {num}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex justify-between items-center border-t border-gray-800 pt-3 mt-3">
                                  {ticket.isListed ? (
                                    <>
                                      <div>
                                        <p className="text-xs text-green-500">Listed for</p>
                                        <p className="text-lg font-bold">{ticket.price} ETH</p>
                                      </div>
                                      <button
                                        onClick={() => cancelListing(ticket.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setSelectedTicketId(ticket.id)}
                                        disabled={loading}
                                        className={`px-4 py-2 ${
                                          selectedTicketId === ticket.id 
                                            ? "bg-purple-700" 
                                            : "bg-gray-700 hover:bg-gray-600"
                                        } text-white rounded-lg transition flex items-center space-x-1`}
                                      >
                                        <Tag className="h-4 w-4" />
                                        <span>{selectedTicketId === ticket.id ? "Selected" : "Select"}</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Listing Form */}
                        {selectedTicketId && (
                          <form onSubmit={listTicket} className="max-w-md mx-auto bg-black/40 rounded-xl p-5 border border-gray-800">
                            <h3 className="text-lg font-medium text-purple-300 mb-4">List Ticket #{selectedTicketId}</h3>
                            
                            <div className="mb-4">
                              <label className="block text-sm text-gray-400 mb-2">Price in ETH</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={listingPrice}
                                  onChange={(e) => setListingPrice(e.target.value)}
                                  min="0.001"
                                  step="0.001"
                                  placeholder="0.01"
                                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  required
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                  <span className="text-gray-500">ETH</span>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              type="submit"
                              disabled={loading || !listingPrice}
                              className="relative w-full group"
                            >
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                              <div className={`relative w-full py-3 px-6 bg-black rounded-lg flex items-center justify-center space-x-2 
                                          ${(loading || !listingPrice) ? 'opacity-70' : ''}`}>
                                {loading ? (
                                  <>
                                    <Loader className="h-5 w-5 animate-spin" />
                                    <span className="font-semibold">Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Tag className="h-5 w-5" />
                                    <span className="font-semibold">List Ticket</span>
                                  </>
                                )}
                              </div>
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </>
                )}

                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
                    message.includes("Success") ? "bg-green-900/30 text-green-400 border border-green-700" : "bg-red-900/30 text-red-400 border border-red-700"
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-black/30 py-6 mt-12">
        <div className="container mx-auto px-8 text-center">
          <p className="text-gray-500">
            © 2024 NumberDrop Lottery. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;