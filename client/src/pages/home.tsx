import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { RevealButton } from "@/components/reveal-button";
import { AddLinkModal } from "@/components/add-link-modal";
import { ActivitySlider } from "@/components/activity-slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3-context";
import { useFarcaster } from "@/lib/farcaster-context";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";
import type { Link, Click } from "@shared/schema";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { address } = useWeb3();
  const { user: farcasterUser } = useFarcaster();

  useRealtimeUpdates();

  const { data: currentLink, isLoading: linkLoading } = useQuery<Link>({
    queryKey: ["/api/current-link"],
  });

  const { data: recentClicks = [], isLoading: clicksLoading } = useQuery<(Click & { link?: Link })[]>({
    queryKey: ["/api/recent-clicks"],
  });

  const recordClickMutation = useMutation({
    mutationFn: async () => {
      if (!currentLink) throw new Error("No link available");
      return apiRequest("POST", "/api/clicks", {
        linkId: currentLink.id,
        clickedBy: address || "anonymous",
        clickerUsername: farcasterUser?.username || null,
        clickerPfpUrl: farcasterUser?.pfpUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-clicks"] });
    },
  });

  const handleRevealClick = () => {
    if (!currentLink) {
      toast({
        title: "No link available",
        description: "Be the first to add a link!",
        variant: "destructive",
      });
      return;
    }

    recordClickMutation.mutate();

    toast({
      title: "Redirecting...",
      description: "Opening the mystery link",
    });

    setTimeout(() => {
      window.open(currentLink.url, "_blank", "noopener,noreferrer");
    }, 500);
  };

  const handleShareToFarcaster = () => {
    const timestamp = Date.now();
    const frameUrl = `${window.location.origin}/frame?v=${timestamp}`;
    const castText = "Click the mystery button to reveal the link! 🔮";
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
    window.open(warpcastUrl, "_blank", "noopener,noreferrer");
    
    toast({
      title: "Opening Warpcast",
      description: "Share your Frame to Farcaster!",
    });
  };

  const handleCopyFrameLink = async () => {
    const timestamp = Date.now();
    const frameUrl = `${window.location.origin}/frame?v=${timestamp}`;
    try {
      await navigator.clipboard.writeText(frameUrl);
      toast({
        title: "Copied!",
        description: "Frame link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually: " + frameUrl,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAddLinkClick={() => setIsModalOpen(true)} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32 pt-12">
        <RevealButton
          onClick={handleRevealClick}
          isLoading={linkLoading}
          hasLink={!!currentLink}
        />
        
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
            Share this button as a Farcaster Frame! Anyone who clicks it will see the current mystery link.
          </p>
        </div>
        
        {currentLink && (currentLink.submitterUsername || currentLink.submitterPfpUrl) && (
          <div className="mt-8 flex items-center gap-3 text-muted-foreground" data-testid="section-promoted-by">
            <span className="text-sm">This link is promoted by</span>
            <a
              href={currentLink.submitterUsername ? `https://warpcast.com/${currentLink.submitterUsername}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-3 py-2 transition-all"
              data-testid="link-promoter-profile"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentLink.submitterPfpUrl || undefined} alt={currentLink.submitterUsername || 'Promoter'} />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
                @{currentLink.submitterUsername || 'Anonymous'}
              </span>
            </a>
          </div>
        )}
      </main>

      <ActivitySlider clicks={recentClicks} isLoading={clicksLoading} />

      <AddLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
