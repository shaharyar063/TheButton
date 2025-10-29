import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MousePointerClick } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Click, Link } from "@shared/schema";

interface ActivitySliderProps {
  clicks: (Click & { link?: Link })[];
  isLoading?: boolean;
}

function truncateAddress(address: string | null): string {
  if (!address) return "Anonymous";
  if (address === "anonymous") return "Anonymous";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ActivitySlider({ clicks, isLoading }: ActivitySliderProps) {
  if (isLoading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-card border-t border-border">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (clicks.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-card border-t border-border">
        <div className="flex items-center justify-center h-full px-6">
          <div className="text-center">
            <MousePointerClick className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No clicks yet. Be the first!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-card border-t border-border overflow-hidden">
      <div className="h-full overflow-x-auto overflow-y-hidden px-6 py-4">
        <div className="flex gap-4 h-full" data-testid="activity-feed">
          {clicks.map((click) => {
            const hasUsername = click.clickerUsername;
            const displayName = hasUsername ? `@${click.clickerUsername}` : truncateAddress(click.clickedBy);
            const profileUrl = hasUsername ? `https://warpcast.com/${click.clickerUsername}` : '#';
            
            const CardContent = (
              <>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {click.clickerPfpUrl && (
                    <AvatarImage src={click.clickerPfpUrl} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-4 h-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${hasUsername ? '' : 'font-mono'}`} data-testid={`text-clicker-${click.id}`}>
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-timestamp-${click.id}`}>
                    {formatDistanceToNow(new Date(click.clickedAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <MousePointerClick className="w-4 h-4 text-primary" />
                </div>
              </>
            );

            if (hasUsername) {
              return (
                <a
                  key={click.id}
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid={`link-clicker-profile-${click.id}`}
                >
                  <Card
                    className="min-w-[240px] px-4 py-3 flex items-center gap-3 shadow-sm hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`activity-card-${click.id}`}
                  >
                    {CardContent}
                  </Card>
                </a>
              );
            }

            return (
              <Card
                key={click.id}
                className="min-w-[240px] px-4 py-3 flex items-center gap-3 shadow-sm"
                data-testid={`activity-card-${click.id}`}
              >
                {CardContent}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
