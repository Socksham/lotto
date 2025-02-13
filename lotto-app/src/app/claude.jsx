// pages/index.tsx
import { useState, useEffect } from "react";
import {
  useContract,
  useContractRead,
  useContractWrite,
  Web3Button,
  useAddress,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

export default function Home() {
    
  const address = useAddress();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { contract } = useContract("YOUR_CONTRACT_ADDRESS");
  
  const { data: roundInfo, isLoading: roundLoading } = useContractRead(
    contract,
    "getCurrentRoundInfo"
  );
  
  const { data: revealedNumbers, isLoading: numbersLoading } = useContractRead(
    contract,
    "getRevealedNumbers"
  );

  const formatTimeLeft = (nextRevealTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = nextRevealTime - now;
    if (timeLeft <= 0) return "Ready to reveal";
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleNumberSelect = (number: number) => {
    if (selectedNumbers.length < 6 && !selectedNumbers.includes(number)) {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Crypto Lottery</h1>
        
        {/* Round Info */}
        {roundInfo && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-2xl mb-4">Current Round: {roundInfo[0].toString()}</h2>
            <p>Numbers Revealed: {roundInfo[1].toString()}/6</p>
            <p>Prize Pool: {ethers.utils.formatEther(roundInfo[3])} ETH</p>
            <p>Next Reveal: {formatTimeLeft(roundInfo[4].toNumber())}</p>
          </div>
        )}
        
        {/* Revealed Numbers */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Revealed Numbers</h2>
          <div className="flex gap-4">
            {revealedNumbers?.map((number: number, index: number) => (
              <div
                key={index}
                className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl"
              >
                {number.toString()}
              </div>
            ))}
          </div>
        </div>
        
        {/* Number Selection */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Select Your Numbers</h2>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 49 }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => handleNumberSelect(number)}
                className={`w-12 h-12 rounded-full ${
                  selectedNumbers.includes(number)
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                } flex items-center justify-center`}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
        
        {/* Mint Button */}
        {selectedNumbers.length === 6 && address && (
          <Web3Button
            contractAddress="YOUR_CONTRACT_ADDRESS"
            action={(contract) => {
              contract.call("mintTicket", [selectedNumbers], {
                value: ethers.utils.parseEther("0.01")
              });
            }}
          >
            Mint Ticket (0.01 ETH)
          </Web3Button>
        )}
      </div>
    </div>
  );
}