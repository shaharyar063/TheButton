import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import type { Link, Click } from "@shared/schema";

export function useRealtimeUpdates() {
  const reconnectTimeoutRef = useRef<number>();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isIntentionallyClosed = false;

    const connect = () => {
      if (isIntentionallyClosed) return;

      eventSource = new EventSource("/api/events");

      eventSource.addEventListener("link:created", (event) => {
        const link = JSON.parse(event.data) as Link;
        queryClient.setQueryData(["/api/current-link"], link);
        console.log("✨ Real-time: New link created");
      });

      eventSource.addEventListener("click:created", () => {
        queryClient.invalidateQueries({ queryKey: ["/api/recent-clicks"] });
        console.log("✨ Real-time: New click created");
      });

      eventSource.onerror = () => {
        eventSource?.close();
        
        if (!isIntentionallyClosed) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log("🔄 Reconnecting to real-time updates...");
            connect();
          }, 3000);
        }
      };

      eventSource.onopen = () => {
        console.log("✅ Real-time updates connected");
      };
    };

    connect();

    return () => {
      isIntentionallyClosed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      eventSource?.close();
    };
  }, []);
}
