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
  signIn: () => void;
  signOut: () => void;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInFrame, setIsInFrame] = useState(false);
  const [frameContext, setFrameContext] = useState<any>(null);

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
  };

  return (
    <FarcasterContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInFrame,
        frameContext,
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
