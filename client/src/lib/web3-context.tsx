import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import sdk from "@farcaster/frame-sdk";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendETHPayment: (amount: string, fromAddress?: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  const getProvider = () => {
    try {
      const farcasterProvider = sdk.wallet?.ethProvider;
      if (farcasterProvider) {
        return farcasterProvider;
      }
    } catch (error) {
      console.log("Farcaster provider not available, using window.ethereum");
    }
    return window.ethereum;
  };

  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdk.context;
        setIsSDKReady(true);
      } catch (error) {
        setIsSDKReady(true);
      }
    };
    
    initSDK();
  }, []);

  useEffect(() => {
    if (!isSDKReady) return;

    const initializeProvider = async () => {
      const provider = getProvider();
      if (provider) {
        try {
          const accounts = await provider.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Failed to get accounts:", error);
        }

        provider.on?.("accountsChanged", (accounts: string[]) => {
          setAddress(accounts.length > 0 ? accounts[0] : null);
        });
      }
    };

    if (typeof window !== "undefined") {
      initializeProvider();
    }
  }, [isSDKReady]);

  const connect = async () => {
    const provider = getProvider();
    if (!provider) {
      throw new Error("No wallet provider available. Please install MetaMask or use Farcaster.");
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);

      const chainId = await provider.request({ method: "eth_chainId" });
      const baseMainnetChainId = "0x2105";

      if (chainId !== baseMainnetChainId) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: baseMainnetChainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: baseMainnetChainId,
                  chainName: "Base",
                  rpcUrls: ["https://mainnet.base.org"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://basescan.org"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  const sendETHPayment = async (amount: string, fromAddress?: string): Promise<string> => {
    const provider = getProvider();
    const effectiveAddress = fromAddress || address;
    
    if (!provider || !effectiveAddress) {
      throw new Error("Wallet not connected");
    }

    const ownerAddress = import.meta.env.VITE_OWNER_WALLET_ADDRESS || "0x31F02Ed2c900A157C851786B43772F86151C7E34";
    
    const WEI_PER_ETH = BigInt("1000000000000000000");
    const [whole, decimal] = amount.split('.');
    const wholePart = BigInt(whole || '0');
    const decimalPart = decimal ? decimal.padEnd(18, '0').slice(0, 18) : '0'.repeat(18);
    const amountInWei = (wholePart * WEI_PER_ETH + BigInt(decimalPart)).toString(16);

    const txHash = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: effectiveAddress,
          to: ownerAddress,
          value: `0x${amountInWei}`,
        },
      ],
    });

    return txHash;
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
        sendETHPayment,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider");
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
