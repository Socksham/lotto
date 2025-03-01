import { useState, useEffect } from "react";
import { getContract } from "../utils/contract";
import { useAddress } from "@thirdweb-dev/react";
import { ethers } from "ethers";

// const MyTickets = () => {
//   const address = useAddress();
//   const [tickets, setTickets] = useState([]);a
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [claimingId, setClaimingId] = useState(null);
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     if (!address) {
//       setTickets([]);
//       setLoading(false);
//       return;
//     }
    
//     fetchMyTickets();
//   }, [address]);

//   const fetchMyTickets = async () => {
//     try {
//       setLoading(true);
//       setError("");
      
//       const contract = await getContract();
      
//       // Get user's balance
//       const balance = await contract.balanceOf(address);
//       const balanceNumber = balance.toNumber();
      
//       if (balanceNumber === 0) {
//         setTickets([]);
//         setLoading(false);
//         return;
//       }
      
//       // Get all tokens
//       let userTickets = [];
//       for (let i = 0; i < balanceNumber; i++) {
//         try {
//           // Get tokenId at index
//           const tokenId = await contract.tokenByIndex(i); // If available
          
//           // Get ticket info
//           const ticket = await contract.tickets(tokenId);
          
//           // Call getTicketNumbers (this function needs to be added to your contract)
//           // As an alternative, you could parse the tokenURI for the numbers if you store them there
//           const ticketNumbers = await contract.getTicketNumbers(tokenId);
          
//           // Get ticket status
//           let status = "Unknown";
//           if (ticket.claimed) {
//             status = "Claimed";
//           } else {
//             // This is a simplified way to check status - your contract may have a different way
//             const revealIndex = await contract.currentRevealIndex();
//             const numbers = await contract.getRevealedNumbers();
            
//             if (revealIndex.toNumber() === 0) {
//               status = "Active";
//             } else if (revealIndex.toNumber() === 6) {
//               let allMatch = true;
//               for (let j = 0; j < 6; j++) {
//                 if (ticketNumbers[j].toNumber() !== numbers[j].toNumber()) {
//                   allMatch = false;
//                   break;
//                 }
//               }
//               status = allMatch ? "Winner!" : "Invalid";
//             } else {
//               let matchesSoFar = true;
//               for (let j = 0; j < revealIndex.toNumber(); j++) {
//                 if (ticketNumbers[j].toNumber() !== numbers[j].toNumber()) {
//                   matchesSoFar = false;
//                   break;
//                 }
//               }
//               status = matchesSoFar ? `${revealIndex.toNumber()}/6 Matched` : "Invalid";
//             }
//           }
          
//           userTickets.push({
//             id: tokenId.toNumber(),
//             numbers: ticketNumbers.map(n => n.toNumber()),
//             claimed: ticket.claimed,
//             status: status
//           });
//         } catch (err) {
//           console.error(`Error fetching token at index ${i}:`, err);
//         }
//       }
      
//       setTickets(userTickets);
//     } catch (err) {
//       console.error("Error fetching tickets:", err);
//       setError("Failed to load your tickets");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const claimPrize = async (tokenId) => {
//     try {
//       setClaimingId(tokenId);
//       setMessage("");
      
//       const contract = await getContract();
//       const tx = await contract.claimPrize(tokenId);
      
//       setMessage("Claiming prize...");
//       await tx.wait();
//       setMessage("Prize claimed successfully!");
      
//       // Refresh tickets
//       await fetchMyTickets();
//     } catch (err) {
//       console.error("Error claiming prize:", err);
//       setMessage(err.message || "Failed to claim prize");
//     } finally {
//       setClaimingId(null);
//     }
//   };

//   if (!address) {
//     return (
//       <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//         <h2 className="text-2xl font-bold mb-4 text-white">My Tickets</h2>
//         <p className="text-gray-400 text-center">Please connect your wallet to view your tickets</p>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//         <h2 className="text-2xl font-bold mb-4 text-white">My Tickets</h2>
//         <div className="animate-pulse space-y-4">
//           <div className="h-20 bg-gray-700 rounded"></div>
//           <div className="h-20 bg-gray-700 rounded"></div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//       <h2 className="text-2xl font-bold mb-4 text-white">My Tickets</h2>
      
//       {error && (
//         <div className="p-4 mb-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
//           {error}
//         </div>
//       )}
      
//       {message && (
//         <div className={`p-4 mb-4 rounded-lg ${
//           message.includes("successfully") 
//             ? "bg-green-900/30 border border-green-500 text-green-400" 
//             : "bg-blue-900/30 border border-blue-500 text-blue-400"
//         }`}>
//           {message}
//         </div>
//       )}
      
//       {tickets.length === 0 ? (
//         <div className="text-center py-6">
//           <p className="text-gray-400 mb-4">You don't have any lottery tickets yet</p>
//           <button 
//             onClick={() => window.location.href = "/mint"} 
//             className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
//           >
//             Buy a Ticket
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {tickets.map(ticket => (
//             <div 
//               key={ticket.id} 
//               className="p-4 bg-gray-700 rounded-lg border border-gray-600"
//             >
//               <div className="flex justify-between items-start mb-3">
//                 <span className="text-gray-300">Ticket #{ticket.id}</span>
//                 <span className={`px-2 py-1 rounded text-xs font-medium ${
//                   ticket.status === "Winner!" ? "bg-yellow-600 text-yellow-100" :
//                   ticket.status === "Claimed" ? "bg-gray-500 text-gray-200" :
//                   ticket.status === "Invalid" ? "bg-red-900 text-red-200" :
//                   ticket.status.includes("Matched") ? "bg-blue-900 text-blue-200" :
//                   "bg-green-900 text-green-200" // Active
//                 }`}>
//                   {ticket.status}
//                 </span>
//               </div>
              
//               <div className="flex space-x-2 mb-3">
//                 {ticket.numbers.map((num, idx) => (
//                   <div 
//                     key={idx} 
//                     className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white font-medium rounded-lg"
//                   >
//                     {num}
//                   </div>
//                 ))}
//               </div>
              
//               {ticket.status === "Winner!" && !ticket.claimed && (
//                 <button
//                   onClick={() => claimPrize(ticket.id)}
//                   disabled={claimingId === ticket.id}
//                   className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 
//                            text-white font-medium rounded-lg transition-colors"
//                 >
//                   {claimingId === ticket.id ? "Claiming..." : "Claim Prize"}
//                 </button>
//               )}
//             </div>
//           ))}
          
//           <button 
//             onClick={fetchMyTickets} 
//             className="w-full py-2 px-4 border border-gray-600 hover:bg-gray-700 
//                      text-gray-300 font-medium rounded-lg transition-colors mt-4"
//           >
//             Refresh Tickets
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyTickets;

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const address = useAddress();

  useEffect(() => {
    const fetchTickets = async () => {
        const contract = await getContract();
      if (!contract || !address) return;
      try {
        setLoading(true);
        const balance = await contract.balanceOf(address);
        const ticketPromises = [];
        
        for (let i = 0; i < balance.toNumber(); i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          const ticket = await contract.tickets(tokenId);
          ticketPromises.push(ticket);
        }
        
        const ticketData = await Promise.all(ticketPromises);
        setTickets(ticketData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [address]);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">My Tickets</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length > 0 ? (
        <ul>
          {tickets.map((ticket, index) => (
            <li key={index} className="mb-2 p-2 bg-gray-700 rounded">
              Ticket {index + 1}: {ticket.toString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No tickets found.</p>
      )}
    </div>
  );
};

export default MyTickets;
