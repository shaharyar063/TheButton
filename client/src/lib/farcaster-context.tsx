import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import sdk from "@farcaster/frame-sdk";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInFrame: boolean;
  frameContext: any;
  walletAddress: string | null;
  signIn: () => void;
  signOut: () => void;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInFrame, setIsInFrame] = useState(false);
  const [frameContext, setFrameContext] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const initFrame = async () => {
      try {
        const context = await sdk.context;
        setIsInFrame(true);
        setFrameContext(context);

        if (context.user) {
          setUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
          
          try {
            const provider = sdk.wallet?.ethProvider;
            if (provider) {
              const accounts = await provider.request({ method: "eth_accounts" });
              if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
              }
            }
          } catch (error) {
            console.error("Failed to get Farcaster wallet address:", error);
          }
        }

        sdk.actions.ready();
      } catch (error) {
        setIsInFrame(false);
      } finally {
        setIsLoading(false);
      }
    };

    initFrame();
  }, []);

  const signIn = () => {
    console.warn("Standalone Farcaster sign-in is not yet implemented. This app works best as a Farcaster Frame.");
  };

  const signOut = () => {
    setUser(null);
    setWalletAddress(null);
  };

  return (
    <FarcasterContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInFrame,
        frameContext,
        walletAddress,
        signIn,
        signOut,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error("useFarcaster must be used within FarcasterProvider");
  }
  return context;
}
