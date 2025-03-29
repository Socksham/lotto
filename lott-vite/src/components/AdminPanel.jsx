import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { useAddress } from "@thirdweb-dev/react";
import { Clock, Ticket, Award, Rocket } from "lucide-react";

const AdminPanel = ({ Nav }) => {
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
          nextRevealTime: info.nextRevealTime.toNumber(),
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
        nextRevealTime: info.nextRevealTime.toNumber(),
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
  
      console.log("Contract instance:", contract);
  
      // Estimate gas before calling function
      const estimatedGas = await contract.estimateGas.revealNumber();
  
      console.log("Estimated Gas:", estimatedGas.toString());
  
      console.log("Calling revealNumber...");
      const tx = await contract.revealNumber({
        gasLimit: estimatedGas.mul(2), // Double for buffer
      });
  
      setMessage("Revealing number...");
      await tx.wait();
      setMessage("Number revealed successfully!");
      
      await refreshInfo();
    } catch (err) {
      console.error("Error revealing number:", err);
      setMessage(err?.data?.message || err.message || "Failed to reveal number");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        {/* Navigation */}
        {Nav}
        
        <div className="container mx-auto px-8 py-16">
          <div className="bg-purple-800/30 rounded-2xl p-8 backdrop-blur-lg max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Admin Panel</h2>
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-purple-800/50 rounded w-3/4 mx-auto"></div>
              <div className="h-12 bg-purple-800/50 rounded"></div>
              <div className="h-8 bg-purple-800/50 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        {/* Navigation */}
        {Nav}
        
        <div className="container mx-auto px-8 py-16">
          <div className="bg-purple-800/30 rounded-2xl p-8 backdrop-blur-lg max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Admin Panel</h2>
            <p className="text-xl text-gray-300 text-center">
              Please connect your wallet to access admin features
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        {/* Navigation */}
        {Nav}
        
        <div className="container mx-auto px-8 py-16">
          <div className="bg-purple-800/30 rounded-2xl p-8 backdrop-blur-lg max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Admin Panel</h2>
            <p className="text-2xl text-pink-400 text-center">
              You don't have permission to access this page
            </p>
            <p className="text-gray-300 text-center mt-4">
              Only the contract owner can access admin features
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Navigation */}
      {Nav}

      {/* Main Content */}
      <div className="container mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            NumberDrop Admin Panel
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Manage lottery rounds, reveal numbers, and control the game flow
          </p>
        </div>

        {message && (
          <div
            className={`max-w-2xl mx-auto p-4 mb-8 rounded-lg backdrop-blur-sm ${
              message.includes("successfully")
                ? "bg-green-900/30 border border-green-500 text-green-400"
                : "bg-purple-900/30 border border-purple-500 text-purple-400"
            }`}
          >
            {message}
          </div>
        )}

        {roundInfo && (
          <div className="max-w-2xl mx-auto bg-purple-800/30 rounded-2xl p-8 backdrop-blur-lg mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-purple-200 mb-4">
                Current Lottery Status
              </h3>

              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                    {roundInfo.round}
                  </div>
                  <div className="text-gray-400 mt-2">Round</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                    {roundInfo.revealIndex}/6
                  </div>
                  <div className="text-gray-400 mt-2">Numbers Revealed</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-xl font-bold py-1 px-3 rounded-full ${
                    roundInfo.isComplete 
                      ? "bg-green-900/50 text-green-400" 
                      : "bg-blue-900/50 text-blue-400"
                  }`}>
                    {roundInfo.isComplete ? "Complete" : "In Progress"}
                  </div>
                  <div className="text-gray-400 mt-2">Status</div>
                </div>
              </div>

              {!roundInfo.isComplete && (
                <div className="bg-black/30 p-4 rounded-lg inline-block">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span className="text-purple-200">Next Reveal:</span>
                    <span className="text-white font-medium">
                      {formatTimeLeft(roundInfo.nextRevealTime)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={refreshInfo}
              className="w-full py-2 px-4 border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white font-medium rounded-lg transition-colors"
            >
              Refresh Status
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={revealNumber}
            disabled={
              actionLoading === "reveal" ||
              roundInfo?.isComplete ||
              roundInfo?.nextRevealTime > Math.floor(Date.now() / 1000)
            }
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50
                    p-6 rounded-xl text-center transition-all duration-300"
          >
            <div className="flex flex-col items-center justify-center">
              <Ticket className="h-12 w-12 mb-3" />
              <span className="text-xl font-bold">
                {actionLoading === "reveal" ? "Revealing..." : "Reveal Next Number"}
              </span>
              <span className="text-sm text-gray-300 mt-2">
                Unveil the next lottery number
              </span>
            </div>
          </button>

          <button
            onClick={startNewRound}
            disabled={actionLoading === "newRound" || !roundInfo?.isComplete}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50
                    p-6 rounded-xl text-center transition-all duration-300"
          >
            <div className="flex flex-col items-center justify-center">
              <Rocket className="h-12 w-12 mb-3" />
              <span className="text-xl font-bold">
                {actionLoading === "newRound" ? "Starting..." : "Start New Round"}
              </span>
              <span className="text-sm text-gray-300 mt-2">
                Begin a new lottery sequence
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 py-8 mt-16">
        <div className="container mx-auto px-8 text-center">
          <p className="text-gray-500">
            © 2024 NumberDrop Lottery Admin. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminPanel;

// import { useState, useEffect } from "react";
// import { getContract } from "../utils/contract";
// import { useAddress } from "@thirdweb-dev/react";
// import { prepareContractCall } from "thirdweb";
// import { useSendTransaction } from "thirdweb/react";

// const AdminPanel = () => {
//   const address = useAddress();
//   const [isOwner, setIsOwner] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [roundInfo, setRoundInfo] = useState(null);
//   const [actionLoading, setActionLoading] = useState("");
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     if (!address) {
//       setIsOwner(false);
//       setLoading(false);
//       return;
//     }

//     checkOwnership();
//   }, [address]);

//   const checkOwnership = async () => {
//     try {
//       setLoading(true);
//       const contract = await getContract();

//       // Check if connected user is the contract owner
//       const owner = await contract.owner();
//       setIsOwner(owner.toLowerCase() === address.toLowerCase());

//       if (owner.toLowerCase() === address.toLowerCase()) {
//         // Load round info
//         const info = await contract.getCurrentRoundInfo();
//         console.log(info);
//         setRoundInfo({
//           round: info.round.toNumber(),
//           revealIndex: info.revealIndex.toNumber(),
//           isComplete: info.isComplete,
//           nextRevealTime: info.nextRevealTime.toNumber(),
//         });
//       }
//     } catch (err) {
//       console.error("Error checking ownership:", err);
//       setMessage("Failed to check contract ownership");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshInfo = async () => {
//     try {
//       setMessage("");
//       const contract = await getContract();
//       const info = await contract.getCurrentRoundInfo();
//       setRoundInfo({
//         round: info.round.toNumber(),
//         revealIndex: info.revealIndex.toNumber(),
//         isComplete: info.isComplete,
//         nextRevealTime: info.nextRevealTime.toNumber(),
//       });
//     } catch (err) {
//       console.error("Error refreshing info:", err);
//       setMessage("Failed to refresh information");
//     }
//   };

//   const revealNumber = async () => {
//     try {
//       setActionLoading("reveal");
//       setMessage("");

//       const contract = await getContract();
  
//       console.log("Contract instance:", contract);
  
//       // Estimate gas before calling function
//       const estimatedGas = await contract.estimateGas.revealNumber();
  
//       console.log("Estimated Gas:", estimatedGas.toString());
  
//       console.log("Calling revealNumber...");
//       const tx = await contract.revealNumber({
//         gasLimit: estimatedGas.mul(2), // Double for buffer
//       });
  
//       setMessage("Revealing number...");
//       await tx.wait();
//       setMessage("Number revealed successfully!");
      
//       await refreshInfo();
//     } catch (err) {
//       console.error("Error revealing number:", err);
//       setMessage(err?.data?.message || err.message || "Failed to reveal number");
//     } finally {
//       setActionLoading("");
//     }
//   };
  

//   // const revealNumber = async () => {
//   //   try {
//   //     setActionLoading("reveal");
//   //     setMessage("");
//   //     const contract = await getContract();

//   //     console.log("Calling revealNumber...");
//   //     const tx = await contract.revealNumber({ gasLimit: 100000 });

//   //     setMessage("Revealing number...");
//   //     await tx.wait();
//   //     setMessage("Number revealed successfully!");
//   //     await refreshInfo();
//   //   } catch (err) {
//   //     console.error("Detailed Error:", err);
//   //     setMessage(err.data?.message || err.message || "Failed to reveal number");
//   //   } finally {
//   //     setActionLoading("");
//   //   }
//   // };

//   const startNewRound = async () => {
//     try {
//       setActionLoading("newRound");
//       setMessage("");

//       const contract = await getContract();
//       const tx = await contract.startNewRound();

//       setMessage("Starting new round...");
//       await tx.wait();
//       setMessage("New round started successfully!");

//       // Refresh round info
//       await refreshInfo();
//     } catch (err) {
//       console.error("Error starting new round:", err);
//       setMessage(err.message || "Failed to start new round");
//     } finally {
//       setActionLoading("");
//     }
//   };

//   const formatTimeLeft = (timestamp) => {
//     if (timestamp <= Math.floor(Date.now() / 1000)) {
//       return "Ready for reveal";
//     }

//     const secondsLeft = timestamp - Math.floor(Date.now() / 1000);
//     const days = Math.floor(secondsLeft / 86400);
//     const hours = Math.floor((secondsLeft % 86400) / 3600);
//     const minutes = Math.floor((secondsLeft % 3600) / 60);

//     return `${days}d ${hours}h ${minutes}m`;
//   };

//   if (loading) {
//     return (
//       <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//         <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
//         <div className="animate-pulse space-y-4">
//           <div className="h-6 bg-gray-700 rounded w-3/4"></div>
//           <div className="h-10 bg-gray-700 rounded"></div>
//           <div className="h-6 bg-gray-700 rounded w-1/2"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!address) {
//     return (
//       <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//         <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
//         <p className="text-gray-400 text-center">
//           Please connect your wallet to access admin features
//         </p>
//       </div>
//     );
//   }

//   if (!isOwner) {
//     return (
//       <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//         <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>
//         <p className="text-red-400 text-center">
//           You don\&post have permission to access this page. Only the contract
//           owner can access admin features.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//       <h2 className="text-2xl font-bold mb-6 text-white">Admin Panel</h2>

//       {message && (
//         <div
//           className={`p-4 mb-6 rounded-lg ${
//             message.includes("successfully")
//               ? "bg-green-900/30 border border-green-500 text-green-400"
//               : "bg-blue-900/30 border border-blue-500 text-blue-400"
//           }`}
//         >
//           {message}
//         </div>
//       )}

//       {roundInfo && (
//         <div className="mb-6 p-4 bg-gray-700 rounded-lg">
//           <h3 className="text-lg font-semibold text-white mb-4">
//             Current Round Status
//           </h3>

//           <div className="space-y-3">
//             <div className="flex justify-between">
//               <span className="text-gray-400">Round</span>
//               <span className="text-white font-medium">{roundInfo.round}</span>
//             </div>

//             <div className="flex justify-between">
//               <span className="text-gray-400">Revealed Numbers</span>
//               <span className="text-white font-medium">
//                 {roundInfo.revealIndex}/6
//               </span>
//             </div>

//             <div className="flex justify-between">
//               <span className="text-gray-400">Round Status</span>
//               <span
//                 className={`font-medium ${
//                   roundInfo.isComplete ? "text-green-400" : "text-blue-400"
//                 }`}
//               >
//                 {roundInfo.isComplete ? "Complete" : "In Progress"}
//               </span>
//             </div>

//             {!roundInfo.isComplete && (
//               <div className="flex justify-between">
//                 <span className="text-gray-400">Next Reveal In</span>
//                 <span className="text-white font-medium">
//                   {formatTimeLeft(roundInfo.nextRevealTime)}
//                 </span>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={refreshInfo}
//             className="mt-4 w-full py-2 px-4 border border-gray-600 hover:bg-gray-600 
//                      text-gray-300 font-medium rounded-lg transition-colors"
//           >
//             Refresh Info
//           </button>
//         </div>
//       )}

//       <div className="space-y-4">
//         <button
//           onClick={revealNumber}
//           disabled={
//             actionLoading === "reveal" ||
//             roundInfo?.isComplete ||
//             roundInfo?.nextRevealTime > Math.floor(Date.now() / 1000)
//           }
//           className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
//                    text-white font-semibold rounded-lg transition-colors"
//         >
//           {actionLoading === "reveal" ? "Revealing..." : "Reveal Next Number"}
//         </button>

//         <button
//           onClick={startNewRound}
//           disabled={actionLoading === "newRound" || !roundInfo?.isComplete}
//           className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
//                    text-white font-semibold rounded-lg transition-colors"
//         >
//           {actionLoading === "newRound" ? "Starting..." : "Start New Round"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AdminPanel;
