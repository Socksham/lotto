import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { useAddress } from "@thirdweb-dev/react";

const AdminPanel = () => {
  const address = useAddress();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roundInfo, setRoundInfo] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!address) {
      setIsOwner(false);
      setLoading(false);
      return;
    }
    
    checkOwnership();
  }, [address]);

  const checkOwnership = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      // Check if connected user is the contract owner
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
      
      if (owner.toLowerCase() === address.toLowerCase()) {
        // Load round info
        const info = await contract.getCurrentRoundInfo();
        console.log(info);
        setRoundInfo({
          round: info.round.toNumber(),
          revealIndex: info.revealIndex.toNumber(),
          isComplete: info.isComplete,
          nextRevealTime: info.nextRevealTime.toNumber()
        });
      }
    } catch (err) {
      console.error("Error checking ownership:", err);
      setMessage("Failed to check contract ownership");
    } finally {
      setLoading(false);
    }
  };

  const refreshInfo = async () => {
    try {
      setMessage("");
      const contract = await getContract();
      const info = await contract.getCurrentRoundInfo();
      setRoundInfo({
        round: info.round.toNumber(),
        revealIndex: info.revealIndex.toNumber(),
        isComplete: info.isComplete,
        nextRevealTime: info.nextRevealTime.toNumber()
      });
    } catch (err) {
      console.error("Error refreshing info:", err);
      setMessage("Failed to refresh information");
    }
  };

  const revealNumber = async () => {
    try {
      setActionLoading("reveal");
      setMessage("");
      const contract = await getContract();
  
      console.log("Calling revealNumber...");
      const tx = await contract.revealNumber({ gasLimit: 10000000000 });
  
      setMessage("Revealing number...");
      await tx.wait();
      setMessage("Number revealed successfully!");
      await refreshInfo();
    } catch (err) {
      console.error("Detailed Error:", err);
      setMessage(err.data?.message || err.message || "Failed to reveal number");
    } finally {
      setActionLoading("");
    }
  };
  

  const startNewRound = async () => {
    try {
      setActionLoading("newRound");
      setMessage("");
      
      const contract = await getContract();
      const tx = await contract.startNewRound();
      
      setMessage("Starting new round...");
      await tx.wait();
      setMessage("New round started successfully!");
      
      // Refresh round info
      await refreshInfo();
    } catch (err) {
      console.error("Error starting new round:", err);
      setMessage(err.message || "Failed to start new round");
    } finally {
      setActionLoading("");
    }
  };

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
        <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-3/4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
        <p className="text-gray-400 text-center">Please connect your wallet to access admin features</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
        <p className="text-red-400 text-center">You don't have permission to access this page. Only the contract owner can access admin features.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${
          message.includes("successfully") 
            ? "bg-green-900/30 border border-green-500 text-green-400" 
            : "bg-blue-900/30 border border-blue-500 text-blue-400"
        }`}>
          {message}
        </div>
      )}
      
      {roundInfo && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Current Round Status</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Round</span>
              <span className="text-white font-medium">{roundInfo.round}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Revealed Numbers</span>
              <span className="text-white font-medium">{roundInfo.revealIndex}/6</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Round Status</span>
              <span className={`font-medium ${roundInfo.isComplete ? "text-green-400" : "text-blue-400"}`}>
                {roundInfo.isComplete ? "Complete" : "In Progress"}
              </span>
            </div>
            
            {!roundInfo.isComplete && (
              <div className="flex justify-between">
                <span className="text-gray-400">Next Reveal In</span>
                <span className="text-white font-medium">{formatTimeLeft(roundInfo.nextRevealTime)}</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={refreshInfo}
            className="mt-4 w-full py-2 px-4 border border-gray-600 hover:bg-gray-600 
                     text-gray-300 font-medium rounded-lg transition-colors"
          >
            Refresh Info
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        <button 
          onClick={revealNumber}
          disabled={actionLoading === "reveal" || roundInfo?.isComplete || roundInfo?.nextRevealTime > Math.floor(Date.now() / 1000)}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                   text-white font-semibold rounded-lg transition-colors"
        >
          {actionLoading === "reveal" ? "Revealing..." : "Reveal Next Number"}
        </button>
        
        <button 
          onClick={startNewRound}
          disabled={actionLoading === "newRound" || !roundInfo?.isComplete}
          className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                   text-white font-semibold rounded-lg transition-colors"
        >
          {actionLoading === "newRound" ? "Starting..." : "Start New Round"}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;