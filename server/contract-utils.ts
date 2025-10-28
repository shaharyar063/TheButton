import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const LINK_REVEAL_CONTRACT_ABI = parseAbi([
  "function submitLink(string calldata _url) external returns (bool)",
  "function getRequiredPayment() external pure returns (uint256)",
  "event LinkSubmitted(address indexed submitter, string url, uint256 timestamp)",
]);

const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const OWNER_WALLET = process.env.OWNER_WALLET_ADDRESS || "0x31F02Ed2c900A157C851786B43772F86151C7E34";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
});

export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function verifyTransaction(txHash: string): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    return receipt.status === "success";
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return false;
  }
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
