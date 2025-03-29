import React from "react";
import { Rocket, Ticket, Clock, Award } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

function LandingPage({ Nav }) {
  const lotteryNumbers = [
    { value: 42, revealed: true },
    { value: 17, revealed: true },
    { value: 63, revealed: true },
    { value: null, revealed: false },
    { value: null, revealed: false },
  ];

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
            <button className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg transition flex items-center space-x-2">
              <Ticket className="h-5 w-5" />
              <span>Buy Tickets</span>
            </button>
            <button className="border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white px-8 py-3 rounded-lg transition flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Learn More</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="bg-purple-800/30 rounded-2xl p-8 backdrop-blur-lg">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-semibold text-purple-200 mb-4">
                Current Lottery Sequence
              </h3>
              <div className="flex justify-center space-x-4">
                {lotteryNumbers.map((num, index) => (
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
                3 numbers revealed - Next reveal in 2 days
              </p>
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
