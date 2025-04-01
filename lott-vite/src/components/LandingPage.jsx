import { useState, useEffect } from "react";
import { Candy, Ticket, Clock, Award, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";
import LiveActivityFeed from "./LiveActivityFeed"; // Import the new component

function LandingPage({ Nav }) {
  const [roundInfo, setRoundInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(false);

  useEffect(() => {
    fetchRoundInfo();
    // Set up an interval to refresh data every minute
    const interval = setInterval(fetchRoundInfo, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoundInfo = async () => {
    try {
      if (firstLoad) {
        setLoading(true);
        setFirstLoad(false);
      }

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
        numbers: revealedNumbers
          .map((n) => ({
            value: n.toNumber(),
            revealed: true,
          }))
          .concat(
            Array(6 - revealedNumbers.length).fill({
              value: null,
              revealed: false,
            })
          ),
      });
    } catch (error) {
      console.error("Error fetching round info:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create an array of gumdrop colors
  const gumdropColors = [
    { bg: "bg-red-600", shadow: "bg-red-700" },
    { bg: "bg-emerald-600", shadow: "bg-emerald-700" },
    { bg: "bg-amber-500", shadow: "bg-amber-600" },
    { bg: "bg-orange-600", shadow: "bg-orange-700" },
    { bg: "bg-slate-300", shadow: "bg-slate-400" },
    { bg: "bg-pink-500", shadow: "bg-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-gray-100">
      {Nav}

      {/* Hero Section */}
      <div className="container mx-auto px-8 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            The Lottery That's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
              Sweet As Candy
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Buy NFT lottery tickets where gumdrops reveal their numbers progressively.
            Trade, hold, or sell based on partial sweetness matches!
          </p>
          <div className="flex space-x-4">
            <Link
              to="/mint"
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full transition flex items-center space-x-2 text-white"
            >
              <Ticket className="h-5 w-5" />
              <span>Buy Tickets</span>
            </Link>
            <Link
              to="/marketplace"
              className="border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-gray-900 px-8 py-3 rounded-full transition flex items-center space-x-2"
            >
              <Award className="h-5 w-5" />
              <span>Trade Tickets</span>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gray-800/70 rounded-2xl p-8 backdrop-blur-lg shadow-lg border-4 border-dashed border-purple-500">
            <div className="text-center mb-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="flex justify-center space-x-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-gray-700 rounded-full"></div>
                    ))}
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
                </div>
              ) : roundInfo ? (
                <>
                  <h3 className="text-2xl font-semibold text-purple-400 mb-4">
                    Round #{roundInfo.currentRound}
                    <span className="block text-lg mt-1 text-pink-400">
                      Prize Pool: {parseFloat(roundInfo.prize).toFixed(4)} ETH
                    </span>
                  </h3>
                  <div className="flex justify-center space-x-4 items-center">
                    {roundInfo.numbers.map((num, index) => (
                      <div
                        key={index}
                        className="relative"
                      >
                        {/* Gumdrop container */}
                        <div
                          className={`
                            w-16 h-16 flex items-center justify-center
                            text-2xl font-bold rounded-full
                            ${num.revealed ? 
                              `${gumdropColors[index % gumdropColors.length].bg} text-gray-100 shadow-lg transform hover:scale-110 transition-all duration-300` :
                              "bg-gray-700 text-gray-500 border-2 border-gray-600"
                            }
                            relative overflow-hidden
                          `}
                          style={{
                            boxShadow: num.revealed ? "inset 0px -4px 0px rgba(0,0,0,0.3), 0px 4px 8px rgba(0,0,0,0.3)" : "",
                          }}
                        >
                          {/* Sugar sparkle effect for revealed gumdrops */}
                          {num.revealed && (
                            <>
                              <div className="absolute top-0 left-0 w-full h-full opacity-30">
                                {[...Array(8)].map((_, i) => (
                                  <div 
                                    key={i}
                                    className="absolute w-1 h-1 bg-white rounded-full"
                                    style={{
                                      top: `${Math.random() * 100}%`,
                                      left: `${Math.random() * 100}%`,
                                      opacity: 0.7 + (Math.random() * 0.3)
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </>
                          )}
                          <span className="relative z-10">{num.revealed ? num.value : "?"}</span>
                        </div>
                        
                        {/* Shadow beneath the gumdrop */}
                        {num.revealed && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-black/30 rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-purple-300">
                    {roundInfo.isComplete
                      ? "Round Complete - New round starting soon!"
                      : `${
                          roundInfo.revealIndex
                        }/6 numbers revealed - Next reveal: ${roundInfo.nextRevealTime.toLocaleString()}`}
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

      {/* Live Activity Section - NEW */}
      <div className="container mx-auto px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="text-left mb-8">
              <h3 className="text-3xl font-bold mb-2">Live Network Activity</h3>
              <p className="text-gray-400">
                Watch in real-time as players mint, list, and trade lottery
                tickets
              </p>
            </div>
            <LiveActivityFeed />
          </div>

          <div>
            <div className="text-left mb-8">
              <h3 className="text-3xl font-bold mb-2">Why Join Now?</h3>
              <p className="text-gray-400">
                The earlier you participate, the more opportunities you'll have
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-6 text-white">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-900/50 p-3 rounded-lg">
                    <Ticket className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Early Access</h4>
                    <p className="text-gray-400 text-sm">
                      Get your preferred number combinations before they're
                      taken
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-900/50 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Trading Opportunity
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Buy low, sell high as the winning numbers are revealed
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-900/50 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Growing Prize Pool
                    </h4>
                    <p className="text-gray-400 text-sm">
                      The prize pool increases with every ticket minted
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold mb-4 text-purple-400">How Gum Drop Works</h3>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A deliciously sweet lottery concept where anticipation builds with each
            gumdrop reveal
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Clock className="h-12 w-12 text-red-400" />,
              title: "Sweet Reveals",
              description:
                "Gumdrops are unveiled gradually, creating suspense and strategy",
              color: "bg-gray-800/50 border-red-500"
            },
            {
              icon: <Ticket className="h-12 w-12 text-emerald-400" />,
              title: "Candy Tickets",
              description:
                "Each ticket is a unique NFT that can be traded based on partial matches",
              color: "bg-gray-800/50 border-emerald-500"
            },
            {
              icon: <Candy className="h-12 w-12 text-amber-400" />,
              title: "Sugary Trading",
              description:
                "Buy, sell, or hold tickets as gumdrops are progressively revealed",
              color: "bg-gray-800/50 border-amber-500"
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={`${feature.color} p-6 rounded-2xl hover:shadow-xl transition shadow-md border-2 border-dashed relative overflow-hidden`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold mb-3 text-gray-100">{feature.title}</h4>
              <p className="text-gray-300">{feature.description}</p>
              
              {/* Decorative gumdrop */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-opacity-30" 
                style={{
                  background: `linear-gradient(to bottom, ${
                    index === 0 ? "#dc2626" : index === 1 ? "#059669" : "#d97706"
                  } 70%, ${
                    index === 0 ? "#b91c1c" : index === 1 ? "#047857" : "#b45309"
                  } 100%)`
                }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative gumdrop row */}
      <div className="relative overflow-hidden py-8">
        <div className="absolute left-0 right-0 h-16 flex justify-around items-center">
          {gumdropColors.concat(gumdropColors).map((color, i) => (
            <div key={i} className={`w-12 h-12 rounded-full ${color.bg} relative`} style={{
              boxShadow: "inset 0px -4px 0px rgba(0,0,0,0.3), 0px 4px 8px rgba(0,0,0,0.3)"
            }}>
              <div className={`absolute bottom-0 left-0 w-full h-1/4 ${color.shadow}`}></div>
              <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full opacity-60"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800/80 py-8 border-t-4 border-dashed border-purple-500">
        <div className="container mx-auto px-8 text-center">
          <p className="text-gray-400">
            © 2024 Gum Drop Lottery. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;