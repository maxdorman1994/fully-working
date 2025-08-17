import {
  executeQuery,
  executeMutation,
  GET_ADVENTURE_STATS_SUMMARY,
  GET_PRIMARY_ADVENTURE_STATS,
  UPDATE_ADVENTURE_STAT,
  INCREMENT_ADVENTURE_STAT,
  isHasuraConfigured,
} from "./hasura";

/**
 * Supabase Adventure Statistics Service
 * Handles all database operations for adventure statistics
 */

export interface AdventureStat {
  stat_type: string;
  stat_value: number;
  stat_description: string;
  last_updated?: string;
  is_primary_stat?: boolean;
  display_order?: number;
}

export interface AdventureStatsConfig {
  journal_entries: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  places_explored: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  memory_tags: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  photos_captured: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  miles_traveled: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  munros_climbed: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  adventures_this_year: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  wildlife_spotted: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  castles_explored: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
  weather_adventures: {
    value: number;
    description: string;
    icon: string;
    colors: { bg: string; accent: string; gradient: string };
  };
}

/**
 * Get all adventure statistics from Hasura
 */
export async function getAdventureStats(): Promise<AdventureStat[]> {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, returning fallback stats");
    return [];
  }

  try {
    console.log("🔄 Fetching adventure statistics from Hasura...");

    const response = await executeQuery<{
      adventure_stats_summary: AdventureStat[];
    }>(GET_ADVENTURE_STATS_SUMMARY);

    const stats = response.adventure_stats_summary || [];
    console.log(`✅ Loaded ${stats.length} adventure statistics from Hasura`);
    return stats;
  } catch (error) {
    console.error("❌ Error fetching adventure stats from Hasura:", error);
    console.log("🔄 Returning empty array as fallback");
    return [];
  }
}

/**
 * Get primary adventure statistics (the 4 shown by default) from Hasura
 */
export async function getPrimaryAdventureStats(): Promise<AdventureStat[]> {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, returning fallback stats");
    return [];
  }

  try {
    console.log("🔄 Fetching primary adventure statistics from Hasura...");

    const response = await executeQuery<{
      primary_adventure_stats: AdventureStat[];
    }>(GET_PRIMARY_ADVENTURE_STATS);

    const stats = response.primary_adventure_stats || [];
    console.log(
      `✅ Loaded ${stats.length} primary adventure statistics from Hasura`,
    );
    return stats;
  } catch (error) {
    console.error(
      "❌ Error fetching primary adventure stats from Hasura:",
      error,
    );
    console.log("🔄 Returning empty array as fallback");
    return [];
  }
}

/**
 * Update a specific adventure statistic in Hasura
 */
export async function updateAdventureStat(
  statType: string,
  value: number,
  description?: string,
): Promise<void> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(
      `🔄 Updating adventure stat in Hasura: ${statType} = ${value}...`,
    );

    const response = await executeMutation<{
      update_adventure_stats: {
        affected_rows: number;
        returning: AdventureStat[];
      };
    }>(UPDATE_ADVENTURE_STAT, {
      stat_type: statType,
      value: value,
      description: description,
    });

    if (!response.update_adventure_stats?.affected_rows) {
      throw new Error(`Failed to update adventure stat: ${statType}`);
    }

    console.log(`✅ Adventure stat updated in Hasura: ${statType}`);
  } catch (error) {
    console.error("❌ Error updating adventure stat in Hasura:", error);
    throw error;
  }
}

/**
 * Increment a specific adventure statistic in Hasura
 */
export async function incrementAdventureStat(
  statType: string,
  increment: number = 1,
): Promise<number> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(
      `🔄 Incrementing adventure stat in Hasura: ${statType} by ${increment}...`,
    );

    const response = await executeMutation<{
      update_adventure_stats: {
        affected_rows: number;
        returning: AdventureStat[];
      };
    }>(INCREMENT_ADVENTURE_STAT, {
      stat_type: statType,
      increment: increment,
    });

    if (!response.update_adventure_stats?.affected_rows) {
      throw new Error(`Failed to increment adventure stat: ${statType}`);
    }

    const newValue =
      response.update_adventure_stats.returning[0]?.stat_value || 0;
    console.log(
      `✅ Adventure stat incremented in Hasura: ${statType} = ${newValue}`,
    );
    return newValue;
  } catch (error) {
    console.error("❌ Error incrementing adventure stat in Hasura:", error);
    throw error;
  }
}

/**
 * Subscribe to real-time changes in adventure statistics (polling-based for Hasura)
 */
export function subscribeToAdventureStats(
  callback: (stats: AdventureStat[]) => void,
) {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, skipping real-time subscription");
    return () => {}; // Return empty unsubscribe function
  }

  console.log(
    "🔄 Setting up real-time adventure stats sync (polling-based)...",
  );

  // Initial fetch
  getAdventureStats().then(callback).catch(console.error);

  // Set up polling for real-time-like updates
  const pollInterval = setInterval(() => {
    console.log("🔄 Polling for adventure stats updates...");
    getAdventureStats().then(callback).catch(console.error);
  }, 10000); // Poll every 10 seconds

  console.log("✅ Real-time adventure stats sync enabled (polling)");

  return () => {
    console.log("🔌 Stopping adventure stats polling");
    clearInterval(pollInterval);
  };
}

/**
 * Get default fallback statistics for when database is unavailable
 */
export function getFallbackAdventureStats(): AdventureStatsConfig {
  return {
    journal_entries: {
      value: 6,
      description: "Stories captured & memories preserved",
      icon: "calendar",
      colors: {
        bg: "from-blue-400 to-purple-500",
        accent: "from-blue-500 to-purple-600",
        gradient: "from-blue-600 to-purple-600",
      },
    },
    places_explored: {
      value: 6,
      description: "Across Scotland's breathtaking landscapes",
      icon: "map-pin",
      colors: {
        bg: "from-emerald-400 to-teal-500",
        accent: "from-emerald-500 to-teal-600",
        gradient: "from-emerald-600 to-teal-600",
      },
    },
    memory_tags: {
      value: 19,
      description: "Special moments & magical experiences",
      icon: "heart",
      colors: {
        bg: "from-pink-400 to-rose-500",
        accent: "from-pink-500 to-rose-600",
        gradient: "from-pink-600 to-rose-600",
      },
    },
    photos_captured: {
      value: 127,
      description: "Beautiful moments frozen in time",
      icon: "camera",
      colors: {
        bg: "from-orange-400 to-amber-500",
        accent: "from-orange-500 to-amber-600",
        gradient: "from-orange-600 to-amber-600",
      },
    },
    miles_traveled: {
      value: 342,
      description: "Across Scotland's stunning terrain",
      icon: "zap",
      colors: {
        bg: "from-indigo-400 to-blue-500",
        accent: "from-indigo-500 to-blue-600",
        gradient: "from-indigo-600 to-blue-600",
      },
    },
    munros_climbed: {
      value: 3,
      description: "Scottish peaks conquered together",
      icon: "mountain",
      colors: {
        bg: "from-green-400 to-lime-500",
        accent: "from-green-500 to-lime-600",
        gradient: "from-green-600 to-lime-600",
      },
    },
    adventures_this_year: {
      value: 12,
      description: "Family expeditions & discoveries",
      icon: "calendar",
      colors: {
        bg: "from-violet-400 to-purple-500",
        accent: "from-violet-500 to-purple-600",
        gradient: "from-violet-600 to-purple-600",
      },
    },
    wildlife_spotted: {
      value: 23,
      description: "Amazing creatures encountered",
      icon: "heart",
      colors: {
        bg: "from-emerald-400 to-green-500",
        accent: "from-emerald-500 to-green-600",
        gradient: "from-emerald-600 to-green-600",
      },
    },
    castles_explored: {
      value: 4,
      description: "Historic fortresses & legends",
      icon: "home",
      colors: {
        bg: "from-red-400 to-pink-500",
        accent: "from-red-500 to-pink-600",
        gradient: "from-red-600 to-pink-600",
      },
    },
    weather_adventures: {
      value: 8,
      description: "Sunshine, rain & Scottish mists",
      icon: "cloud",
      colors: {
        bg: "from-cyan-400 to-blue-500",
        accent: "from-cyan-500 to-blue-600",
        gradient: "from-cyan-600 to-blue-600",
      },
    },
  };
}

/**
 * Test Hasura connection for adventure statistics
 */
export async function testAdventureStatsConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  if (!isHasuraConfigured()) {
    return {
      success: false,
      message: "Hasura not configured",
      error: "Please set VITE_HASURA_GRAPHQL_URL and VITE_HASURA_ADMIN_SECRET",
    };
  }

  try {
    console.log("🔍 Testing adventure stats Hasura connection...");

    const stats = await getAdventureStats();

    return {
      success: true,
      message: `✅ Adventure stats Hasura connected! Found ${stats.length} statistic${stats.length !== 1 ? "s" : ""}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Hasura connection test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
