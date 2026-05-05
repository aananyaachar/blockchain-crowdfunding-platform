import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStateContext } from '../context';

const demoCampaigns = [
  { id: 'demo-1', creator: '0xDEMO...dEaD', image: 'https://placehold.co/600x400/2563eb/ffffff?text=Project+Alpha', goal: '10', amountCollected: '7.5', deadline: new Date().getTime() + 1296000000, title: 'Demo Project: The Alpha Initiative', story: "This is a sample project to demonstrate how campaigns look. We're building the future of decentralized applications.", isActive: true },
  { id: 'demo-2', creator: '0xDEMO...c0fe', image: 'https://placehold.co/600x400/1f2937/ffffff?text=Project+Beta', goal: '25', amountCollected: '5', deadline: new Date().getTime() + 2592000000, title: 'Demo Project: The Beta Launchpad', story: 'Support our beta launch! This demo shows a project that is just getting started on its funding journey.', isActive: true },
  { id: 'demo-3', creator: '0xDEMO...bEEf', image: 'https://placehold.co/600x400/2563eb/ffffff?text=Project+Gamma', goal: '5', amountCollected: '5', deadline: new Date().getTime() - 86400000, title: 'Demo Project: Gamma - Ended', story: 'This campaign is ended. This is an example of what an inactive project looks like.', isActive: false },
];

function AllCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // NEW STATE: Filter is either 'active' or 'inactive'
    const [filter, setFilter] = useState('active'); 
    const { getCampaigns, refresh } = useStateContext();

    useEffect(() => {
        const fetchCampaigns = async () => {
            setIsLoading(true);
            // Fetch ALL campaigns, including inactive ones
            const allCampaigns = await getCampaigns();
            const validCampaigns = allCampaigns.filter(c => c !== null);

            if (validCampaigns.length > 0) {
                setCampaigns(validCampaigns);
            } else {
                setCampaigns(demoCampaigns);
            }
            setIsLoading(false);
        }
        fetchCampaigns();
    }, [refresh, getCampaigns]);

    // NEW FILTER LOGIC: Apply the filter state to the campaign list
    const filteredCampaigns = campaigns.filter(campaign => {
        if (filter === 'active') {
            // Filter to show only active campaigns
            return campaign.isActive;
        } else {
            // Filter to show only inactive/ended campaigns
            return !campaign.isActive;
        }
    });

    return (
        <div className="relative container mx-auto p-8 text-gray-800 dark:text-gray-200">
            <div className="text-center pt-16 h-[50vh] flex flex-col justify-center items-center">
                <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down text-white">Fund the Future, Decentralized.</h1>
                <p className="text-lg max-w-2xl mx-auto animate-fade-in-down text-gray-300" style={{animationDelay: '200ms'}}>Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform.</p>
            </div>
            
            <div className="flex justify-between items-center mb-8 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
                <h2 className="text-3xl font-bold text-white">
                    {filter === 'active' ? 'Active Campaigns' : 'Inactive Campaigns'}
                </h2>
                {/* NEW FILTER UI */}
                <div className="flex space-x-4 p-1 bg-gray-700 rounded-lg">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                            filter === 'active' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                            filter === 'inactive' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Ended
                    </button>
                </div>
            </div>
            
            {isLoading && <p className="text-center text-white">Loading campaigns from the blockchain...</p>}
            
            {!isLoading && filteredCampaigns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCampaigns.map((campaign, i) => {
                        const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
                        return (
                            <div key={campaign.id} className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: `${i * 100}ms`}}>
                                <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-48 object-cover"/>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2 truncate text-white">{campaign.title}</h3>
                                    <p className="text-sm text-gray-400 mb-4">by {campaign.creator}</p>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm font-medium mb-4 text-gray-300">{Math.round(progress)}% Funded</p>
                                    <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">View Details</Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {!isLoading && filteredCampaigns.length === 0 && (
                <div className="text-center py-12 text-white">
                    <p>No {filter} campaigns found.</p>
                    {filter === 'active' && (
                        <Link to="/create" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
                            Be the first to create one!
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default AllCampaigns;