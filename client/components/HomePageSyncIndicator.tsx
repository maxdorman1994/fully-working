import React, { useState, useEffect } from "react";
import { RefreshCw, Wifi, WifiOff, CheckCircle } from "lucide-react";
import { subscribeToHomePageSync } from "@/lib/homePageSyncService";

interface SyncIndicatorProps {
  className?: string;
}

export default function HomePageSyncIndicator({
  className = "",
}: SyncIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncActivity, setSyncActivity] = useState<string | null>(null);

  useEffect(() => {
    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to sync events
    const unsubscribeSync = subscribeToHomePageSync((data) => {
      setLastSyncTime(new Date());

      // Show what synced
      if (data.family_members) {
        setSyncActivity("Family photos synced");
      } else if (data.stats) {
        setSyncActivity("Adventure stats synced");
      } else if (data.recent_adventures) {
        setSyncActivity("Recent adventures synced");
      } else if (data.milestones) {
        setSyncActivity("Milestones synced");
      }

      // Clear activity message after 3 seconds
      setTimeout(() => setSyncActivity(null), 3000);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribeSync();
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes === 0) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Connection Status */}
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}

      {/* Sync Activity */}
      {syncActivity ? (
        <div className="flex items-center gap-1 text-blue-600">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span className="text-xs">{syncActivity}</span>
        </div>
      ) : lastSyncTime ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Synced {formatTime(lastSyncTime)}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-500">
          {isOnline ? "Waiting for sync..." : "Offline"}
        </span>
      )}
    </div>
  );
}
