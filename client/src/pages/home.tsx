import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { RevealButton } from "@/components/reveal-button";
import { AddLinkModal } from "@/components/add-link-modal";
import { ActivitySlider } from "@/components/activity-slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3-context";
import { useFarcaster } from "@/lib/farcaster-context";
import type { Link, Click } from "@shared/schema";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { address } = useWeb3();
  const { user: farcasterUser } = useFarcaster();

  const { data: currentLink, isLoading: linkLoading } = useQuery<Link>({
    queryKey: ["/api/current-link"],
  });

  const { data: recentClicks = [], isLoading: clicksLoading } = useQuery<(Click & { link?: Link })[]>({
    queryKey: ["/api/recent-clicks"],
    refetchInterval: 5000,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAddLinkClick={() => setIsModalOpen(true)} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32 pt-12">
        <RevealButton
          onClick={handleRevealClick}
          isLoading={linkLoading}
          hasLink={!!currentLink}
        />
        
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
