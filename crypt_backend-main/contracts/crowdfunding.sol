// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/*
Campaign = piggy bank for one project
Factory  = vending machine that makes many campaigns
*/

contract Campaign is ReentrancyGuard {
    address public creator;
    string public metaURI;               // IPFS metadata (title/desc/image)
    uint256 public goal;
    uint256 public deadline;
    // unix timestamp
    uint256 public totalContributed;
    bool public withdrawn;
    bool public active = true;
    
    string[] public proofOfUseURIs;
    // NEW STATE VARIABLE: Stores an array of links

    mapping(address => uint256) public contributions;
    event Contributed(address indexed from, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    // CHANGED: New event signature
    event ProofSubmitted(uint256 index, string proofURI);
    
    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    constructor(address _creator, string memory _metaURI, uint256 _goal, uint256 _deadline) {
        require(_goal > 0, "Goal must be > 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        creator = _creator;
        metaURI = _metaURI;
        goal = _goal;
        deadline = _deadline;
    }


    // 腸 Contribute ETH
    function contribute() external payable nonReentrant {
        require(block.timestamp < deadline, "Campaign ended");
        require(msg.value > 0, "Need ETH");
        contributions[msg.sender] += msg.value;
        totalContributed += msg.value;
        emit Contributed(msg.sender, msg.value);
    }

    // 漠 Refund if goal not reached
    function refund() external nonReentrant {
        // MODIFIED: Must wait 1 day after deadline AND no proof submitted
        require(block.timestamp >= deadline + 1 days, "Must wait 1 day after deadline");
        require(proofOfUseURIs.length == 0, "Cannot refund after proof submitted");
        
        require(totalContributed < goal, "Goal met");
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "Nothing to refund");
        contributions[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Refund failed");
        emit Refunded(msg.sender, amount);
    }
    
    // NEW FUNCTION: Cancel the campaign
    function cancel() external onlyCreator {
        require(active, "Campaign is already inactive");
        require(totalContributed == 0, "Cannot cancel with contributions");
        active = false;
    }

    // 醇 Withdraw if goal reached
    function withdraw() external onlyCreator nonReentrant {
        require(block.timestamp >= deadline, "Not ended yet");
        require(totalContributed >= goal, "Goal not met");
        // REQUIREMENT: Must have submitted at least one proof of use
        require(proofOfUseURIs.length > 0, "Must submit at least one proof of use"); 
        
        require(!withdrawn, "Already withdrawn");
        withdrawn = true;
        uint256 bal = address(this).balance;
        (bool sent, ) = payable(creator).call{value: bal}("");
        require(sent, "Withdraw failed");
        emit Withdrawn(creator, bal);
    }
    
    // ｧｾ UPDATED FUNCTION: Requirement on 'withdrawn' state removed.
    function submitProofOfUse(string memory _proofURI) external onlyCreator {
        // REQUIREMENT REMOVED: require(withdrawn, "Funds must be withdrawn first");
        proofOfUseURIs.push(_proofURI);
        emit ProofSubmitted(proofOfUseURIs.length - 1, _proofURI);
    }
    
    // NEW VIEW FUNCTION to get the count of submitted proofs (for efficient reading on frontend)
    function proofCount() external view returns (uint256) {
        return proofOfUseURIs.length;
    }
}

contract CampaignFactory {
    address[] public campaigns;

    event CampaignCreated(address indexed creator, address campaign, string metaURI, uint256 goal, uint256 deadline);
    function createCampaign(string memory metaURI, uint256 goal, uint256 deadline) external returns (address) {
        Campaign c = new Campaign(msg.sender, metaURI, goal, deadline);
        campaigns.push(address(c));
        emit CampaignCreated(msg.sender, address(c), metaURI, goal, deadline);
        return address(c);
    }

    function allCampaigns() external view returns (address[] memory) {
        return campaigns;
    }
}