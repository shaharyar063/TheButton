// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LinkRevealPaymentETH {
    address public immutable owner;
    uint256 public constant PAYMENT_AMOUNT = 10_000_000_000_000; // 0.00001 ETH in wei
    
    event LinkSubmitted(address indexed submitter, string url, uint256 timestamp);
    event PaymentReceived(address indexed from, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    function submitLink(string calldata url) external payable {
        require(msg.value >= PAYMENT_AMOUNT, "Insufficient payment");
        require(bytes(url).length > 0, "URL cannot be empty");
        
        // Send excess back if overpaid
        if (msg.value > PAYMENT_AMOUNT) {
            payable(msg.sender).transfer(msg.value - PAYMENT_AMOUNT);
        }
        
        // Transfer payment to owner
        payable(owner).transfer(PAYMENT_AMOUNT);
        
        emit LinkSubmitted(msg.sender, url, block.timestamp);
        emit PaymentReceived(msg.sender, PAYMENT_AMOUNT);
    }
    
    function getRequiredPayment() external pure returns (uint256) {
        return PAYMENT_AMOUNT;
    }
    
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}
