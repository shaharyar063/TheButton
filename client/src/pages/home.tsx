import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { RevealButton } from "@/components/reveal-button";
import { AddLinkModal } from "@/components/add-link-modal";
import { ActivitySlider } from "@/components/activity-slider";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3-context";
import type { Link, Click } from "@shared/schema";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { address } = useWeb3();

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
      
      <main className="flex-1 flex items-center justify-center px-4 pb-32">
        <RevealButton
          onClick={handleRevealClick}
          isLoading={linkLoading}
          hasLink={!!currentLink}
        />
      </main>

      <ActivitySlider clicks={recentClicks} isLoading={clicksLoading} />

      <AddLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
