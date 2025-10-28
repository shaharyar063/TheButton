import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendUSDCPayment: (amount: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        })
        .catch(console.error);

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts.length > 0 ? accounts[0] : null);
      });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const baseSepoliaChainId = "0x14a34";

      if (chainId !== baseSepoliaChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: baseSepoliaChainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: baseSepoliaChainId,
                  chainName: "Base Sepolia",
                  rpcUrls: ["https://sepolia.base.org"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.basescan.org"],
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

  const sendUSDCPayment = async (amount: string): Promise<string> => {
    if (!window.ethereum || !address) {
      throw new Error("Wallet not connected");
    }

    const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const ownerAddress = import.meta.env.VITE_OWNER_WALLET_ADDRESS || "0x31F02Ed2c900A157C851786B43772F86151C7E34";
    
    const amountInWei = (parseFloat(amount) * 1000000).toString(16);

    const data = `0xa9059cbb${ownerAddress.slice(2).padStart(64, "0")}${amountInWei.padStart(64, "0")}`;

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: address,
          to: usdcAddress,
          data: data,
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
        sendUSDCPayment,
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
