import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkIcon, User, Wallet } from "lucide-react";
import { useWeb3 } from "@/lib/web3-context";
import { useFarcaster } from "@/lib/farcaster-context";
import { motion } from "framer-motion";

interface HeaderProps {
  onAddLinkClick: () => void;
}

export function Header({ onAddLinkClick }: HeaderProps) {
  const { address, isConnected, connect, isConnecting } = useWeb3();
  const { user: farcasterUser, isAuthenticated: isFarcasterAuth, signIn: farcasterSignIn, isInFrame } = useFarcaster();

  const showFarcasterAuth = !isInFrame;

  return (
    <header className="bg-background border-b border-border">
      <div className="h-20 px-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex-1" />

        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            onClick={onAddLinkClick}
            size="default"
            className="relative px-6 font-semibold shadow-lg rounded-xl"
            data-testid="button-add-link"
          >
            <LinkIcon className="w-5 h-5 mr-2" />
            <span>Add Your Link</span>
          </Button>
        </motion.div>

        <div className="flex-1 flex items-center justify-end gap-3">
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
