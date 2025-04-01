import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Tag, ArrowRight, User, Ticket, DollarSign, TicketCheck } from 'lucide-react';
import { getContract } from '../utils/contract';

const LiveActivityFeed = () => {
  const [loading, setLoading] = useState(true);
  const activitiesRef = useRef([]); // Store activities in a ref to avoid unnecessary re-renders
  const [, forceUpdate] = useState(); // Force state update for UI refresh
  const contractRef = useRef(null);

  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const contract = await getContract();
        contractRef.current = contract; // Store contract reference
        
        const addActivity = (activity) => {
          activitiesRef.current = [activity, ...activitiesRef.current].slice(0, 20);
          forceUpdate({}); // Trigger a re-render
        };

        contract.on("TicketMinted", (tokenId, owner, numbers, event) => {
          addActivity({
            id: `mint-${Date.now()}-${tokenId}`,
            type: 'mint',
            tokenId: tokenId.toString(),
            address: formatAddress(owner),
            numbers: numbers.map(n => n.toString()),
            timestamp: Date.now(),
            transactionHash: event.transactionHash
          });
        });

        contract.on("TicketListed", (tokenId, seller, price, event) => {
          addActivity({
            id: `list-${Date.now()}-${tokenId}`,
            type: 'list',
            tokenId: tokenId.toString(),
            address: formatAddress(seller),
            price: ethers.utils.formatEther(price),
            timestamp: Date.now(),
            transactionHash: event.transactionHash
          });
        });

        contract.on("TicketSold", (tokenId, seller, buyer, price, event) => {
          addActivity({
            id: `sale-${Date.now()}-${tokenId}`,
            type: 'sale',
            tokenId: tokenId.toString(),
            seller: formatAddress(seller),
            buyer: formatAddress(buyer),
            price: ethers.utils.formatEther(price),
            timestamp: Date.now(),
            transactionHash: event.transactionHash
          });
        });

        contract.on("PrizeAwarded", (winner, amount, event) => {
          addActivity({
            id: `prize-${Date.now()}`,
            type: 'prize',
            winner: formatAddress(winner),
            amount: ethers.utils.formatEther(amount),
            timestamp: Date.now(),
            transactionHash: event.transactionHash
          });
        });

        setLoading(false);
      } catch (error) {
        console.error("Error setting up event listeners:", error);
        setLoading(false);
      }
    };

    setupEventListeners();

    return () => {
      if (contractRef.current) {
        contractRef.current.removeAllListeners();
      }
    };
  }, []);

  const formatAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'mint': return <Ticket className="h-4 w-4 text-green-400" />;
      case 'list': return <Tag className="h-4 w-4 text-blue-400" />;
      case 'sale': return <DollarSign className="h-4 w-4 text-purple-400" />;
      case 'prize': return <TicketCheck className="h-4 w-4 text-yellow-400" />;
      default: return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 text-white h-full">
      <h3 className="text-xl font-semibold mb-4 text-purple-200 flex items-center">
        <div className="mr-3 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        Live Activity
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 py-2 border-b border-gray-800">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activitiesRef.current.length > 0 ? (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
          {activitiesRef.current.map(activity => (
            <div 
              key={activity.id}
              className="flex items-center py-2 border-b border-gray-800 text-sm hover:bg-purple-900/20 transition rounded px-2"
            >
              <div className="flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full mr-3">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">{activity.address || activity.seller}</span>
                  {activity.buyer && <ArrowRight className="h-3 w-3 text-gray-500" />}
                  {activity.buyer && <span className="text-gray-300">{activity.buyer}</span>}
                  <span className="text-purple-300">#{activity.tokenId}</span>
                  {activity.price && <span className="text-green-300">{activity.price} ETH</span>}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {getTimeAgo(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No activity yet. Transactions will appear here in real-time.
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;
