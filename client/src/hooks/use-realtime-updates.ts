import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useRealtimeUpdates() {
  const intervalRef = useRef<number>();

  useEffect(() => {
    const pollForUpdates = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/current-link"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-clicks"] });
    };

    console.log("✅ Polling for updates every 5 seconds");
    intervalRef.current = window.setInterval(pollForUpdates, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
