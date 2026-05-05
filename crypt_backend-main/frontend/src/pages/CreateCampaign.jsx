import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from "ethers";
import { useStateContext, useToast } from '../context';

function CreateCampaign() {
    const navigate = useNavigate();
    const { contract, walletAddress, triggerRefresh } = useStateContext();
    const { showToast } = useToast();
    const [form, setForm] = useState({ title: '', story: '', goal: '', deadline: '', image: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleFormFieldChange = (fieldName, e) => setForm({ ...form, [fieldName]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!walletAddress) return showToast('error', 'Please connect your wallet first!');
        setIsLoading(true);

        try {
            if (!contract) throw new Error("Wallet not connected or contract not initialized");

            // Encode title, story, and image into a single JSON string for metaURI
            const campaignData = {
                title: form.title,
                story: form.story,
                image: form.image
            };
            const metaURI = JSON.stringify(campaignData);
            
            const goalInWei = ethers.parseEther(form.goal);
            const deadlineInSeconds = Math.floor((new Date(form.deadline)).getTime() / 1000);
            
            const tx = await contract.createCampaign(metaURI, goalInWei, deadlineInSeconds);
            await tx.wait();

            showToast('success', 'Campaign created successfully!');
            triggerRefresh(); // Refresh the campaign list
            setForm({ title: '', story: '', goal: '', deadline: '', image: '' });
            navigate('/');
        } catch (error) {
            console.error(error);
            showToast('error', `Error: ${error.reason || "Transaction failed"}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4">
            <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">🚀 Launch Your Campaign</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Campaign Title</label>
                        <input id="title" type="text" placeholder="e.g., My Awesome Project" value={form.title} onChange={(e) => handleFormFieldChange('title', e)} className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label htmlFor="story" className="block text-sm font-medium text-gray-300">Story</label>
                        <textarea id="story" placeholder="Tell us more about your project..." rows="4" value={form.story} onChange={(e) => handleFormFieldChange('story', e)} className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-gray-300">Fundraising Goal (ETH)</label>
                            <input id="goal" type="number" step="0.01" placeholder="0.50" value={form.goal} onChange={(e) => handleFormFieldChange('goal', e)} className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-300">End Date</label>
                            <input id="deadline" type="date" value={form.deadline} onChange={(e) => handleFormFieldChange('deadline', e)} className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-300">Campaign Image URL</label>
                        <input id="image" type="url" placeholder="https://example.com/image.png" value={form.image} onChange={(e) => handleFormFieldChange('image', e)} className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60">
                        {isLoading ? 'Submitting to Blockchain...' : 'Create Campaign'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateCampaign;