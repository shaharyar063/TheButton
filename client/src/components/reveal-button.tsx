import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevealButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  hasLink?: boolean;
}

export function RevealButton({ onClick, isLoading, hasLink }: RevealButtonProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          What's the Link?
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md">
          Click the button below to reveal the mystery destination
        </p>
      </div>

      <Button
        onClick={onClick}
        disabled={isLoading || !hasLink}
        size="lg"
        className={cn(
          "min-h-[120px] min-w-[280px] sm:min-w-[320px]",
          "rounded-2xl shadow-xl",
          "text-2xl font-semibold tracking-tight",
          "transition-all duration-150",
          "hover:shadow-2xl hover:scale-[1.02]",
          "active:scale-[0.98]"
        )}
        data-testid="button-reveal-link"
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : !hasLink ? (
          <span className="flex flex-col items-center gap-2">
            <span className="text-lg">No Link Yet</span>
            <span className="text-sm font-normal opacity-80">Be the first to add one!</span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            Reveal Link
            <ExternalLink className="w-6 h-6" />
          </span>
        )}
      </Button>

      {hasLink && (
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          This action is free. The link was submitted by a community member who paid 1 USDC.
        </p>
      )}
    </div>
  );
}
