// src/context/index.jsx

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { ethers } from "ethers";
console.log("FACTORY:", process.env.REACT_APP_FACTORY_ADDRESS);
console.log("RPC:", process.env.REACT_APP_SEPOLIA_RPC_URL);
// ================================================================
// CONTRACT DETAILS
// FIX: Read from environment variables instead of hardcoding
// ================================================================
const contractAddress = process.env.REACT_APP_FACTORY_ADDRESS;
const SEPOLIA_RPC_URL = process.env.REACT_APP_SEPOLIA_RPC_URL;



// FIX: Create the provider once outside the component so it never changes,
// preventing unnecessary re-renders and broken memoization
const defaultProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// ABIs
const factoryABI = [
  { "inputs": [ { "internalType": "string", "name": "metaURI", "type": "string" }, { "internalType": "uint256", "name": "goal", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "createCampaign", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "allCampaigns", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" }
];

const campaignABI = [
  { "inputs": [], "name": "contribute", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "creator", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "metaURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "goal", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "deadline", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalContributed", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "withdrawn", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "contributions", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "proofOfUseURIs", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "proofCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "string", "name": "_proofURI", "type": "string" } ], "name": "submitProofOfUse", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// ================================================================
// STATE CONTEXT
// ================================================================
const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            // FIX: Use console.error instead of alert — caller (Navbar) should show toast
            console.error("MetaMask not installed.");
            return;
        }
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setWalletAddress(accounts[0]);
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
            const signer = await web3Provider.getSigner();
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, signer);
            setContract(factoryContract);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    };

    const getCampaignDetails = useCallback(async (campaignAddress) => {
        try {
            const campaignContract = new ethers.Contract(campaignAddress, campaignABI, defaultProvider);

            // FIX: Fetch all base fields in parallel
            const [creator, metaURI, goal, deadline, totalContributed, withdrawn, proofCount] = await Promise.all([
                campaignContract.creator(),
                campaignContract.metaURI(),
                campaignContract.goal(),
                campaignContract.deadline(),
                campaignContract.totalContributed(),
                campaignContract.withdrawn(),
                campaignContract.proofCount(),
            ]);

            // FIX: Fetch all proof URIs in parallel
            const proofOfUseURIs = await Promise.all(
                Array.from({ length: Number(proofCount) }, (_, i) => campaignContract.proofOfUseURIs(i))
            );

            let title = `Campaign: ${campaignAddress.substring(0, 10)}...`;
            let story = "The full story for this campaign is available on the details page.";
            let image = metaURI;

            try {
                const data = JSON.parse(metaURI);
                title = data.title || title;
                story = data.story || story;
                image = data.image || image;
            } catch (e) {
                console.warn(`metaURI for ${campaignAddress} is not valid JSON. Falling back to defaults.`);
            }

            const deadlineInMs = Number(deadline) * 1000;
            const deadlinePassed = new Date().getTime() >= deadlineInMs;
            const isActive = !deadlinePassed && !withdrawn;

            return {
                id: campaignAddress,
                creator,
                image,
                title,
                story,
                goal: ethers.formatEther(goal),
                amountCollected: ethers.formatEther(totalContributed),
                deadline: deadlineInMs,
                withdrawn,
                isActive,
                proofOfUseURIs,
            };
        } catch (error) {
            console.error(`Error in getCampaignDetails for ${campaignAddress}:`, error);
            return null;
        }
    }, []); // FIX: no dependency on defaultProvider since it's now module-level

    const getCampaigns = useCallback(async () => {
        try {
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider);
            const campaignAddresses = await factoryContract.allCampaigns();
            return Promise.all(campaignAddresses.map(address => getCampaignDetails(address)));
        } catch (error) {
            console.error("Could not fetch campaigns:", error);
            return [];
        }
    }, [getCampaignDetails]);

    const getDonations = useCallback(async (userAddress) => {
        try {
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider);
            const campaignAddresses = await factoryContract.allCampaigns();

            // FIX: Fetch all contributions in parallel, then filter
            const contributions = await Promise.all(
                campaignAddresses.map(async (address) => {
                    const campaignContract = new ethers.Contract(address, campaignABI, defaultProvider);
                    const contribution = await campaignContract.contributions(userAddress);
                    return { address, contribution };
                })
            );

            const donated = contributions.filter(({ contribution }) => contribution > 0n);

            const donations = await Promise.all(
                donated.map(async ({ address, contribution }) => {
                    const campaignDetails = await getCampaignDetails(address);
                    if (!campaignDetails) return null;
                    return { ...campaignDetails, amount: ethers.formatEther(contribution) };
                })
            );

            return donations.filter(Boolean);
        } catch (error) {
            console.error("Error in getDonations:", error);
            return [];
        }
    }, [getCampaignDetails]);

    const triggerRefresh = () => setRefresh(prev => !prev);

    return (
        <StateContext.Provider value={{ connectWallet, walletAddress, contract, provider, getCampaigns, getCampaignDetails, getDonations, refresh, triggerRefresh }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);

// ================================================================
// TOAST CONTEXT & PROVIDER
// ================================================================
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const Toast = ({ type, message }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'info' ? 'bg-blue-500' : 'bg-red-500';
    return (
        <div className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-in-up ${bgColor}`}>
            {message}
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const showToast = useCallback((type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    }, []);
    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && <Toast type={toast.type} message={toast.message} />}
        </ToastContext.Provider>
    );
};

// ================================================================
// THEME CONTEXT & PROVIDER
// ================================================================
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
