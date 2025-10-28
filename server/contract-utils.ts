import { createPublicClient, http, parseAbi, decodeAbiParameters } from "viem";
import { baseSepolia } from "viem/chains";

const USDC_ABI = parseAbi([
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const OWNER_WALLET = (process.env.OWNER_WALLET_ADDRESS || "0x31F02Ed2c900A157C851786B43772F86151C7E34").toLowerCase();
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e".toLowerCase();
const REQUIRED_AMOUNT = BigInt(1000000);

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
});

export interface TransactionVerification {
  isValid: boolean;
  error?: string;
  from?: string;
  to?: string;
  amount?: bigint;
}

export async function verifyUSDCPayment(txHash: string): Promise<TransactionVerification> {
  try {
    if (!isValidTxHash(txHash)) {
      return { isValid: false, error: "Invalid transaction hash format" };
    }

    const [receipt, transaction] = await Promise.all([
      publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` }),
      publicClient.getTransaction({ hash: txHash as `0x${string}` }),
    ]);

    if (receipt.status !== "success") {
      return { isValid: false, error: "Transaction failed on blockchain" };
    }

    if (transaction.to?.toLowerCase() !== USDC_ADDRESS) {
      return { isValid: false, error: "Transaction is not to USDC contract" };
    }

    if (!transaction.input || transaction.input.length < 10) {
      return { isValid: false, error: "Invalid transaction data" };
    }

    const functionSelector = transaction.input.slice(0, 10);
    const transferSelector = "0xa9059cbb";

    if (functionSelector !== transferSelector) {
      return { isValid: false, error: "Transaction is not a USDC transfer" };
    }

    const params = `0x${transaction.input.slice(10)}`;
    const decoded = decodeAbiParameters(
      [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      params as `0x${string}`
    );

    const recipientAddress = decoded[0].toLowerCase();
    const amount = decoded[1];

    if (recipientAddress !== OWNER_WALLET) {
      return { 
        isValid: false, 
        error: `Payment must be sent to ${OWNER_WALLET}, but was sent to ${recipientAddress}` 
      };
    }

    if (amount < REQUIRED_AMOUNT) {
      return { 
        isValid: false, 
        error: `Insufficient payment amount. Required: 1 USDC, sent: ${Number(amount) / 1000000} USDC` 
      };
    }

    return {
      isValid: true,
      from: transaction.from,
      to: recipientAddress,
      amount,
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : "Failed to verify transaction" 
    };
  }
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
