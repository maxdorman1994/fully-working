import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export default function RefreshHelper() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Clear cache if service worker is available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
        console.log('🗑️ Cleared all caches');
      }

      // Force hard refresh
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      // Fallback to regular refresh
      window.location.reload();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span>
          {isOnline ? 'Online' : 'Offline'} • v2-hasura
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          Last: {formatTime(lastRefresh)}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 px-3 text-xs"
        >
          {isRefreshing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {isRefreshing ? 'Refreshing...' : 'Hard Refresh'}
        </Button>
      </div>
    </div>
  );
}
