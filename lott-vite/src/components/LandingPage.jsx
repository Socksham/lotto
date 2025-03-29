import React, { useState, useEffect } from "react";
import { Rocket, Ticket, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

function LandingPage({ Nav }) {
  const [roundInfo, setRoundInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoundInfo();
    // Set up an interval to refresh data every minute
    const interval = setInterval(fetchRoundInfo, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoundInfo = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      // Get current round info and revealed numbers
      const info = await contract.getCurrentRoundInfo();
      const revealedNumbers = await contract.getRevealedNumbers();
      
      setRoundInfo({
        currentRound: info.round.toNumber(),
        revealIndex: info.revealIndex.toNumber(),
        isComplete: info.isComplete,
        prize: ethers.utils.formatEther(info.prize),
        nextRevealTime: new Date(info.nextRevealTime.toNumber() * 1000),
        numbers: revealedNumbers.map(n => ({
          value: n.toNumber(),
          revealed: true
        })).concat(
          Array(6 - revealedNumbers.length).fill({ value: null, revealed: false })
        )
      });
    } catch (error) {
      console.error("Error fetching round info:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {Nav}

      {/* Hero Section */}
      <div className="container mx-auto px-8 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            The Lottery Where <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Numbers Reveal Gradually
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Buy NFT lottery tickets where numbers are unveiled progressively.
            Trade, hold, or sell based on partial number matches!
          </p>
          <div className="flex space-x-4">
            <Link 
              to="/mint"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg transition flex items-center space-x-2"
            >
              <Ticket className="h-5 w-5" />
              <span>Buy Tickets</span>
            </Link>
            <Link 
              to="/marketplace"
              className="border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white px-8 py-3 rounded-lg transition flex items-center space-x-2"
            >
              <Award className="h-5 w-5" />
              <span>Trade Tickets</span>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="bg-purple-800/30 rounded-2xl p-8 backdrop-blur-lg">
            <div className="text-center mb-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-purple-800/50 rounded"></div>
                  <div className="flex justify-center space-x-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-16 h-24 bg-purple-800/50 rounded-lg"></div>
                    ))}
                  </div>
                  <div className="h-6 bg-purple-800/50 rounded w-3/4 mx-auto"></div>
                </div>
              ) : roundInfo ? (
                <>
                  <h3 className="text-2xl font-semibold text-purple-200 mb-4">
                    Round #{roundInfo.currentRound}
                    <span className="block text-lg mt-1">
                      Prize Pool: {parseFloat(roundInfo.prize).toFixed(4)} ETH
                    </span>
                  </h3>
                  <div className="flex justify-center space-x-4">
                    {roundInfo.numbers.map((num, index) => (
                      <div
                        key={index}
                        className={`
                          w-16 h-24 flex items-center justify-center 
                          text-4xl font-bold rounded-lg 
                          ${
                            num.revealed
                              ? "bg-purple-600 text-white"
                              : "bg-gray-800 text-gray-500 border-2 border-gray-700"
                          }
                          transition-all duration-300
                        `}
                      >
                        {num.revealed ? num.value : "?"}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-purple-300">
                    {roundInfo.isComplete 
                      ? "Round Complete - New round starting soon!" 
                      : `${roundInfo.revealIndex}/6 numbers revealed - Next reveal: ${roundInfo.nextRevealTime.toLocaleString()}`
                    }
                  </p>
                </>
              ) : (
                <div className="text-red-400 py-8">
                  Failed to load lottery information. Please try again later.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold mb-4">How NumberDrop Works</h3>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A revolutionary lottery concept where anticipation builds with each
            number reveal
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Clock className="h-12 w-12 text-purple-500" />,
              title: "Progressive Reveal",
              description:
                "Numbers are unveiled gradually, creating suspense and strategy",
            },
            {
              icon: <Ticket className="h-12 w-12 text-pink-500" />,
              title: "NFT Tickets",
              description:
                "Each ticket is a unique NFT that can be traded based on partial matches",
            },
            {
              icon: <Rocket className="h-12 w-12 text-indigo-500" />,
              title: "Dynamic Trading",
              description:
                "Buy, sell, or hold tickets as numbers are progressively revealed",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-black/50 p-6 rounded-xl hover:bg-black/70 transition"
            >
              <div className="mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 py-8">
        <div className="container mx-auto px-8 text-center">
          <p className="text-gray-500">
            © 2024 NumberDrop Lottery. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
