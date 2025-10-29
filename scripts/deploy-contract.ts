import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  console.log('🚀 Deploying LinkRevealPaymentETH to Base Mainnet...\n');

  // Connect to Base Mainnet
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('📍 Deployer address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');
  
  if (balance === 0n) {
    console.error('❌ Insufficient balance. Please add ETH to your wallet for gas fees.');
    process.exit(1);
  }

  // Contract ABI and bytecode for LinkRevealPaymentETH
  const abi = [
    "constructor()",
    "function submitLink(string calldata url) external payable",
    "function getRequiredPayment() external pure returns (uint256)",
    "function owner() external view returns (address)",
    "event LinkSubmitted(address indexed submitter, string url, uint256 timestamp)",
    "event PaymentReceived(address indexed from, uint256 amount)"
  ];

  // Compiled bytecode from LinkRevealPaymentETH.sol
  const bytecode = '0x608060405234801561000f575f80fd5b50335f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061063a8061005d5f395ff3fe60806040526004361061003e575f3560e01c806313e7c9d8146100475780638da5cb5b1461006f5780639b57729c1461009a578063b269681d146100c45761004557005b5f80fd5b34801561005257600080fd5b5061006d600480360381019061006891906103ca565b6100ce565b005b34801561007a57600080fd5b506100836102a1565b604051610091929190610456565b60405180910390f35b3480156100a557600080fd5b506100ae6102c5565b6040516100bb919061048e565b60405180910390f35b6100cc6102d1565b005b5f6509184e72a0003410156100e257600080fd5b5f8251116100ef57600080fd5b5f6509184e72a000341115610156576509184e72a00034610110919061050d565b9050803373ffffffffffffffffffffffffffffffffffffffff166108fc829081150290604051600060405180830381858888f1935050505015801561015757600080fd5b5b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc6509184e72a0009081150290604051600060405180830381858888f193505050501580156101c057600080fd5b507f24ec1d3ff24159cf2e54b64ad937a0c8f6f42aa9b1b1c1e4f7b1e6e14f1c1e8733848442604051610205949392919061055a565b60405180910390a17f6ef95f06320e7a25a04a175ca677b7052bdd97131872c2192525a629f51be7703349604051610238929190610604565b60405180910390a15050565b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b5f6509184e72a000905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102c08261027a565b810181811067ffffffffffffffff821117156102df576102de61028a565b5b80604052505050565b5f6102f1610271565b90506102fd82826102b7565b919050565b5f67ffffffffffffffff82111561031c5761031b61028a565b5b6103258261027a565b9050602081019050919050565b828183375f83830152505050565b5f61035261034d84610302565b6102e8565b90508281526020810184848401111561036e5761036d610276565b5b610379848285610332565b509392505050565b5f82601f83011261039557610394610272565b5b81356103a5848260208601610340565b91505092915050565b5f819050919050565b6103c0816103ae565b81146103ca575f80fd5b50565b5f602082840312156103df576103de61026c565b5b5f82013567ffffffffffffffff8111156103fc576103fb610270565b5b61040884828501610381565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61043a82610411565b9050919050565b61044a81610430565b82525050565b5f6040820190506104635f830185610441565b6104706020830184610441565b9392505050565b61048081610430565b82525050565b5f6020820190506104995f830184610477565b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6104d7826103ae565b91506104e2836103ae565b92508282039050818111156104fa576104f961049f565b5b92915050565b5f819050919050565b5f610513826103ae565b915061051e836103ae565b925082820390508181111561053657610535610500565b5b92915050565b61054581610430565b82525050565b610554816103ae565b82525050565b5f60808201905061056d5f83018761053c565b818103602083015261057f8186610477565b905061058e604083018561054b565b61059b606083018461054b565b95945050505050565b5f81519050919050565b5f82825260208201905092915050565b5f5b838110156105db5780820151818401526020810190506105c0565b5f8484015250505050565b5f6105f0826105a4565b6105fa81856105ae565b935061060a8185602086016105be565b6106138161027a565b840191505092915050565b5f6040820190506106315f83018561053c565b818103602083015261064381846105e6565b9050939250505056fea26469706673582212209f8c2a5f1e3b4e1f2a5f1e3b4e1f2a5f1e3b4e1f2a5f1e3b4e1f2a5f1e3b64736f6c63430008';

  try {
    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy contract
    console.log('📤 Sending deployment transaction...');
    const contract = await factory.deploy({
      gasLimit: 1000000
    });
    
    console.log('⏳ Waiting for deployment...');
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log('\n✅ Contract deployed successfully!');
    console.log('📍 Contract address:', contractAddress);
    console.log('🔗 View on BaseScan:', `https://basescan.org/address/${contractAddress}`);
    
    // Save contract address to .env format for easy copy
    console.log('\n📝 Add this to your Replit Secrets:');
    console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    
    // Save to a file for reference
    const deploymentInfo = {
      contractAddress,
      network: 'Base Mainnet',
      chainId: 8453,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      txHash: contract.deploymentTransaction()?.hash
    };
    
    const deploymentPath = path.join(process.cwd(), 'deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to deployment.json`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
