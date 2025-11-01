import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { RevealButton } from "@/components/reveal-button";
import { ActivitySlider } from "@/components/activity-slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Share2, Copy, Clock, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3-context";
import { useFarcaster } from "@/lib/farcaster-context";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";
import type { Link, Click, ButtonOwnership } from "@shared/schema";

type ActiveOwnership = ButtonOwnership & { link?: Link; remainingSeconds?: number };

export default function Home() {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const { toast } = useToast();
  const { address, isConnected, sendETHPayment } = useWeb3();
  const { user: farcasterUser, walletAddress: farcasterWallet } = useFarcaster();

  useRealtimeUpdates();

  const { data: ownership, isLoading: ownershipLoading } = useQuery<ActiveOwnership>({
    queryKey: ["/api/ownerships/current"],
    retry: false,
  });

  const { data: recentClicks = [], isLoading: clicksLoading } = useQuery<(Click & { link?: Link })[]>({
    queryKey: ["/api/recent-clicks"],
  });

  const { data: baseUrlData } = useQuery<{ baseUrl: string }>({
    queryKey: ["/api/base-url"],
  });

  const effectiveAddress = address || farcasterWallet;
  const isOwner = ownership && effectiveAddress && ownership.ownerAddress.toLowerCase() === effectiveAddress.toLowerCase();

  const recordClickMutation = useMutation({
    mutationFn: async () => {
      if (!ownership?.link) throw new Error("No link available");
      return apiRequest("POST", "/api/clicks", {
        linkId: ownership.link.id,
        clickedBy: effectiveAddress || "anonymous",
        clickerUsername: farcasterUser?.username || null,
        clickerPfpUrl: farcasterUser?.pfpUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-clicks"] });
    },
  });

  useEffect(() => {
    if (ownership) {
      const remaining = ownership.remainingSeconds ?? Math.max(0, Math.floor((new Date(ownership.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingTime(remaining);
      
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            queryClient.invalidateQueries({ queryKey: ["/api/ownerships/current"] });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [ownership]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const buyOwnershipMutation = useMutation({
    mutationFn: async (txHash: string) => {
      return apiRequest("POST", "/api/ownerships", {
        ownerAddress: effectiveAddress,
        txHash,
        durationSeconds: 3600,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ownerships/current"] });
      toast({
        title: "Ownership purchased!",
        description: "You now control the button for 1 hour.",
      });
      setIsBuyModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editLinkMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!ownership) throw new Error("No ownership");
      return apiRequest("PATCH", `/api/ownerships/${ownership.id}/link`, {
        ownerAddress: effectiveAddress,
        url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ownerships/current"] });
      toast({
        title: "Link updated!",
        description: "Your link has been saved.",
      });
      setIsEditModalOpen(false);
      setEditUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuyOwnership = async () => {
    if (!effectiveAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy ownership",
        variant: "destructive",
      });
      return;
    }

    if (!sendETHPayment) {
      toast({
        title: "Wallet provider unavailable",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Payment required",
        description: "Please approve the 0.00001 ETH payment...",
      });

      const txHash = await sendETHPayment("0.00001", effectiveAddress);
      
      toast({
        title: "Transaction submitted",
        description: "Waiting for confirmation...",
      });

      buyOwnershipMutation.mutate(txHash);
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRevealClick = async () => {
    if (isRevealing) return;
    
    if (!ownership?.link) {
      toast({
        title: "No link available",
        description: isOwner ? "Set your link first!" : "No one has set a link yet.",
        variant: "destructive",
      });
      return;
    }

    setIsRevealing(true);
    try {
      await recordClickMutation.mutateAsync();

      toast({
        title: "Redirecting...",
        description: "Opening the mystery link",
      });

      window.open(ownership.link.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Failed to record click",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsRevealing(false), 2000);
    }
  };

  const handleShareToFarcaster = () => {
    const baseUrl = baseUrlData?.baseUrl || window.location.origin;
    const timestamp = Date.now();
    const frameUrl = `${baseUrl}/frame?v=${timestamp}`;
    const castText = "Click the mystery button to reveal the link! 🔮";
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
    window.open(warpcastUrl, "_blank", "noopener,noreferrer");
    
    toast({
      title: "Opening Warpcast",
      description: "Share your Frame to Farcaster!",
    });
  };

  const handleCopyFrameLink = async () => {
    const baseUrl = baseUrlData?.baseUrl || window.location.origin;
    const timestamp = Date.now();
    const frameUrl = `${baseUrl}/frame?v=${timestamp}`;
    try {
      await navigator.clipboard.writeText(frameUrl);
      toast({
        title: "Copied!",
        description: "Frame link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAddLinkClick={() => isOwner ? setIsEditModalOpen(true) : setIsBuyModalOpen(true)} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32 pt-12">
        <RevealButton
          onClick={handleRevealClick}
          isLoading={ownershipLoading || recordClickMutation.isPending || isRevealing}
          hasLink={!!ownership?.link}
        />
        
        {ownership && remainingTime !== null && remainingTime > 0 && (
          <Card className="mt-6 max-w-md w-full" data-testid="card-ownership-info">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {isOwner ? "You own this button" : "Current Owner"}
              </CardTitle>
              <CardDescription>
                {isOwner ? "Edit your link anytime during your ownership" : `Owned by ${ownership.ownerAddress.slice(0, 6)}...${ownership.ownerAddress.slice(-4)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time remaining:</span>
                <span className="text-lg font-mono font-semibold" data-testid="text-countdown">{formatTime(remainingTime)}</span>
              </div>
              {isOwner && (
                <Button
                  onClick={() => {
                    setEditUrl(ownership.link?.url || "");
                    setIsEditModalOpen(true);
                  }}
                  variant="default"
                  size="sm"
                  className="w-full gap-2"
                  data-testid="button-edit-link"
                >
                  <Edit className="w-4 h-4" />
                  {ownership.link ? "Edit Link" : "Set Link"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!ownership && !ownershipLoading && (
          <Card className="mt-6 max-w-md w-full" data-testid="card-no-ownership">
            <CardHeader>
              <CardTitle>Own the Button</CardTitle>
              <CardDescription>
                Control the mystery link for 1 hour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsBuyModalOpen(true)}
                variant="default"
                size="lg"
                className="w-full"
                data-testid="button-buy-ownership"
              >
                Buy for 0.00001 ETH (1 hour)
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex gap-3">
            <Button
              onClick={handleShareToFarcaster}
              variant="default"
              size="default"
              className="gap-2"
              data-testid="button-share-farcaster"
            >
              <Share2 className="w-4 h-4" />
              Share to Farcaster
            </Button>
            <Button
              onClick={handleCopyFrameLink}
              variant="outline"
              size="default"
              className="gap-2"
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4" />
              Copy Frame Link
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Share this button as a Farcaster Frame!
          </p>
        </div>
      </main>

      <ActivitySlider clicks={recentClicks} isLoading={clicksLoading} />

      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-buy-ownership">
          <DialogHeader>
            <DialogTitle>Buy Button Ownership</DialogTitle>
            <DialogDescription>
              Control the mystery link for 1 hour
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-semibold">1 hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className="font-semibold">0.00001 ETH</span>
              </div>
            </div>
            <Button
              onClick={handleBuyOwnership}
              disabled={buyOwnershipMutation.isPending}
              className="w-full"
              data-testid="button-confirm-buy"
            >
              {buyOwnershipMutation.isPending ? "Processing..." : "Purchase Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-edit-link">
          <DialogHeader>
            <DialogTitle>Edit Your Link</DialogTitle>
            <DialogDescription>
              Set the mystery link for your ownership period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-url">Link URL</Label>
              <Input
                id="edit-url"
                type="url"
                placeholder="https://example.com"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                data-testid="input-edit-url"
              />
            </div>
            <Button
              onClick={() => editLinkMutation.mutate(editUrl)}
              disabled={!editUrl || editLinkMutation.isPending}
              className="w-full"
              data-testid="button-confirm-edit"
            >
              {editLinkMutation.isPending ? "Saving..." : "Save Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
