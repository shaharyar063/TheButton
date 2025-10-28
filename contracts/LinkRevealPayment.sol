// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract LinkRevealPayment {
    IERC20 public immutable usdcToken;
    address public immutable owner;
    uint256 public constant PAYMENT_AMOUNT = 1_000_000; // 1 USDC (6 decimals)
    
    event LinkSubmitted(address indexed submitter, string url, uint256 timestamp);
    
    constructor(address _usdcToken, address _owner) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_owner != address(0), "Invalid owner address");
        usdcToken = IERC20(_usdcToken);
        owner = _owner;
    }
    
    function submitLink(string calldata _url) external returns (bool) {
        require(bytes(_url).length > 0, "URL cannot be empty");
        
        bool success = usdcToken.transferFrom(msg.sender, owner, PAYMENT_AMOUNT);
        require(success, "USDC transfer failed");
        
        emit LinkSubmitted(msg.sender, _url, block.timestamp);
        
        return true;
    }
    
    function getRequiredPayment() external pure returns (uint256) {
        return PAYMENT_AMOUNT;
    }
}
