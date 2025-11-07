import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import { useQuery } from "@tanstack/react-query";

interface RevealButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  hasLink?: boolean;
  buttonColor?: string | null;
  buttonEmoji?: string | null;
  buttonImageUrl?: string | null;
}

export function RevealButton({ onClick, isLoading, hasLink, buttonColor, buttonEmoji, buttonImageUrl }: RevealButtonProps) {
  const defaultColor = "#3b82f6";
  const effectiveColor = buttonColor || defaultColor;
  
  const totalClicksQuery = useQuery<{ count: number }>({
    queryKey: ["/api/total-clicks"],
  });
  const totalClicks = totalClicksQuery.data?.count || 0;
  
  const darkenColor = (color: string, amount: number = 40) => {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };
  
  const shadowColor = darkenColor(effectiveColor);
  return (
    <div className="flex flex-col items-center gap-8">
      <AnimatedCounter value={totalClicks} />

      <button
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          "relative w-64 h-64 sm:w-80 sm:h-80 rounded-full",
          "transition-all duration-100 ease-linear",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        )}
        style={{
          background: buttonImageUrl 
            ? `url(${buttonImageUrl}) center/cover`
            : `linear-gradient(145deg, ${effectiveColor}dd, ${effectiveColor})`,
          boxShadow: `
            inset 0px 2px 0px rgba(255, 255, 255, 0.4),
            0px 12px 0px ${shadowColor},
            0px 16px 24px rgba(0, 0, 0, 0.4)
          `,
          transform: "translateY(0px)",
        }}
        onMouseDown={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = "translateY(8px)";
            e.currentTarget.style.boxShadow = `
              inset 0px 4px 12px rgba(0, 0, 0, 0.5),
              inset 0px -2px 0px rgba(255, 255, 255, 0.1),
              0px 4px 0px ${shadowColor},
              0px 8px 12px rgba(0, 0, 0, 0.3)
            `;
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = `
            inset 0px 2px 0px rgba(255, 255, 255, 0.4),
            0px 12px 0px ${shadowColor},
            0px 16px 24px rgba(0, 0, 0, 0.4)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = `
            inset 0px 2px 0px rgba(255, 255, 255, 0.4),
            0px 12px 0px ${shadowColor},
            0px 16px 24px rgba(0, 0, 0, 0.4)
          `;
        }}
        data-testid="button-reveal-link"
      >
        <div className="relative flex flex-col items-center justify-center h-full text-white select-none">
          {isLoading ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : !hasLink ? (
            <div className="flex flex-col items-center gap-2 px-6">
              <span className="text-xl sm:text-2xl font-semibold">No Link Yet</span>
              <span className="text-sm font-normal opacity-90">Be the first!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {buttonEmoji ? (
                <span className="text-6xl sm:text-7xl">{buttonEmoji}</span>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-bold">Reveal Link</span>
                  <ExternalLink className="w-8 h-8" />
                </>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
