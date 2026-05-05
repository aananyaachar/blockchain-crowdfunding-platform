const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Get the next nonce for deployer
  const nonce = await ethers.provider.getTransactionCount(deployer.address);

  // Predict the contract address
  const futureAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: nonce,
  });

  console.log("Deployer:", deployer.address);
  console.log("Predicted CampaignFactory Address:", futureAddress);

  // Path to frontend addresses.json
  const addressesPath = path.join(__dirname, "..", "frontend", "src", "utils", "addresses.json");

  // Create object to save
  const data = {
    CampaignFactory: futureAddress,
  };

  // Write to addresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(data, null, 2));

  console.log(`✅ Address saved to ${addressesPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
