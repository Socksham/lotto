import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

const LotteryStatusDashboard = () => {
  const [roundInfo, setRoundInfo] = useState({
    round: 0,
    revealIndex: 0,
    isComplete: false,
    prize: "0",
    nextRevealTime: 0
  });
  const [revealedNumbers, setRevealedNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLotteryStatus = async () => {
      try {
        setLoading(true);
        const contract = await getContract();
        
        // Get current round info
        const info = await contract.getCurrentRoundInfo();
        
        // Get revealed numbers
        const numbers = await contract.getRevealedNumbers();
        
        setRoundInfo({
          round: info.round.toNumber(),
          revealIndex: info.revealIndex.toNumber(),
          isComplete: info.isComplete,
          prize: ethers.utils.formatEther(info.prize),
          nextRevealTime: info.nextRevealTime.toNumber()
        });
        
        setRevealedNumbers(numbers.map(n => n.toNumber()));
        setError("");
      } catch (err) {
        console.error("Error fetching lottery status:", err);
        setError("Failed to load lottery status");
      } finally {
        setLoading(false);
      }
    };

    fetchLotteryStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchLotteryStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (timestamp) => {
    if (timestamp <= Math.floor(Date.now() / 1000)) {
      return "Ready for reveal";
    }
    
    const secondsLeft = timestamp - Math.floor(Date.now() / 1000);
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-3/4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 w-12 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-6 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-white">Lottery Status</h2>
      
      {error ? (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400 mb-4">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-400 mb-1">Current Round</p>
            <p className="text-white text-2xl font-bold">{roundInfo.round}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-400 mb-1">Prize Pool</p>
            <p className="text-white text-2xl font-bold">{roundInfo.prize} ETH</p>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-400 mb-1">Revealed Numbers</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {revealedNumbers.length > 0 ? (
                revealedNumbers.map((number, index) => (
                  <div key={index} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white text-xl font-bold rounded-lg">
                    {number}
                  </div>
                ))
              ) : (
                <p className="text-gray-300 italic">No numbers revealed yet</p>
              )}
              
              {/* Placeholder for unrevealed numbers */}
              {[...Array(6 - revealedNumbers.length)].map((_, index) => (
                <div key={`placeholder-${index}`} className="w-12 h-12 flex items-center justify-center bg-gray-700 text-gray-500 text-xl font-bold rounded-lg">
                  ?
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-400 mb-1">Status</p>
            <p className="text-white font-medium">
              {roundInfo.isComplete ? (
                <span className="text-green-400">Round Complete</span>
              ) : (
                <>Revealed <span className="text-blue-400">{roundInfo.revealIndex}/6</span> numbers</>
              )}
            </p>
          </div>
          
          {!roundInfo.isComplete && (
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Next Reveal In</p>
              <p className="text-white font-medium">{formatTimeLeft(roundInfo.nextRevealTime)}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LotteryStatusDashboard;