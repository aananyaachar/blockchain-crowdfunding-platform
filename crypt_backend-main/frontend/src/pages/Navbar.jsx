  import React from "react";
  import { Link } from "react-router-dom";
  import { useStateContext } from "../context";

  function Navbar() {
    const { connectWallet, walletAddress } = useStateContext();
    const truncatedAddress = walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '';

    return (
      <nav className="bg-gray-900/50 backdrop-blur-sm text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Brand / Logo */}
          <Link
            to="/"
            className="text-2xl font-bold tracking-wide hover:text-blue-400 transition"
          >
            CryptoFund
          </Link>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="hidden sm:block hover:text-blue-400 transition font-medium"
            >
              Campaigns
            </Link>
            <Link
              to="/create"
              className="hidden sm:block hover:text-blue-400 transition font-medium"
            >
              Create Campaign
            </Link>
            <Link
              to="/contact" 
              className="hidden sm:block hover:text-blue-400 transition font-medium"
            >
              Help/Contact
            </Link>
            {walletAddress && (
              <Link
                to="/profile"
                className="hidden sm:block hover:text-blue-400 transition font-medium"
              >
                Profile
              </Link>
            )}
            <button
              onClick={connectWallet}
              className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition font-semibold"
            >
              {walletAddress ? truncatedAddress : "Connect Wallet"}
            </button>
          </div>
        </div>
      </nav>
    );
  }

  export default Navbar;