import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStateContext } from '../context';

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [createdCampaigns, setCreatedCampaigns] = useState([]);
  const [donatedCampaigns, setDonatedCampaigns] = useState([]);
  const { walletAddress, getCampaigns, getDonations } = useStateContext();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (walletAddress) {
        setIsLoading(true);
        const allCampaigns = await getCampaigns();
        const validCampaigns = allCampaigns.filter(campaign => campaign && campaign.creator);
        const userCreated = validCampaigns.filter(campaign => campaign.creator.toLowerCase() === walletAddress.toLowerCase());
        setCreatedCampaigns(userCreated);

        const userDonated = await getDonations(walletAddress);
        setDonatedCampaigns(userDonated);

        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [walletAddress, getCampaigns, getDonations]);

  const totalRaised = createdCampaigns.reduce((acc, campaign) => acc + parseFloat(campaign.amountCollected || 0), 0);
  const totalDonated = donatedCampaigns.reduce((acc, donation) => acc + parseFloat(donation.amount || 0), 0);


  if (isLoading) {
    return <div className="text-center p-12 text-white">Loading profile...</div>;
  }

  if (!walletAddress) {
    return <div className="text-center p-12 text-white">Please connect your wallet to view your profile.</div>;
  }

  return (
    <div className="container mx-auto p-8 text-gray-800 dark:text-gray-200">
      <div className="text-center mb-16 pt-16">
        <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down text-white">Your Profile</h1>
        <p className="text-lg max-w-2xl mx-auto animate-fade-in-down text-gray-300" style={{ animationDelay: '200ms' }}>
          Welcome back, {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-4 text-white">Total Raised</h3>
          <p className="text-4xl font-bold text-blue-400">{totalRaised.toFixed(2)} ETH</p>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-4 text-white">Total Donated</h3>
          <p className="text-4xl font-bold text-green-400">{totalDonated.toFixed(2)} ETH</p>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-8 border-b-2 border-blue-700 pb-2 text-white">Your Created Campaigns</h2>
        {createdCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {createdCampaigns.map((campaign, i) => (
               <div key={campaign.id} className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 truncate text-white">{campaign.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">Raised: {campaign.amountCollected} ETH</p>
                  <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">You haven't created any campaigns yet.</p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-8 border-b-2 border-blue-700 pb-2 text-white">Your Donations</h2>
        {donatedCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {donatedCampaigns.map((donation, i) => (
              <div key={i} className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <img src={donation.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={donation.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 truncate text-white">{donation.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">You Donated: {donation.amount} ETH</p>
                  <Link to={`/campaign/${donation.id}`} className="block text-center w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">You haven't donated to any campaigns yet.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;

