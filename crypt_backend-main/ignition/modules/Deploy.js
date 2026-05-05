const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployModule", (m) => {
  const factory = m.contract("CampaignFactory", []);
  return { factory };
});