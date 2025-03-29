import { useState } from "react";
import { getContract } from "../utils/contract";
import { useAddress } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { Ticket, Shuffle, Loader } from "lucide-react";

const MintTicket = ({ Nav }) => {
  const [numbers, setNumbers] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const address = useAddress();

  const handleNumberChange = (index, value) => {
    // Only allow numbers 0-9
    if (value === "" || (/^\d$/.test(value) && parseInt(value) <= 9)) {
      const newNumbers = [...numbers];
      newNumbers[index] = value;
      setNumbers(newNumbers);
    }
  };

  const handleRandomize = () => {
    const randomNumbers = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10).toString()
    );
    setNumbers(randomNumbers);
  };

  const mintTicket = async (e) => {
    e.preventDefault();

    // Validate all numbers are filled and within the valid range
    if (
      numbers.some(
        (num) =>
          num === "" ||
          isNaN(parseInt(num)) ||
          parseInt(num) < 0 ||
          parseInt(num) > 9
      )
    ) {
      setMessage("Please enter valid numbers (0-9) in all fields.");
      return;
    }

    try {
      setLoading(true);
      const contract = await getContract();

      // Convert numbers to integers
      const numbersForContract = numbers.map((num) => parseInt(num));

      console.log("Numbers being sent to contract:", numbersForContract);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("Connected to network:", network);

      const estimatedGas = await contract.estimateGas.mintTicket(
        numbersForContract,
        {
          value: ethers.utils.parseEther("0.01"),
        }
      );

      console.log(estimatedGas)

      const tx = await contract.mintTicket(numbersForContract, {
        value: ethers.utils.parseEther("0.01"),
        gasLimit: estimatedGas.mul(2),
      });

      setMessage("Minting your ticket...");
      await tx.wait();
      setMessage("Successfully minted your lottery ticket!");

      // Reset form
      setNumbers(Array(6).fill(""));
    } catch (error) {
      console.error("Error minting ticket:", error);
      setMessage(error.message || "Failed to mint ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Navigation */}
      {Nav}

      <div className="container mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Mint Your Ticket
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Choose your lucky numbers and join the current lottery round
          </p>
        </div>

        <div className="max-w-lg mx-auto bg-black/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <form onSubmit={mintTicket} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-purple-200">
                  Select Your Numbers
                </h3>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition"
                  disabled={loading}
                >
                  <Shuffle className="h-4 w-4" />
                  <span className="text-sm">Randomize</span>
                </button>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {numbers.map((number, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-75 group-hover:opacity-100 transition"></div>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) =>
                        handleNumberChange(index, e.target.value)
                      }
                      className="relative w-full h-16 text-center text-2xl bg-gray-900 text-white rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={1}
                      placeholder="#"
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-400 text-center mt-2">
                Pick your lucky numbers (0-9) for each position
              </p>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Ticket Price:</span>
                <span className="text-xl font-bold text-white">0.01 ETH</span>
              </div>

              <button
                type="submit"
                disabled={loading || !address}
                className="relative w-full group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div
                  className={`relative w-full py-3 px-6 bg-black rounded-lg flex items-center justify-center space-x-2 
                              ${!address || loading ? "opacity-70" : ""}`}
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span className="font-semibold">Minting...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="h-5 w-5" />
                      <span className="font-semibold">Mint Ticket</span>
                    </>
                  )}
                </div>
              </button>

              {!address && (
                <p className="text-red-400 text-sm text-center mt-4">
                  Please connect your wallet to mint tickets
                </p>
              )}

              {message && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm text-center ${
                    message.includes("Success")
                      ? "bg-green-900/30 text-green-400 border border-green-700"
                      : "bg-red-900/30 text-red-400 border border-red-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </form>
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

export default MintTicket;

// import { useState } from "react";
// import { getContract } from "../utils/contract"
// import { useAddress } from "@thirdweb-dev/react";
// import { ethers } from "ethers";

// const MintTicket = () => {
//   const [numbers, setNumbers] = useState(Array(6).fill(""));
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const address = useAddress();

//   const handleNumberChange = (index, value) => {
//     // Only allow numbers 0-9
//     if (value === "" || (/^\d$/.test(value) && parseInt(value) <= 9)) {
//       const newNumbers = [...numbers];
//       newNumbers[index] = value;
//       setNumbers(newNumbers);
//     }
//   };

//   const generateRandomNumbers = () => {
//     return Array.from({ length: 6 }, () => Math.floor(Math.random() * 100) + 1);
//   };

//   const mintTicket = async (e) => {
//     e.preventDefault();

//     // Validate all numbers are filled
//     if (numbers.some(num => num === "")) {
//       setMessage("Please fill in all numbers");
//       return;
//     }

//     try {
//       setLoading(true);
//       const contract = await getContract();
//       console.log("Contract instance:", contract);
//       // Convert numbers to integers for contract
//       const numbersForContract = numbers.map(num => parseInt(num));

//       const provider = new ethers.providers.Web3Provider(window.ethereum);
//       const network = await provider.getNetwork();
//       console.log("Connected to network:", network);

//       const estimatedGas = await contract.estimateGas.mintTicket(numbersForContract, {
//         value: ethers.utils.parseEther("0.01"),
//       });

//       const tx = await contract.mintTicket(numbersForContract, {
//         value: ethers.utils.parseEther("0.01"),
//         gasLimit: estimatedGas.mul(2), // Double the estimated gas for safety
//       });

//       setMessage("Minting your ticket...");
//       await tx.wait();
//       setMessage("Successfully minted your lottery ticket!");

//       // Reset form
//       setNumbers(Array(6).fill(""));
//     } catch (error) {
//       console.error("Error minting ticket:", error);
//       setMessage(error.message || "Failed to mint ticket");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
//       <h2 className="text-2xl font-bold mb-6 text-white">Mint Lottery Ticket</h2>

//       <form onSubmit={mintTicket} className="space-y-6">
//         <div className="grid grid-cols-6 gap-2">
//           {numbers.map((number, index) => (
//             <input
//               key={index}
//               type="text"
//               value={number}
//               onChange={(e) => handleNumberChange(index, e.target.value)}
//               className="w-12 h-12 text-center text-xl bg-gray-700 text-white rounded-lg"
//               maxLength={1}
//               placeholder="#"
//               disabled={loading}
//             />
//           ))}
//         </div>

//         <button
//           type="submit"
//           disabled={loading || !address}
//           className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
//                    text-white font-semibold rounded-lg transition-colors"
//         >
//           {loading ? "Minting..." : "Mint Ticket (0.01 ETH)"}
//         </button>

//         {!address && (
//           <p className="text-red-400 text-sm text-center">
//             Please connect your wallet to mint tickets
//           </p>
//         )}

//         {message && (
//           <p className={`text-sm text-center ${
//             message.includes("Success") ? "text-green-400" : "text-red-400"
//           }`}>
//             {message}
//           </p>
//         )}
//       </form>
//     </div>
//   );
// };

// export default MintTicket;
