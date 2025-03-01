import { useState } from "react";
import { Link } from "react-router-dom"; // Assuming you're using React Router

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo / Brand */}
        <Link to="/" className="text-white text-2xl font-bold">
          🎟️ CryptoLottery
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-300 hover:text-white transition">Home</Link>
          <Link to="/dashboard" className="text-gray-300 hover:text-white transition">Dashboard</Link>
          <Link to="/my-tickets" className="text-gray-300 hover:text-white transition">My Tickets</Link>
          <Link to="/admin" className="text-gray-300 hover:text-white transition">Admin</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-300 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-2 space-y-2 bg-gray-800 p-4 rounded-lg shadow-lg">
          <Link to="/" className="block text-gray-300 hover:text-white transition">Home</Link>
          <Link to="/dashboard" className="block text-gray-300 hover:text-white transition">Dashboard</Link>
          <Link to="/my-tickets" className="block text-gray-300 hover:text-white transition">My Tickets</Link>
          <Link to="/admin" className="block text-gray-300 hover:text-white transition">Admin</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
