import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, User, Wallet } from "lucide-react";
import { useWeb3 } from "@/lib/web3-context";
import { useFarcaster } from "@/lib/farcaster-context";

interface HeaderProps {
  onAddLinkClick: () => void;
}

export function Header({ onAddLinkClick }: HeaderProps) {
  const { address, isConnected, connect, isConnecting } = useWeb3();
  const { user: farcasterUser, isAuthenticated: isFarcasterAuth, signIn: farcasterSignIn, isInFrame } = useFarcaster();

  const showFarcasterAuth = !isInFrame;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Link Reveal</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onAddLinkClick}
            variant="default"
            size="default"
            className="gap-2"
            data-testid="button-add-link"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Link</span>
          </Button>

          {isFarcasterAuth ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm font-medium text-foreground" data-testid="text-farcaster-username">
                @{farcasterUser?.username || `fid:${farcasterUser?.fid}`}
              </span>
              <Avatar className="w-10 h-10" data-testid="avatar-farcaster">
                <AvatarImage src={farcasterUser?.pfpUrl} alt={farcasterUser?.username} />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </AvatarFallback>
              </Avatar>
            </div>
          ) : null}

          {!isInFrame && !isFarcasterAuth && (
            <>
              {!isConnected ? (
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  variant="ghost"
                  size="default"
                  className="gap-2"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">{isConnecting ? "Connecting..." : "Wallet"}</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm font-mono text-muted-foreground" data-testid="text-wallet-address">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <Avatar className="w-9 h-9" data-testid="avatar-wallet">
                    <AvatarFallback className="bg-muted">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
