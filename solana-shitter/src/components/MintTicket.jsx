import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Ticket, Shuffle, Loader } from "lucide-react";
import { mintTicket } from "../utils/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const MintTicket = () => {
  const [numbers, setNumbers] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const wallet = useWallet();

  const handleNumberChange = (index, value) => {
    // Only allow numbers 0-99
    if (value === "" || (/^\d{1,2}$/.test(value) && parseInt(value) <= 99)) {
      const newNumbers = [...numbers];
      newNumbers[index] = value;
      setNumbers(newNumbers);
    }
  };

  const handleRandomize = () => {
    const randomNumbers = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 100).toString()
    );
    setNumbers(randomNumbers);
  };

  const handleMintTicket = async (e) => {
    e.preventDefault();

    // Validate all numbers are filled and within the valid range
    if (
      numbers.some(
        (num) =>
          num === "" ||
          isNaN(parseInt(num)) ||
          parseInt(num) < 0 ||
          parseInt(num) > 99
      )
    ) {
      setMessage("Please enter valid numbers (0-99) in all fields.");
      return;
    }

    try {
      setLoading(true);

      // Convert numbers to integers for the contract
      const numbersForContract = numbers.map((num) => parseInt(num));

      // Call the mintTicket function from our utility
      const tx = await mintTicket(wallet, numbersForContract);

      setMessage("Minting your ticket...");
      
      setMessage(`Successfully minted your lottery ticket! Transaction: ${tx.substring(0, 8)}...`);

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
          <form onSubmit={handleMintTicket} className="space-y-8">
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
                      maxLength={2}
                      placeholder="#"
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-400 text-center mt-2">
                Pick your lucky numbers (0-99) for each position
              </p>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Ticket Price:</span>
                <span className="text-xl font-bold text-white">0.01 SOL</span>
              </div>

              <button
                type="submit"
                disabled={loading || !wallet.connected}
                className="relative w-full group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div
                  className={`relative w-full py-3 px-6 bg-black rounded-lg flex items-center justify-center space-x-2 
                              ${!wallet.connected || loading ? "opacity-70" : ""}`}
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

              {!wallet.connected && (
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
            © 2025 NumberDrop Lottery. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MintTicket;