import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevealButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  hasLink?: boolean;
}

export function RevealButton({ onClick, isLoading, hasLink }: RevealButtonProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
        What's the Link?
      </h2>

      <button
        onClick={onClick}
        disabled={isLoading || !hasLink}
        className={cn(
          "relative w-64 h-64 sm:w-80 sm:h-80 rounded-full",
          "transition-all duration-100 ease-linear",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        )}
        style={{
          background: "linear-gradient(145deg, #60a5fa, #3b82f6)",
          boxShadow: `
            inset 0px 2px 0px rgba(255, 255, 255, 0.4),
            0px 12px 0px #1e40af,
            0px 16px 24px rgba(0, 0, 0, 0.4)
          `,
          transform: "translateY(0px)",
        }}
        onMouseDown={(e) => {
          if (!isLoading && hasLink) {
            e.currentTarget.style.transform = "translateY(8px)";
            e.currentTarget.style.boxShadow = `
              inset 0px 4px 12px rgba(0, 0, 0, 0.5),
              inset 0px -2px 0px rgba(255, 255, 255, 0.1),
              0px 4px 0px #1e40af,
              0px 8px 12px rgba(0, 0, 0, 0.3)
            `;
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = `
            inset 0px 2px 0px rgba(255, 255, 255, 0.4),
            0px 12px 0px #1e40af,
            0px 16px 24px rgba(0, 0, 0, 0.4)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = `
            inset 0px 2px 0px rgba(255, 255, 255, 0.4),
            0px 12px 0px #1e40af,
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
              <span className="text-2xl sm:text-3xl font-bold">Reveal Link</span>
              <ExternalLink className="w-8 h-8" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
