import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync, SyncStatus as SyncStatusType } from "@/lib/syncService";

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function SyncStatus({
  className = "",
  showDetails = false,
}: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatusType>({
    connected: false,
    lastSync: null,
    pendingChanges: 0,
    conflictCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { subscribeToStatus, forceSync, checkConnection } = useSync();

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = subscribeToStatus((newStatus) => {
      setStatus(newStatus);
    });

    // Initial connection check
    checkConnection();

    return unsubscribe;
  }, [subscribeToStatus, checkConnection]);

  const handleForceSync = async () => {
    setIsRefreshing(true);
    try {
      await forceSync();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return "Never";

    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff / 1000);

    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 10) return `${seconds}s ago`;
    return "Just now";
  };

  const getStatusIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (!status.connected) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }

    if (status.conflictCount > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }

    if (status.pendingChanges > 0) {
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isRefreshing) return "Syncing...";
    if (!status.connected) return "Offline";
    if (status.conflictCount > 0) return `${status.conflictCount} conflicts`;
    if (status.pendingChanges > 0) return `${status.pendingChanges} pending`;
    return "Synced";
  };

  const getStatusColor = () => {
    if (isRefreshing) return "text-blue-600";
    if (!status.connected) return "text-red-600";
    if (status.conflictCount > 0) return "text-yellow-600";
    if (status.pendingChanges > 0) return "text-blue-600";
    return "text-green-600";
  };

  if (showDetails) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Sync Status</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={isRefreshing}
            className="h-8"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {isRefreshing ? "Syncing..." : "Refresh"}
            </span>
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Connection</span>
            <div className="flex items-center gap-2">
              {status.connected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span
                className={status.connected ? "text-green-600" : "text-red-600"}
              >
                {status.connected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>Last Sync</span>
            <span className="text-gray-600">
              {formatLastSync(status.lastSync)}
            </span>
          </div>

          {status.pendingChanges > 0 && (
            <div className="flex items-center justify-between">
              <span>Pending Changes</span>
              <span className="text-blue-600">{status.pendingChanges}</span>
            </div>
          )}

          {status.conflictCount > 0 && (
            <div className="flex items-center justify-between">
              <span>Conflicts</span>
              <span className="text-yellow-600">{status.conflictCount}</span>
            </div>
          )}
        </div>

        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          💡 Changes sync automatically across all your devices in real-time
        </div>
      </div>
    );
  }

  // Compact version for header/navbar
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForceSync}
        disabled={isRefreshing}
        className="h-8 px-2"
        title={`Sync status: ${getStatusText()}`}
      >
        {getStatusIcon()}
        <span className={`ml-1 text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </Button>
    </div>
  );
}
