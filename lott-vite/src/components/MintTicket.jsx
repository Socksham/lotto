import { useState } from "react";
import { getContract } from "../utils/contract"
import { useAddress } from "@thirdweb-dev/react";
import { ethers } from "ethers";

const MintTicket = () => {
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

  const mintTicket = async (e) => {
    e.preventDefault();
    
    // Validate all numbers are filled
    if (numbers.some(num => num === "")) {
      setMessage("Please fill in all numbers");
      return;
    }

    try {
      setLoading(true);
      const contract = await getContract();
      
      // Convert numbers to integers for contract
      const numbersForContract = numbers.map(num => parseInt(num));
      
      // Call contract mint function with value
      const tx = await contract.mintTicket(
        numbersForContract,
        {
          value: ethers.utils.parseEther("0.01") // MINT_PRICE from contract
        }
      );

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
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Mint Lottery Ticket</h2>
      
      <form onSubmit={mintTicket} className="space-y-6">
        <div className="grid grid-cols-6 gap-2">
          {numbers.map((number, index) => (
            <input
              key={index}
              type="text"
              value={number}
              onChange={(e) => handleNumberChange(index, e.target.value)}
              className="w-12 h-12 text-center text-xl bg-gray-700 text-white rounded-lg"
              maxLength={1}
              placeholder="#"
              disabled={loading}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !address}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                   text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Minting..." : "Mint Ticket (0.01 ETH)"}
        </button>

        {!address && (
          <p className="text-red-400 text-sm text-center">
            Please connect your wallet to mint tickets
          </p>
        )}

        {message && (
          <p className={`text-sm text-center ${
            message.includes("Success") ? "text-green-400" : "text-red-400"
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default MintTicket;