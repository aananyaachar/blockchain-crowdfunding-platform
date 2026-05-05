import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStateContext } from "../context";

function AllCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState = useState(true);
    const { getCampaigns, refresh } = useStateContext();

    useEffect(() => {
        const fetchCampaigns = async () => {
            const allCampaigns = await getCampaigns();
            
            // Filter out null entries and campaigns marked as inactive
            const activeCampaigns = allCampaigns.filter(c => c !== null && c.active);

            setCampaigns(activeCampaigns);
            setIsLoading(false);
        }
        fetchCampaigns();
    }, [refresh, getCampaigns]);

    const StatBox = ({ icon, title, value }) => (
        <div className="flex items-center space-x-3">
            <div className="text-blue-500">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="relative container mx-auto p-8 text-gray-800 dark:text-gray-200">
            <div className="text-center mb-16 pt-16">
                <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down">Fund the Future, Decentralized.</h1>
                <p className="text-lg max-w-2xl mx-auto animate-fade-in-down" style={{animationDelay: '200ms'}}>Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform.</p>
            </div>
            <h2 className="text-3xl font-bold mb-8 border-b-2 border-blue-200 dark:border-blue-700 pb-2">Active Campaigns</h2>
            {isLoading && <p className="text-center">Loading campaigns...</p>}
            {!isLoading && campaigns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {campaigns.map((campaign, i) => {
                        const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
                        return (
                            <div key={campaign.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: `${i * 100}ms`}}>
                                <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-48 object-cover"/>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2 truncate">{campaign.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">by {campaign.creator}</p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2"><div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{ width: `${progress}%` }}></div></div>
                                    <p className="text-sm font-medium mb-4">{Math.round(progress)}% Funded</p>
                                    <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-gray-800 dark:bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition font-semibold">View Details</Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            {!isLoading && campaigns.length === 0 && (<div className="text-center py-12"><p>No active campaigns yet.</p><Link to="/create" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">Be the first to create one!</Link></div>)}
        </div>
    );
}

export default AllCampaigns;