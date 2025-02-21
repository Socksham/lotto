// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract LotteryNFT is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using Counters for Counters.Counter;
    
    struct Ticket {
        uint256[6] numbers;
        bool claimed;
    }
    
    Counters.Counter private _tokenIds;
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant TRANSACTION_FEE = 250; // 2.5% in basis points
    uint256 public constant OWNER_FEE = 100; // 1% in basis points
    
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public revealedNumbers;
    uint256 public currentRound;
    uint256 public currentRevealIndex;
    uint256 public lastRevealTime;
    uint256 public constant REVEAL_INTERVAL = 2 days;
    
    uint256 public accumulatedPrize;
    bool public roundComplete;
    
    event TicketMinted(uint256 indexed tokenId, address indexed owner, uint256[6] numbers);
    event NumberRevealed(uint256 indexed round, uint256 number, uint256 indexed revealIndex);
    event PrizeAwarded(address indexed winner, uint256 amount);
    event NewRoundStarted(uint256 indexed round);
    
    constructor() ERC721("LotteryNFT", "LOTTO") {}
    
    function mintTicket(uint256[6] memory numbers) public payable nonReentrant {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        
        // Validate numbers (0-9 range)
        for(uint i = 0; i < 6; i++) {
            require(numbers[i] >= 0 && numbers[i] <= 9, "Invalid number range, must be between 0 and 9");
        }
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        tickets[newTokenId] = Ticket(numbers, false);
        
        accumulatedPrize += msg.value;
        
        emit TicketMinted(newTokenId, msg.sender, numbers);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        Ticket memory ticket = tickets[tokenId];
        string memory status = getTicketStatus(tokenId);
        string memory statusColor = getStatusColor(status);
        
        bytes memory image = generateSVGImage(tokenId, ticket, status, statusColor);
        
        return string(
            abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name": "Lottery Ticket #',
                            tokenId.toString(),
                            '", "description": "A dynamic lottery ticket", "image": "data:image/svg+xml;base64,',
                            Base64.encode(image),
                            '", "attributes": [',
                            generateAttributes(ticket.numbers, status),
                            ']}'
                        )
                    )
                )
            )
        );
    }
    
    function generateSVGImage(
        uint256 tokenId,
        Ticket memory ticket,
        string memory status,
        string memory statusColor
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            '<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="100%" height="100%" fill="#1a1b1e"/>',
            '<path d="M0 80 Q200 120 400 80 L400 0 L0 0 Z" fill="#3b82f6"/>',
            '<text x="200" y="50" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">',
            'CRYPTO LOTTERY</text>',
            '<text x="200" y="100" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle">',
            'Ticket #', tokenId.toString(), '</text>',
            generateNumberCircles(ticket.numbers),
            '<rect x="50" y="300" width="300" height="80" rx="10" fill="#262626"/>',
            '<text x="70" y="340" font-family="Arial" font-size="16" fill="#9ca3af">Status:</text>',
            '<text x="140" y="340" font-family="Arial" font-size="16" fill="',
            statusColor, '">', status, '</text>',
            '</svg>'
        );
    }
    
    function generateNumberCircles(uint256[6] memory numbers) internal pure returns (bytes memory) {
        bytes memory circles;
        uint256 startX = 90;
        uint256 spacing = 50;
        
        for(uint i = 0; i < 6; i++) {
            circles = abi.encodePacked(
                circles,
                '<g>',
                '<circle cx="', (startX + (i * spacing)).toString(),
                '" cy="200" r="25" fill="#3b82f6"/>',
                '<text x="', (startX + (i * spacing)).toString(),
                '" y="208" font-family="Arial" font-size="20" fill="white" text-anchor="middle">',
                numbers[i].toString(),
                '</text></g>'
            );
        }
        return circles;
    }
    
    function generateAttributes(uint256[6] memory numbers, string memory status) internal pure returns (string memory) {
        string memory attrs;
        for(uint i = 0; i < 6; i++) {
            attrs = string(
                abi.encodePacked(
                    attrs,
                    i == 0 ? '' : ',',
                    '{"trait_type": "Number ',
                    (i + 1).toString(),
                    '", "value": "',
                    numbers[i].toString(),
                    '"}'
                )
            );
        }
        attrs = string(
            abi.encodePacked(
                attrs,
                ',{"trait_type": "Status", "value": "',
                status,
                '"}'
            )
        );
        return attrs;
    }
    
    function getTicketStatus(uint256 tokenId) internal view returns (string memory) {
        Ticket memory ticket = tickets[tokenId];
        
        if (ticket.claimed) {
            return "Claimed";
        }
        
        if (currentRevealIndex == 0) {
            return "Active";
        }
        
        bool matchesSoFar = true;
        for (uint i = 0; i < currentRevealIndex; i++) {
            if (ticket.numbers[i] != revealedNumbers[i]) {
                matchesSoFar = false;
                break;
            }
        }
        
        if (!matchesSoFar) {
            return "Invalid";
        } else if (currentRevealIndex == 6) {
            return "Winner!";
        } else {
            return string(abi.encodePacked(
                currentRevealIndex.toString(),
                "/6 Matched"
            ));
        }
    }
    
    function getStatusColor(string memory status) internal pure returns (string memory) {
        bytes32 statusHash = keccak256(bytes(status));
        if (statusHash == keccak256(bytes("Active"))) return "#22c55e";
        if (statusHash == keccak256(bytes("Invalid"))) return "#ef4444";
        if (statusHash == keccak256(bytes("Winner!"))) return "#eab308";
        if (statusHash == keccak256(bytes("Claimed"))) return "#6b7280";
        return "#3b82f6";
    }
    
    function revealNumber() public onlyOwner {
        require(!roundComplete, "Start new round first");
        require(block.timestamp >= lastRevealTime + REVEAL_INTERVAL, "Too early for next reveal");
        
        // Using block difficulty and timestamp for randomness
        // Note: In production, consider using Chainlink VRF
        uint256 number = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp))) % 49 + 1;
        
        revealedNumbers[currentRevealIndex] = number;
        emit NumberRevealed(currentRound, number, currentRevealIndex);
        
        currentRevealIndex++;
        lastRevealTime = block.timestamp;
        
        if(currentRevealIndex == 6) {
            roundComplete = true;
        }
    }
    
    function claimPrize(uint256 tokenId) public nonReentrant {
        require(roundComplete, "Round not complete");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!tickets[tokenId].claimed, "Prize already claimed");
        
        bool isWinner = true;
        for(uint256 i = 0; i < 6; i++) {
            if(tickets[tokenId].numbers[i] != revealedNumbers[i]) {
                isWinner = false;
                break;
            }
        }
        
        require(isWinner, "Ticket numbers don't match");
        
        tickets[tokenId].claimed = true;
        uint256 prize = accumulatedPrize;
        accumulatedPrize = 0;
        
        (bool sent, ) = msg.sender.call{value: prize}("");
        require(sent, "Failed to send prize");
        
        emit PrizeAwarded(msg.sender, prize);
    }
    
    function startNewRound() public onlyOwner {
        require(roundComplete, "Current round not complete");
        
        currentRound++;
        currentRevealIndex = 0;
        roundComplete = false;
        lastRevealTime = block.timestamp;
        
        emit NewRoundStarted(currentRound);
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        super._beforeTokenTransfer(from, to, tokenId, 1); // Add batchSize argument
        
        if(from != address(0) && to != address(0)) {
            uint256 fee = (msg.value * TRANSACTION_FEE) / 10000;
            uint256 ownerFee = (msg.value * OWNER_FEE) / 10000;
            
            accumulatedPrize += fee;
            payable(owner()).transfer(ownerFee);
        }
    }
    
    // View functions for frontend
    function getCurrentRoundInfo() public view returns (
        uint256 round,
        uint256 revealIndex,
        bool isComplete,
        uint256 prize,
        uint256 nextRevealTime
    ) {
        return (
            currentRound,
            currentRevealIndex,
            roundComplete,
            accumulatedPrize,
            lastRevealTime + REVEAL_INTERVAL
        );
    }
    
    function getRevealedNumbers() public view returns (uint256[] memory) {
        uint256[] memory numbers = new uint256[](currentRevealIndex);
        for(uint256 i = 0; i < currentRevealIndex; i++) {
            numbers[i] = revealedNumbers[i];
        }
        return numbers;
    }
}