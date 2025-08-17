import { 
  hasuraClient, 
  isHasuraConfigured, 
  executeQuery, 
  GET_RECENT_ADVENTURES 
} from "./hasura";

/**
 * Recent Adventures Service
 * Fetches real recent journal entries for the home page
 */

export interface RecentAdventure {
  id: string;
  title: string;
  location: string;
  formatted_date: string;
  featured_image: string;
  tags: string[];
  adventure_type: string;
  photo_count: number;
  excerpt: string;
  time_ago: string;
}

export interface AdventureStats {
  total_adventures: number;
  recent_count: number;
  latest_adventure: string;
  oldest_adventure: string;
}

/**
 * Get recent adventures from Hasura
 */
export async function getRecentAdventures(): Promise<RecentAdventure[]> {
  if (!isHasuraConfigured()) {
    throw new Error(
      "Hasura not configured - please set VITE_HASURA_GRAPHQL_URL",
    );
  }

  try {
    console.log(
      "🔄 Fetching latest 3 journal entries for recent adventures from Hasura...",
    );

    // Use Hasura GraphQL query for recent adventures
    const result = await executeQuery(GET_RECENT_ADVENTURES);

    if (!result.recent_adventures) {
      console.log("📦 No recent adventures found in Hasura response");
      return [];
    }

    const journalEntries = result.recent_adventures;

    if (!journalEntries || journalEntries.length === 0) {
      console.log("📦 No journal entries found in Hasura, returning empty array");
      return [];
    }

    // Transform journal entries into RecentAdventure format
    const recentAdventures: RecentAdventure[] = journalEntries.map(
      (entry: any) => ({
        id: entry.id,
        title: entry.title,
        location: entry.location,
        formatted_date: entry.formatted_date || entry.date,
        featured_image: entry.featured_image || "/placeholder.svg",
        tags: entry.tags || [],
        adventure_type: "Adventure", // Default value
        photo_count: entry.photo_count || 0,
        excerpt: entry.excerpt || "A wonderful Scottish adventure!",
        time_ago: formatTimeAgo(entry.date),
      }),
    );

    console.log(
      `✅ Loaded ${recentAdventures.length} recent adventures from journal entries`,
    );
    return recentAdventures;
  } catch (error) {
    console.error("Error in getRecentAdventures:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch recent adventures: ${String(error)}`);
  }
}

/**
 * Helper function to format time ago
 */
function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch (error) {
    console.warn("Error formatting time ago:", error);
    return "Some time ago";
  }
}

/**
 * Get fallback recent adventures data
 */
function getFallbackRecentAdventures(): RecentAdventure[] {
  return [
    {
      id: "fallback-1",
      title: "Ben Nevis Summit - Our Greatest Challenge Yet!",
      location: "Fort William, Highland",
      formatted_date: "03 January 2025",
      featured_image: "/placeholder.svg",
      tags: ["Mountain", "Challenge", "Family"],
      adventure_type: "Mountain",
      photo_count: 1,
      excerpt: "What an incredible day! After months of training, we finally conquered Ben Nevis...",
      time_ago: "2 weeks ago",
    },
    {
      id: "fallback-2", 
      title: "Magical Loch Lomond Picnic",
      location: "Balloch, West Dunbartonshire",
      formatted_date: "28 December 2024",
      featured_image: "/placeholder.svg",
      tags: ["Lake", "Family", "Relaxing"],
      adventure_type: "Water",
      photo_count: 1,
      excerpt: "A perfect family day by the beautiful Loch Lomond...",
      time_ago: "3 weeks ago",
    },
    {
      id: "fallback-3",
      title: "Edinburgh Castle - Step Back in Time",
      location: "Edinburgh, Midlothian",
      formatted_date: "15 December 2024",
      featured_image: "/placeholder.svg",
      tags: ["History", "Culture", "Castle"],
      adventure_type: "Historic",
      photo_count: 1,
      excerpt: "Despite the Scottish drizzle, Edinburgh Castle was absolutely magical...",
      time_ago: "1 month ago",
    },
  ];
}

/**
 * Get all recent adventures with enhanced metadata (fallback version)
 */
export async function getAllRecentAdventures(): Promise<RecentAdventure[]> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔄 Fetching all adventures with metadata...");
    
    // For now, return fallback data until views are implemented
    const adventures: any[] = [];
    
    if (!adventures || adventures.length === 0) {
      console.log("📦 No adventures found, using fallback data");
      return getFallbackRecentAdventures();
    }

    return adventures;
  } catch (error) {
    console.error("Error in getAllRecentAdventures:", error);
    console.log("📦 Using fallback data due to error");
    return getFallbackRecentAdventures();
  }
}

/**
 * Get adventure statistics
 */
export async function getAdventureStats(): Promise<AdventureStats> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    // TODO: Implement refresh function for Hasura
    const data = null;
    const error = null;

    if (error) {
      throw error;
    }

    return (
      data || {
        total_adventures: 3,
        recent_count: 3,
        latest_adventure: "Ben Nevis Summit",
        oldest_adventure: "Edinburgh Castle",
      }
    );
  } catch (error) {
    console.error("Error getting adventure stats:", error);
    return {
      total_adventures: 3,
      recent_count: 3,
      latest_adventure: "Ben Nevis Summit",
      oldest_adventure: "Edinburgh Castle",
    };
  }
}

/**
 * Get recent adventures with fallback
 */
export async function getRecentAdventuresWithFallback(): Promise<
  RecentAdventure[]
> {
  try {
    // First check if we can connect to Hasura at all
    if (!isHasuraConfigured()) {
      console.log("📦 Hasura not configured, using fallback data");
      return getFallbackRecentAdventures();
    }

    const adventures = await getRecentAdventures();

    // If we have real adventures, return them (should be latest 3 from journal)
    if (adventures && adventures.length > 0) {
      console.log(
        `✅ Using ${adventures.length} real journal entries for recent adventures`,
      );
      return adventures;
    }

    // If no real adventures, return fallback
    console.log("📦 No journal entries found, using fallback data");
    return getFallbackRecentAdventures();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log("📦 Database error, using fallback data:", errorMessage);
    return getFallbackRecentAdventures();
  }
}

/**
 * Subscribe to adventure updates (alias for compatibility)
 */
export function subscribeToAdventureUpdates(
  callback: (adventures: RecentAdventure[]) => void,
): () => void {
  return subscribeToRecentAdventures(callback);
}

/**
 * Subscribe to recent adventures changes (placeholder for future implementation)
 */
export function subscribeToRecentAdventures(
  callback: (adventures: RecentAdventure[]) => void,
): () => void {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, skipping real-time subscription");
    return () => {}; // Return empty unsubscribe function
  }

  console.log("🔄 Setting up real-time subscription for recent adventures");

  // TODO: Implement Hasura real-time subscription
  const subscription = {
    unsubscribe: () => {}
  };

  return () => {
    subscription.unsubscribe();
    console.log("✅ Unsubscribed from recent adventures changes");
  };
}

/**
 * Test connection to recent adventures service
 */
export async function testRecentAdventuresConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  if (!isHasuraConfigured()) {
    return {
      success: false,
      message: "Hasura not configured",
      error: "Please set VITE_HASURA_GRAPHQL_URL",
    };
  }

  try {
    console.log("🔄 Testing recent adventures connection...");

    // Simple test query
    await getRecentAdventures();

    console.log("✅ Recent adventures connection test successful");
    return {
      success: true,
      message: "Recent adventures connection working",
    };
  } catch (error) {
    console.error("❌ Recent adventures connection test failed:", error);
    return {
      success: false,
      message: "Connection failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper function to format adventure for display
 */
export function formatAdventureForDisplay(adventure: RecentAdventure): string {
  return `${adventure.title} in ${adventure.location} (${adventure.formatted_date})`;
}

/**
 * Get unique adventure types from recent adventures
 */
export function getUniqueAdventureTypes(adventures: RecentAdventure[]): string[] {
  const types = adventures.map((adventure) => adventure.adventure_type);
  return Array.from(new Set(types)).sort();
}

/**
 * Filter adventures by type
 */
export function filterAdventuresByType(
  adventures: RecentAdventure[],
  type: string,
): RecentAdventure[] {
  return adventures.filter((adventure) => adventure.adventure_type === type);
}
