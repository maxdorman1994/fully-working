import React, { useState, useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { getEntryStats } from "@/lib/journalCommentsService";

interface JournalEntryStatsProps {
  entryId: string;
  className?: string;
}

export default function JournalEntryStats({
  entryId,
  className = "",
}: JournalEntryStatsProps) {
  const [stats, setStats] = useState({ commentCount: 0, likeCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const entryStats = await getEntryStats(entryId);
        setStats(entryStats);
      } catch (error) {
        console.error("Error loading entry stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [entryId]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-3 text-sm text-gray-500 ${className}`}
      >
        <div className="animate-pulse flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>-</span>
        </div>
        <div className="animate-pulse flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          <span>-</span>
        </div>
      </div>
    );
  }

  // Don't show if no likes or comments
  if (stats.likeCount === 0 && stats.commentCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {stats.likeCount > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <Heart className="h-4 w-4 fill-current" />
          <span className="font-medium">{stats.likeCount}</span>
        </div>
      )}
      {stats.commentCount > 0 && (
        <div className="flex items-center gap-1 text-blue-600">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">{stats.commentCount}</span>
        </div>
      )}
    </div>
  );
}
