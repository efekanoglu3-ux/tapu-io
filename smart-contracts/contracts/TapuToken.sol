// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TapuToken
 * @notice TAPU.IO — Real Estate Tokenization Platform
 * @dev ERC-1155 token where each token ID represents a unique property
 * Each property is tokenized with tapu şerhi (title deed restriction) in Turkey
 */
contract TapuToken is ERC1155, Ownable, Pausable, ReentrancyGuard {

    // ── STRUCTS ──────────────────────────────────────────────────────────────
    struct Property {
        uint256 id;
        string name;
        string location;
        uint256 totalTokens;
        uint256 tokenPrice;    // in wei
        uint256 soldTokens;
        uint256 monthlyRent;   // in wei
        bool active;
        bool hasReserveFund;
        address owner;
        string tapuSherhHash;  // IPFS hash of tapu şerhi document
        string contractHash;   // IPFS hash of tokenization contract
    }

    struct RentDistribution {
        uint256 propertyId;
        uint256 amount;
        uint256 timestamp;
        bool distributed;
    }

    // ── STATE ─────────────────────────────────────────────────────────────────
    mapping(uint256 => Property) public properties;
    mapping(uint256 => RentDistribution[]) public rentHistory;
    mapping(uint256 => mapping(address => uint256)) public lockUpExpiry;

    uint256 public propertyCount;
    uint256 public platformFeePercent = 25; // 2.5% = 25/1000
    uint256 public lockUpPeriod = 90 days;
    address public platformWallet;

    // ── EVENTS ────────────────────────────────────────────────────────────────
    event PropertyListed(uint256 indexed propertyId, string name, address owner, uint256 totalTokens, uint256 tokenPrice);
    event TokensPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 cost);
    event RentDistributed(uint256 indexed propertyId, uint256 amount, uint256 timestamp);
    event PropertySold(uint256 indexed propertyId, uint256 salePrice);
    event TokensListed(uint256 indexed propertyId, address indexed seller, uint256 amount, uint256 price);

    // ── CONSTRUCTOR ───────────────────────────────────────────────────────────
    constructor(address _platformWallet) ERC1155("https://tapu.io/api/tokens/{id}.json") Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }

    // ── PROPERTY MANAGEMENT ───────────────────────────────────────────────────

    /**
     * @notice List a new property for tokenization
     * @dev Only platform admin can list properties (after verifying tapu şerhi)
     */
    function listProperty(
        string memory _name,
        string memory _location,
        uint256 _totalTokens,
        uint256 _tokenPrice,
        uint256 _monthlyRent,
        bool _hasReserveFund,
        address _owner,
        string memory _tapuSherhHash,
        string memory _contractHash
    ) external onlyOwner returns (uint256) {
        propertyCount++;
        uint256 propertyId = propertyCount;

        properties[propertyId] = Property({
            id: propertyId,
            name: _name,
            location: _location,
            totalTokens: _totalTokens,
            tokenPrice: _tokenPrice,
            soldTokens: 0,
            monthlyRent: _monthlyRent,
            active: true,
            hasReserveFund: _hasReserveFund,
            owner: _owner,
            tapuSherhHash: _tapuSherhHash,
            contractHash: _contractHash
        });

        emit PropertyListed(propertyId, _name, _owner, _totalTokens, _tokenPrice);
        return propertyId;
    }

    /**
     * @notice Buy tokens for a property
     */
    function buyTokens(uint256 _propertyId, uint256 _amount)
        external payable nonReentrant whenNotPaused
    {
        Property storage prop = properties[_propertyId];
        require(prop.active, "Property not active");
        require(_amount > 0, "Amount must be > 0");
        require(prop.soldTokens + _amount <= prop.totalTokens, "Insufficient tokens available");

        uint256 totalCost = _amount * prop.tokenPrice;
        require(msg.value >= totalCost, "Insufficient payment");

        // Platform fee (2.5%)
        uint256 platformFee = (totalCost * platformFeePercent) / 1000;
        uint256 ownerProceeds = totalCost - platformFee;

        // Transfer fees
        payable(platformWallet).transfer(platformFee);
        payable(prop.owner).transfer(ownerProceeds);

        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        // Mint tokens
        _mint(msg.sender, _propertyId, _amount, "");
        prop.soldTokens += _amount;

        // Set lock-up
        lockUpExpiry[_propertyId][msg.sender] = block.timestamp + lockUpPeriod;

        emit TokensPurchased(_propertyId, msg.sender, _amount, totalCost);
    }

    /**
     * @notice Distribute rent to all token holders
     * @dev Called by platform monthly after rent is collected
     */
    function distributeRent(uint256 _propertyId)
        external payable onlyOwner nonReentrant
    {
        Property storage prop = properties[_propertyId];
        require(prop.active, "Property not active");
        require(msg.value > 0, "No rent to distribute");

        rentHistory[_propertyId].push(RentDistribution({
            propertyId: _propertyId,
            amount: msg.value,
            timestamp: block.timestamp,
            distributed: true
        }));

        emit RentDistributed(_propertyId, msg.value, block.timestamp);
        // Note: Actual per-holder distribution handled off-chain
        // On-chain record serves as immutable proof
    }

    // ── VIEW FUNCTIONS ────────────────────────────────────────────────────────

    function getProperty(uint256 _propertyId) external view returns (Property memory) {
        return properties[_propertyId];
    }

    function getAvailableTokens(uint256 _propertyId) external view returns (uint256) {
        Property storage prop = properties[_propertyId];
        return prop.totalTokens - prop.soldTokens;
    }

    function isUnlocked(uint256 _propertyId, address _holder) external view returns (bool) {
        return block.timestamp >= lockUpExpiry[_propertyId][_holder];
    }

    function getRentHistory(uint256 _propertyId) external view returns (RentDistribution[] memory) {
        return rentHistory[_propertyId];
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function updatePlatformWallet(address _newWallet) external onlyOwner {
        platformWallet = _newWallet;
    }

    function deactivateProperty(uint256 _propertyId) external onlyOwner {
        properties[_propertyId].active = false;
    }
}
