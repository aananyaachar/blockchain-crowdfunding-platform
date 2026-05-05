const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crowdfunding", function () {
  let factory, owner, alice, bob;
  const goal = ethers.parseEther("1");
  let deadline;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CampaignFactory");
    factory = await Factory.deploy();
    deadline = (await time.latest()) + 3600; // 1 hour from now
  });

  async function getCampaignAt(index = 0) {
    const addresses = await factory.allCampaigns();
    const Campaign = await ethers.getContractFactory("Campaign");
    return Campaign.attach(addresses[index]);
  }

  it("creates a campaign", async () => {
    await factory.createCampaign("ipfs://meta", goal, deadline);
    const addresses = await factory.allCampaigns();
    expect(addresses.length).to.equal(1);
  });

  it("accepts contributions", async () => {
    await factory.createCampaign("ipfs://meta", goal, deadline);
    const campaign = await getCampaignAt(0);

    await campaign.connect(alice).contribute({ value: ethers.parseEther("0.25") });
    await campaign.connect(bob).contribute({ value: ethers.parseEther("0.75") });

    expect(await campaign.totalContributed()).to.equal(ethers.parseEther("1.0"));
  });

  it("allows refund if goal not met after deadline", async () => {
    await factory.createCampaign("ipfs://meta", goal, deadline);
    const campaign = await getCampaignAt(0);

    await campaign.connect(alice).contribute({ value: ethers.parseEther("0.2") });
    await time.increaseTo(deadline + 1);

    const before = await ethers.provider.getBalance(alice.address);
    const tx = await campaign.connect(alice).refund();
    const receipt = await tx.wait();
    const gas = receipt.fee; // ethers v6

    const after = await ethers.provider.getBalance(alice.address);
    // after ≈ before - gas + 0.2 ETH (allow small diff)
    expect(after).to.be.gt(before - gas); // sanity
  });

  it("allows creator to withdraw if goal met after deadline", async () => {
    await factory.createCampaign("ipfs://meta", goal, deadline);
    const campaign = await getCampaignAt(0);

    await campaign.connect(alice).contribute({ value: ethers.parseEther("0.6") });
    await campaign.connect(bob).contribute({ value: ethers.parseEther("0.5") });
    await time.increaseTo(deadline + 1);

    const before = await ethers.provider.getBalance(owner.address);
    const tx = await campaign.connect(owner).withdraw();
    const rc = await tx.wait();
    const gas = rc.fee;

    const after = await ethers.provider.getBalance(owner.address);
    expect(after).to.be.gt(before - gas); // owner received ETH minus gas
  });
});