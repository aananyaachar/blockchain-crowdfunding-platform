import { ethers } from "ethers";
import factoryArtifact from "../artifacts/contracts/crowdfunding.sol/CampaignFactory.json";
import campaignArtifact from "../artifacts/contracts/crowdfunding.sol/Campaign.json";

// It's a good practice to put the address in an .env file
// but for a dev environment, you can hardcode it to test
const FACTORY_ADDRESS = "0xc16bD9d6C609C14CbEF1694cC3a64a3E7EE83aBf"; // Replace with your actual deployed address

export function getFactory(providerOrSigner) {
  if (!FACTORY_ADDRESS) {
    console.warn("⚠️ FACTORY_ADDRESS is not set.");
    return null;
  }
  return new ethers.Contract(FACTORY_ADDRESS, factoryArtifact.abi, providerOrSigner);
}

export function getCampaign(address, providerOrSigner) {
  return new ethers.Contract(address, campaignArtifact.abi, providerOrSigner);
}

// Helper to fetch data from a campaign
export async function fetchCampaignDetails(address, provider) {
    const campaign = getCampaign(address, provider);
    const details = {};
    
    // Fetch each public variable individually
    details.creator = await campaign.creator();
    details.metaURI = await campaign.metaURI();
    details.goal = await campaign.goal();
    details.deadline = await campaign.deadline();
    details.totalContributed = await campaign.totalContributed();

    return details;
}