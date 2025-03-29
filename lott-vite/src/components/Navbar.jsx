import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ticket, Menu, X } from "lucide-react";
import { ConnectWallet } from "@thirdweb-dev/react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="backdrop-blur-sm px-8 py-4 top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-black p-2 rounded-full">
              <Ticket className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <Link to="/" className="text-xl md:text-2xl font-bold text-white hover:text-purple-300 transition-colors">
            NumberDrop <span className="text-purple-400">Lottery</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-6">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${isActive('/') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`font-medium transition-colors ${isActive('/dashboard') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`}
            >
              Dashboard
            </Link>
            {/* <Link
              to="/my-tickets"
              className={`font-medium transition-colors ${isActive('/my-tickets') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`}
            >
              My Tickets
            </Link> */}
            <Link
              to="/admin"
              className={`font-medium transition-colors ${isActive('/admin') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`}
            >
              Admin
            </Link>
            <Link
              to="/marketplace"
              className={`font-medium transition-colors ${isActive('/dashboard') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`}
            >
              Marketplace
            </Link>
          </div>

          {/* Connect Button with Gradient Effect */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative rounded-lg overflow-hidden">
              <ConnectWallet 
                theme="dark"
                btnTitle="Connect Wallet"
                className="!bg-black hover:!bg-black/80 !h-10 !rounded-lg !transition-all !border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-300 hover:text-purple-400 focus:outline-none transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 space-y-3 bg-black/95 border border-purple-900/30 p-4 rounded-lg shadow-lg animate-fadeIn">
          <Link
            to="/"
            className={`block py-2 px-3 rounded-md transition-colors ${isActive('/') ? 'bg-purple-900/20 text-purple-400' : 'text-gray-300 hover:bg-purple-900/10 hover:text-white'}`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`block py-2 px-3 rounded-md transition-colors ${isActive('/dashboard') ? 'bg-purple-900/20 text-purple-400' : 'text-gray-300 hover:bg-purple-900/10 hover:text-white'}`}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          {/* <Link
            to="/my-tickets"
            className={`block py-2 px-3 rounded-md transition-colors ${isActive('/my-tickets') ? 'bg-purple-900/20 text-purple-400' : 'text-gray-300 hover:bg-purple-900/10 hover:text-white'}`}
            onClick={() => setIsOpen(false)}
          >
            My Tickets
          </Link> */}
          <Link
            to="/admin"
            className={`block py-2 px-3 rounded-md transition-colors ${isActive('/admin') ? 'bg-purple-900/20 text-purple-400' : 'text-gray-300 hover:bg-purple-900/10 hover:text-white'}`}
            onClick={() => setIsOpen(false)}
          >
            Admin
          </Link>

          {/* Mobile Connect Button */}
          <div className="relative group mt-4">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative rounded-lg overflow-hidden">
              <ConnectWallet 
                theme="dark"
                btnTitle="Connect Wallet"
                className="!bg-black hover:!bg-black/80 !h-10 !w-full !rounded-lg !transition-all !border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;