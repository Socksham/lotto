import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";
import { Ticket, Award, Clock } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        <div className="container mx-auto px-8 py-12">
          <div className="animate-pulse space-y-6 max-w-lg mx-auto">
            <div className="h-8 bg-purple-800/30 rounded w-3/4"></div>
            <div className="h-16 bg-purple-800/30 rounded"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-purple-800/30 rounded-lg"></div>
              ))}
            </div>
            <div className="h-8 bg-purple-800/30 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Navigation */}
      <nav className="px-8 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Ticket className="h-8 w-8 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">
            NumberDrop Lottery
          </h1>
        </div>
        <div className="space-x-6">
          <div className="relative group inline-block">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative px-4 py-2 bg-black rounded-lg">
              <span className="text-purple-400">
                🚀 Connect
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Lottery Dashboard
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Track the current lottery round and revealed numbers
          </p>
        </div>

        {error ? (
          <div className="max-w-lg mx-auto p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400 mb-8">
            <p className="font-medium text-center">{error}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Left Column - Stats */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-purple-200 mb-4">
                  Round #{roundInfo.round}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-900/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <Award className="h-5 w-5 text-purple-400" />
                      <p className="text-gray-400">Prize Pool</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{roundInfo.prize} ETH</p>
                  </div>
                  
                  <div className="bg-purple-900/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-purple-400" />
                      <p className="text-gray-400">Next Reveal</p>
                    </div>
                    <p className="text-xl font-bold text-white">{formatTimeLeft(roundInfo.nextRevealTime)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <p className="text-gray-400 mb-3">Status</p>
                <div className="bg-purple-900/20 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-lg" 
                    style={{ width: `${(roundInfo.revealIndex / 6) * 100}%` }}
                  ></div>
                </div>
                <p className="text-purple-200 mt-2 text-center">
                  {roundInfo.isComplete ? (
                    <span className="text-green-400">Round Complete ✓</span>
                  ) : (
                    <>Revealed <span className="text-pink-400 font-bold">{roundInfo.revealIndex}/6</span> numbers</>
                  )}
                </p>
              </div>
            </div>
            
            {/* Right Column - Numbers */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-purple-200 mb-6 text-center">
                Lottery Numbers
              </h3>
              
              <div className="grid grid-cols-3 gap-4 justify-items-center">
                {revealedNumbers.map((number, index) => (
                  <div 
                    key={index} 
                    className="w-20 h-24 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl font-bold rounded-lg shadow-lg shadow-purple-700/30"
                  >
                    {number}
                  </div>
                ))}
                
                {/* Placeholder for unrevealed numbers */}
                {[...Array(6 - revealedNumbers.length)].map((_, index) => (
                  <div 
                    key={`placeholder-${index}`} 
                    className="w-20 h-24 flex items-center justify-center bg-gray-800/60 border-2 border-gray-700 text-gray-500 text-3xl font-bold rounded-lg"
                  >
                    ?
                  </div>
                ))}
              </div>
              
              <p className="mt-6 text-center text-purple-300 text-sm">
                {roundInfo.isComplete 
                  ? "All numbers revealed - Round complete" 
                  : `${revealedNumbers.length} numbers revealed - Next reveal in ${formatTimeLeft(roundInfo.nextRevealTime)}`
                }
              </p>
              
              <div className="mt-6 flex justify-center">
                <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition flex items-center space-x-2">
                  <Ticket className="h-5 w-5" />
                  <span>Buy Tickets for Next Round</span>
                </button>
              </div>
            </div>
          </div>
        )}
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

export default LotteryStatusDashboard;

// import { useState, useEffect } from "react";
// import { getContract } from "../utils/contract";
// import { ethers } from "ethers";

// const LotteryStatusDashboard = () => {
//   const [roundInfo, setRoundInfo] = useState({
//     round: 0,
//     revealIndex: 0,
//     isComplete: false,
//     prize: "0",
//     nextRevealTime: 0
//   });
//   const [revealedNumbers, setRevealedNumbers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchLotteryStatus = async () => {
//       try {
//         setLoading(true);
//         const contract = await getContract();
        
//         // Get current round info
//         const info = await contract.getCurrentRoundInfo();
        
//         // Get revealed numbers
//         const numbers = await contract.getRevealedNumbers();
        
//         setRoundInfo({
//           round: info.round.toNumber(),
//           revealIndex: info.revealIndex.toNumber(),
//           isComplete: info.isComplete,
//           prize: ethers.utils.formatEther(info.prize),
//           nextRevealTime: info.nextRevealTime.toNumber()
//         });
        
//         setRevealedNumbers(numbers.map(n => n.toNumber()));
//         setError("");
//       } catch (err) {
//         console.error("Error fetching lottery status:", err);
//         setError("Failed to load lottery status");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLotteryStatus();
    
//     // Refresh every 60 seconds
//     const interval = setInterval(fetchLotteryStatus, 60000);
//     return () => clearInterval(interval);
//   }, []);

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
//         <div className="animate-pulse space-y-4">
//           <div className="h-6 bg-gray-700 rounded w-3/4"></div>
//           <div className="h-10 bg-gray-700 rounded"></div>
//           <div className="grid grid-cols-6 gap-2">
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="h-12 w-12 bg-gray-700 rounded-lg"></div>
//             ))}
//           </div>
//           <div className="h-6 bg-gray-700 rounded w-1/2"></div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//       <h2 className="text-2xl font-bold mb-4 text-white">Lottery Status</h2>
      
//       {error ? (
//         <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400 mb-4">
//           {error}
//         </div>
//       ) : (
//         <>
//           <div className="mb-6">
//             <p className="text-gray-400 mb-1">Current Round</p>
//             <p className="text-white text-2xl font-bold">{roundInfo.round}</p>
//           </div>
          
//           <div className="mb-6">
//             <p className="text-gray-400 mb-1">Prize Pool</p>
//             <p className="text-white text-2xl font-bold">{roundInfo.prize} ETH</p>
//           </div>
          
//           <div className="mb-6">
//             <p className="text-gray-400 mb-1">Revealed Numbers</p>
//             <div className="flex flex-wrap gap-2 mt-2">
//               {revealedNumbers.length > 0 ? (
//                 revealedNumbers.map((number, index) => (
//                   <div key={index} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white text-xl font-bold rounded-lg">
//                     {number}
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-gray-300 italic">No numbers revealed yet</p>
//               )}
              
//               {/* Placeholder for unrevealed numbers */}
//               {[...Array(6 - revealedNumbers.length)].map((_, index) => (
//                 <div key={`placeholder-${index}`} className="w-12 h-12 flex items-center justify-center bg-gray-700 text-gray-500 text-xl font-bold rounded-lg">
//                   ?
//                 </div>
//               ))}
//             </div>
//           </div>
          
//           <div className="mb-4">
//             <p className="text-gray-400 mb-1">Status</p>
//             <p className="text-white font-medium">
//               {roundInfo.isComplete ? (
//                 <span className="text-green-400">Round Complete</span>
//               ) : (
//                 <>Revealed <span className="text-blue-400">{roundInfo.revealIndex}/6</span> numbers</>
//               )}
//             </p>
//           </div>
          
//           {!roundInfo.isComplete && (
//             <div className="mb-4">
//               <p className="text-gray-400 mb-1">Next Reveal In</p>
//               <p className="text-white font-medium">{formatTimeLeft(roundInfo.nextRevealTime)}</p>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default LotteryStatusDashboard;


