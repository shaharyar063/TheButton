import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWeb3 } from "@/lib/web3-context";
import { Loader2, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const linkFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type LinkFormData = z.infer<typeof linkFormSchema>;

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLinkModal({ isOpen, onClose }: AddLinkModalProps) {
  const [isPaying, setIsPaying] = useState(false);
  const { toast } = useToast();
  const { address, isConnected, sendUSDCPayment } = useWeb3();

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      url: "",
    },
  });

  const submitLinkMutation = useMutation({
    mutationFn: async (data: { url: string; txHash: string; submittedBy: string }) => {
      return apiRequest("POST", "/api/links", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/current-link"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-clicks"] });
      toast({
        title: "Link submitted!",
        description: "Your link is now live and ready to be revealed.",
      });
      setIsPaying(false);
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
      setIsPaying(false);
    },
  });

  const handleSubmit = async (data: LinkFormData) => {

    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to submit a link",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPaying(true);

      toast({
        title: "Payment required",
        description: "Please approve the 1 USDC payment in your wallet...",
      });

      const txHash = await sendUSDCPayment("1");

      toast({
        title: "Transaction submitted",
        description: "Waiting for transaction confirmation...",
      });

      submitLinkMutation.mutate({
        url: data.url,
        txHash: txHash,
        submittedBy: address!,
      });
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-link">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Your Link</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-base font-medium">
              Destination URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              className="h-12 text-base"
              data-testid="input-url"
              {...form.register("url")}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-destructive" data-testid="error-url">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Required</span>
              <span className="text-lg font-bold flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                1 USDC
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              This payment ensures quality submissions and prevents spam
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isPaying || submitLinkMutation.isPending}
            data-testid="button-post-link"
          >
            {isPaying || submitLinkMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Post (1 USDC)
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you agree that your link will be publicly accessible
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
