// src/pages/CampaignDetails.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from "ethers";
import { useStateContext, useToast } from '../context';
import campaignABIJson from '../utils/campaignABI.json';
const campaignABI = campaignABIJson.abi;


// Icons
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-9l3-3 3 3m-6 6l3 3 3-3" /></svg>;
const WithdrawIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.103c.72.186 1.345-.355 1.345-1.071v-3.674c0-.555-.345-1.054-.862-1.229a10.023 10.023 0 00-6.195-4.148c-.553-.191-1.127-.291-1.7-.308m-.831 2.545a2.225 2.225 0 01-1.656-2.222v-1.332a.831.831 0 00-.781-.826h-2.115a.831.831 0 00-.78.826v1.332c0 .991.802 1.83 1.777 2.054a10.02 10.02 0 005.516 2.378" /></svg>;
const RefundIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const ProofIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const StatBox = ({ icon, title, value }) => (
    <div className="flex items-center space-x-3">
        <div className="text-blue-500">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    </div>
);

function CampaignDetail() {
    const { address } = useParams();
    const { provider, getCampaignDetails, refresh, walletAddress, triggerRefresh } = useStateContext();
    const { showToast } = useToast();
    
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);
    const [userContribution, setUserContribution] = useState(ethers.getBigInt(0));
    
    // States for proof submission
    const [proofURL, setProofURL] = useState(''); 
    const [isSubmittingProof, setIsSubmittingProof] = useState(false); 
    const [fileToUpload, setFileToUpload] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const donate = async () => {
        if (!walletAddress) return alert('Please connect your wallet to donate.');
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }

        setIsDonating(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            const tx = await campaignContract.contribute({ value: ethers.parseEther(amount) });
            await tx.wait();
            alert('Donation successful!');
            setAmount('');
            triggerRefresh();
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.reason || "Donation failed"}`);
        } finally {
            setIsDonating(false);
        }
    };
    
    const handleWithdraw = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet first.");
            return;
        }
        if (campaign.creator.toLowerCase() !== walletAddress.toLowerCase()) {
            alert("Only the campaign creator can withdraw funds.");
            return;
        }

        setIsWithdrawing(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            const tx = await campaignContract.withdraw();
            await tx.wait();
            alert("Funds withdrawn successfully!");
            triggerRefresh();
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert(`Withdrawal failed: ${error.reason || error.message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleRefund = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet first.");
            return;
        }

        setIsRefunding(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            const tx = await campaignContract.refund();
            await tx.wait();
            alert("Refund successful!");
            triggerRefresh();
        } catch (error) {
            console.error("Refund failed:", error);
            alert(`Refund failed: ${error.reason || error.message}`);
        } finally {
            setIsRefunding(false);
        }
    };
    
    // UPDATED FUNCTION: Converts file to a Base64 Data URI (a self-contained link)
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!fileToUpload) return showToast('error', 'Please select a file to upload.');
        
        setIsUploading(true);
        showToast('info', `Processing ${fileToUpload.name}... (No external services needed)`);

        try {
            // Check if the file is too large for the Base64 method (e.g., > 1MB)
            if (fileToUpload.size > 1024 * 1024) { 
                throw new Error("File too large. Max size 1MB for direct Base64 encoding. Please use a cloud service instead.");
            }
            
            // Read the file as a Data URL (Base64 encoded string)
            const reader = new FileReader();
            
            // Return a promise so we can use await/async syntax
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(fileToUpload);
            });
            
            setProofURL(dataUrl); // Set the Data URI as the link
            showToast('success', 'File processed! Ready to submit link to blockchain.');

        } catch (error) {
            console.error("File processing failed:", error);
            showToast('error', `File processing failed: ${error.message}`);
            setProofURL('');
        } finally {
            setIsUploading(false);
            setFileToUpload(null); 
        }
    };
    
    // UPDATED FUNCTION: Submit Proof of Use 
    const handleSubmitProofOfUse = async (e) => {
        e.preventDefault();
        
        if (!walletAddress) return showToast('error', 'Please connect your wallet first.');
        if (campaign.creator.toLowerCase() !== walletAddress.toLowerCase()) return showToast('error', "Only the campaign creator can submit proof.");
        if (!proofURL.trim()) return showToast('error', "Please upload a file or paste a valid proof URL.");

        setIsSubmittingProof(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            // Use the URL saved in state
            const tx = await campaignContract.submitProofOfUse(proofURL); 
            await tx.wait();
            showToast('success', "Proof of Use submitted successfully!");
            setProofURL(''); // Clear URL field for the next submission
            triggerRefresh();
        } catch (error) {
            console.error("Proof submission failed:", error);
            showToast('error', `Proof submission failed: ${error.reason || error.message}`);
        } finally {
            setIsSubmittingProof(false);
        }
    };

    const fetchCampaign = useCallback(async () => {
        setIsLoading(true);
        const data = await getCampaignDetails(address);
        
        if(data && walletAddress) {
             try {
                // Using the hardcoded RPC URL from src/context/index.jsx
                const defaultProvider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/dnvuizKMmhQ4l1UKH5eSc'); 
                const campaignContract = new ethers.Contract(address, campaignABI, defaultProvider);
                const contribution = await campaignContract.contributions(walletAddress);
                setUserContribution(contribution);
            } catch (error) {
                console.error("Could not fetch user contribution:", error);
                setUserContribution(ethers.getBigInt(0));
            }
        }
        
        setCampaign(data);
        setIsLoading(false);
    }, [address, getCampaignDetails, walletAddress]);

    useEffect(() => {
        if(address) fetchCampaign();
    }, [address, refresh, fetchCampaign]);
    
    if(isLoading) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Loading campaign details...</p>;
    if(!campaign) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Campaign not found.</p>;
    
    const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
    const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
    
    const deadlinePassed = new Date().getTime() >= campaign.deadline;
    const goalMet = parseFloat(campaign.amountCollected) >= parseFloat(campaign.goal);
    
    // User role checks
    const isCreator = walletAddress && campaign.creator.toLowerCase() === walletAddress.toLowerCase();

    // UPDATED LOGIC: Proof of Use is available anytime for the creator.
    const canSubmitProof = isCreator; 

    // NEW CONSTANTS FOR LOGIC
    const proofCount = campaign.proofOfUseURIs?.length || 0;
    const hasProof = proofCount > 0;
    
    // MODIFIED: Use 1 day for refund window
    const ONE_DAY_IN_MS = 1 * 24 * 60 * 60 * 1000;
    const oneDayPassedSinceDeadline = new Date().getTime() >= (campaign.deadline + ONE_DAY_IN_MS);
        
    // Withdrawal Logic (for creator)
    const canWithdraw = 
        isCreator &&
        deadlinePassed &&
        goalMet &&
        hasProof && // Must have at least one proof
        !campaign.withdrawn;
        
    // UPDATED Refund Logic (for contributors)
    const hasContributed = userContribution > ethers.getBigInt(0);
    const canRefund =
        walletAddress &&
        oneDayPassedSinceDeadline && // MODIFIED: 1 day must have passed
        !goalMet &&
        (proofCount === 0) && // No proof submitted
        hasContributed;
        
    // Check if the creator has any pending actions left (withdraw or proof submission)
    const creatorHasPendingAction = canWithdraw || canSubmitProof;

    // Determine what action button to show
    let actionButton = null;

    if (canSubmitProof) { 
        actionButton = (
            <form onSubmit={handleSubmitProofOfUse} className="mt-4 p-4 border border-blue-600 rounded-xl bg-gray-800 space-y-3">
                <h3 className="text-xl font-semibold text-white">Submit Proof of Use (Creator Only)</h3>
                
                <label className="block text-sm font-medium text-gray-300">1. Select Document/Image (Max 1MB):</label>
                <input 
                    type="file" 
                    onChange={(e) => {
                        setFileToUpload(e.target.files[0]);
                        setProofURL(''); // Clear URL when a new file is selected
                    }} 
                    // Styled for better visibility in the dark theme
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer"
                />
                
                {fileToUpload && (
                    <button
                        onClick={handleFileUpload}
                        disabled={isUploading}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-60"
                    >
                        {isUploading ? "Processing File..." : `Process "${fileToUpload.name}"`}
                    </button>
                )}

                <label className="block text-sm font-medium text-gray-300">2. Submit Link to Blockchain:</label>
                <input 
                    type="url" 
                    placeholder="Link (Auto-Populated after processing)" 
                    value={proofURL} 
                    onChange={(e) => setProofURL(e.target.value)} 
                    className="bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                    readOnly={proofURL.length > 0 && !fileToUpload} // Make read-only if URL is set and no new file selected
                />
                {proofURL.startsWith('data:') && (
                    <p className="text-xs text-yellow-400">Note: File is encoded directly as a small Data URI in the field above.</p>
                )}

                <button
                    type="submit"
                    disabled={isSubmittingProof || isUploading || proofURL.length === 0}
                    className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105"
                >
                    <div className="flex items-center justify-center space-x-2">
                        <ProofIcon/>
                        <span>{isSubmittingProof ? "Submitting Link..." : "Submit Proof Link"}</span>
                    </div>
                </button>
            </form>
        );
    } else if (isCreator) {
        // Creator's Action: Withdraw, or status message
        if (canWithdraw) {
            actionButton = (
                <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="mt-4 bg-green-600 text-white px-6 py-3 w-full rounded-lg hover:bg-green-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105"
                >
                    <div className="flex items-center justify-center space-x-2">
                        <WithdrawIcon/>
                        <span>{isWithdrawing ? "Withdrawing..." : "Withdraw Funds"}</span>
                    </div>
                </button>
            );
        } else if (deadlinePassed && goalMet && !hasProof) {
             actionButton = (
                <div className="mt-4 p-4 text-center bg-yellow-900 rounded-xl border border-yellow-700">
                    <p className="text-yellow-300 font-semibold">Funds ready, but must submit proof of use before withdrawing.</p>
                </div>
            );
        } else if (deadlinePassed && !goalMet) {
             actionButton = (
                <div className="mt-4 p-4 text-center bg-red-900 rounded-xl border border-red-700">
                    <p className="text-red-300 font-semibold">Goal not met. Contributors can request a refund after the 1-day waiting period, provided no proof is submitted.</p>
                </div>
            );
        } else if (deadlinePassed && !creatorHasPendingAction) {
             actionButton = (
                <div className="mt-4 p-4 text-center bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Campaign management concluded.</p>
                </div>
            );
        }
    } else if (canRefund) {
        actionButton = (
            <button
                onClick={handleRefund}
                disabled={isRefunding}
                className="mt-4 bg-red-600 text-white px-6 py-3 w-full rounded-lg hover:bg-red-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105"
            >
                <div className="flex items-center justify-center space-x-2">
                    <RefundIcon/>
                    <span>{isRefunding ? "Processing Refund..." : `Refund ${ethers.formatEther(userContribution)} ETH`}</span>
                </div>
            </button>
        );
    } else if (hasContributed && deadlinePassed && !goalMet) {
        // Contributor refund status messages
        let refundMessage = "Goal not met. ";
        
        // MODIFIED: Refund time check and messaging
        if (!oneDayPassedSinceDeadline) {
             // Calculate remaining time in hours or days
             const timeRemaining = campaign.deadline + ONE_DAY_IN_MS - new Date().getTime(); 
             const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

             if (hoursRemaining > 24) {
                 const daysRemaining = Math.ceil(hoursRemaining / 24);
                 refundMessage += `Refunds are available in approximately ${daysRemaining} day(s).`;
             } else {
                 refundMessage += `Refunds are available in approximately ${hoursRemaining} hour(s).`;
             }
        } else if (proofCount > 0) {
            refundMessage += "Refund is unavailable because the creator has submitted proof of use.";
        }
        
        if (refundMessage !== "Goal not met. ") {
             actionButton = (
                <div className="mt-4 p-4 text-center bg-yellow-900 rounded-xl border border-yellow-700">
                    <p className="text-yellow-300 font-semibold">{refundMessage}</p>
                </div>
            );
        }
    }
    
    // Default action (Donation Form) if no other button/message is shown
    if (!actionButton || (!isCreator && daysLeft > 0)) {
        actionButton = (
            <>
                <h3 className="text-xl font-semibold mb-4 text-white">Fund this Campaign</h3>
                <input type="number" placeholder="ETH 0.1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                <button onClick={donate} disabled={isDonating} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105">
                    {isDonating ? "Processing Donation..." : "Fund Campaign"}
                </button>
            </>
        );
    }
    
    // UPDATED: Proof of Use Display Component to handle array
    const ProofOfUseSection = () => {
        // Check if proofOfUseURIs is an array and has items
        if (campaign.proofOfUseURIs && Array.isArray(campaign.proofOfUseURIs) && campaign.proofOfUseURIs.length > 0) {
            return (
                <div className="mt-12 p-8 bg-gray-900/50 backdrop-blur-md border border-green-700 rounded-2xl shadow-xl">
                    <h2 className="text-3xl font-bold mb-4 text-white flex items-center space-x-2">
                        <ProofIcon/><span>Proof of Use Submitted ({campaign.proofOfUseURIs.length})</span>
                    </h2>
                    <p className="leading-relaxed mb-4 text-gray-300">
                        The campaign creator has submitted the following proof documents showing how the funds were or will be used.
                    </p>
                    <div className="space-y-3">
                        {campaign.proofOfUseURIs.map((uri, index) => (
                             <a 
                                key={index}
                                href={uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block w-full text-center bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                            >
                                View Proof Document #{index + 1}
                            </a>
                        ))}
                    </div>
                </div>
            );
        }
        
        // No pending state is needed, as the form is always visible to the creator.
        return null;
    }


    return (
        <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-96 object-cover rounded-2xl shadow-lg mb-8"/>
                    <h1 className="text-4xl font-bold mb-4 text-white">{campaign.title}</h1>
                    <p className="font-medium mb-2 text-gray-300">Creator:</p>
                    <p className="text-sm text-gray-400 break-all mb-8">{campaign.creator}</p>
                    <h2 className="text-2xl font-bold mb-4 text-white">Story</h2>
                    <p className="leading-relaxed mb-8 text-gray-300">{campaign.story}</p>
                    
                    {/* NEW: Proof of Use Section */}
                    <ProofOfUseSection />
                    
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl sticky top-28">
                        <div className="grid grid-cols-1 gap-y-4 mb-6">
                            <StatBox icon={<ClockIcon/>} title="Days Left" value={daysLeft}/>
                            <StatBox icon={<EthIcon/>} title={`Raised of ${campaign.goal} ETH`} value={campaign.amountCollected}/>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{width: `${progress}%`}}></div>
                        </div>
                        
                        {/* Render the appropriate action button */}
                        {actionButton}
                        
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CampaignDetail;