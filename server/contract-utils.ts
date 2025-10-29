import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
const OWNER_WALLET = (process.env.OWNER_WALLET_ADDRESS || "0x31F02Ed2c900A157C851786B43772F86151C7E34").toLowerCase();
const REQUIRED_AMOUNT = BigInt(10000000000000);

export const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_MAINNET_RPC),
});

export interface TransactionVerification {
  isValid: boolean;
  error?: string;
  from?: string;
  to?: string;
  amount?: bigint;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTransactionWithRetry(
  txHash: `0x${string}`,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<{ receipt: any; transaction: any }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const [receipt, transaction] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: txHash }),
        publicClient.getTransaction({ hash: txHash }),
      ]);

      return { receipt, transaction };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message.toLowerCase();
      
      const isRetryableError = 
        errorMessage.includes("not found") ||
        errorMessage.includes("not available") ||
        errorMessage.includes("could not find") ||
        errorMessage.includes("transaction not found") ||
        errorMessage.includes("receipt not found");

      if (!isRetryableError || attempt === maxRetries - 1) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(1.5, attempt);
      console.log(`Transaction not found yet, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }

  throw lastError || new Error("Failed to fetch transaction after retries");
}

export async function verifyETHPayment(txHash: string): Promise<TransactionVerification> {
  try {
    if (!isValidTxHash(txHash)) {
      return { isValid: false, error: "Invalid transaction hash format" };
    }

    const { receipt, transaction } = await fetchTransactionWithRetry(txHash as `0x${string}`);

    if (receipt.status !== "success") {
      return { isValid: false, error: "Transaction failed on blockchain" };
    }

    const recipientAddress = transaction.to?.toLowerCase();
    const amount = transaction.value;

    if (recipientAddress !== OWNER_WALLET) {
      return { 
        isValid: false, 
        error: `Payment must be sent to ${OWNER_WALLET}, but was sent to ${recipientAddress}` 
      };
    }

    if (amount < REQUIRED_AMOUNT) {
      return { 
        isValid: false, 
        error: `Insufficient payment amount. Required: 0.00001 ETH, sent: ${Number(amount) / 1e18} ETH` 
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
    const errorMessage = error instanceof Error ? error.message : "Failed to verify transaction";
    
    if (errorMessage.toLowerCase().includes("not found")) {
      return { 
        isValid: false, 
        error: "Transaction not found on blockchain. Please verify the transaction hash and ensure it's confirmed on Base Mainnet." 
      };
    }
    
    return { 
      isValid: false, 
      error: errorMessage
    };
  }
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
