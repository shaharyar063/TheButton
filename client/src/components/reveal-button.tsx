import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RevealButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  hasLink?: boolean;
}

export function RevealButton({ onClick, isLoading, hasLink }: RevealButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
        What's the Link?
      </h2>

      <button
        onClick={handleClick}
        disabled={isLoading || !hasLink}
        className={cn(
          "relative w-64 h-64 sm:w-80 sm:h-80 rounded-full",
          "transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-4 focus:ring-primary/20",
          isPressed ? "scale-95" : "scale-100"
        )}
        style={{
          background: isPressed
            ? "linear-gradient(145deg, #2563eb, #1d4ed8)"
            : "linear-gradient(145deg, #3b82f6, #2563eb)",
          boxShadow: isPressed
            ? "inset 8px 8px 16px #1e40af, inset -8px -8px 16px #60a5fa"
            : "12px 12px 24px #1e3a8a, -12px -12px 24px #60a5fa",
        }}
        data-testid="button-reveal-link"
      >
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1/2"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))",
            }}
          />
        </div>

        <div className="relative flex flex-col items-center justify-center h-full text-white">
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
