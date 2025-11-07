import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useRealtimeUpdates() {
  const intervalRef = useRef<number>();

  useEffect(() => {
    const pollForUpdates = () => {
      queryClient.refetchQueries({ 
        queryKey: ["/api/current-link"],
        type: 'active'
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/recent-clicks"],
        type: 'active'
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/ownerships/current"],
        type: 'active'
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/total-clicks"],
        type: 'active'
      });
    };

    console.log("✅ Polling for updates every 5 seconds (silent background refresh)");
    intervalRef.current = window.setInterval(pollForUpdates, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
