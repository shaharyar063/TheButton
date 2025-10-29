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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="perspective-1000"
        >
          <Button
            onClick={onAddLinkClick}
            size="lg"
            className="relative h-16 px-8 text-lg font-bold shadow-2xl rounded-2xl"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(0)",
            }}
            data-testid="button-add-link"
          >
            <motion.div
              className="flex items-center gap-3"
              animate={{
                rotateY: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <LinkIcon className="w-6 h-6" />
              <span>Add Your Link</span>
            </motion.div>
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
