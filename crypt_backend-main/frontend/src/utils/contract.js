import { ethers } from "ethers";
import factoryArtifact from "../artifacts/contracts/crowdfunding.sol/CampaignFactory.json";
import campaignArtifact from "../artifacts/contracts/crowdfunding.sol/Campaign.json";

// FIX: Read address from environment variable instead of hardcoding
const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS;

export function getFactory(providerOrSigner) {
  if (!FACTORY_ADDRESS) {
    console.warn("⚠️ REACT_APP_FACTORY_ADDRESS is not set in .env");
    return null;
  }
  return new ethers.Contract(FACTORY_ADDRESS, factoryArtifact.abi, providerOrSigner);
}

export function getCampaign(address, providerOrSigner) {
  return new ethers.Contract(address, campaignArtifact.abi, providerOrSigner);
}

// FIX: Fetch all fields in parallel with Promise.all instead of sequential awaits
export async function fetchCampaignDetails(address, provider) {
    const campaign = getCampaign(address, provider);

    const [creator, metaURI, goal, deadline, totalContributed] = await Promise.all([
        campaign.creator(),
        campaign.metaURI(),
        campaign.goal(),
        campaign.deadline(),
        campaign.totalContributed(),
    ]);

    return { creator, metaURI, goal, deadline, totalContributed };
}