import { getJournalEntries, JournalEntry } from "./journalService";

/**
 * Real Adventure Statistics Service
 * Calculates actual statistics from journal entries and other data
 */

export interface RealAdventureStats {
  journal_entries: number;
  places_explored: number;
  memory_tags: number;
  photos_captured: number;
  miles_traveled: number;
  unique_locations: number;
  weather_experiences: number;
  activity_types: number;
}

/**
 * Calculate real statistics from journal entries
 */
export async function calculateRealStats(): Promise<RealAdventureStats> {
  try {
    console.log(
      "📊 Calculating real adventure statistics from journal data...",
    );

    const journalEntries = await getJournalEntries();
    console.log(`📖 Found ${journalEntries.length} journal entries`);

    if (journalEntries.length === 0) {
      return {
        journal_entries: 0,
        places_explored: 0,
        memory_tags: 0,
        photos_captured: 0,
        miles_traveled: 0,
        unique_locations: 0,
        weather_experiences: 0,
        activity_types: 0,
      };
    }

    // Calculate journal entries count
    const journal_entries = journalEntries.length;

    // Calculate unique places explored
    const uniqueLocations = new Set(
      journalEntries.map((entry) => entry.location.toLowerCase().trim()),
    );
    const places_explored = uniqueLocations.size;

    // Calculate total memory tags
    const allTags = journalEntries.flatMap((entry) => entry.tags || []);
    const memory_tags = allTags.length;

    // Calculate total photos captured
    const photos_captured = journalEntries.reduce((total, entry) => {
      return total + (entry.photos?.length || 0);
    }, 0);

    // Calculate total miles traveled
    const miles_traveled = journalEntries.reduce((total, entry) => {
      return total + (entry.miles_traveled || 0);
    }, 0);

    // Calculate unique weather experiences
    const uniqueWeather = new Set(
      journalEntries
        .map((entry) => entry.weather?.toLowerCase().trim())
        .filter((weather) => weather && weather !== ""),
    );
    const weather_experiences = uniqueWeather.size;

    // Calculate activity types (based on tags)
    const uniqueActivityTags = new Set(
      allTags.map((tag) => tag.toLowerCase().trim()),
    );
    const activity_types = uniqueActivityTags.size;

    const stats = {
      journal_entries,
      places_explored,
      memory_tags,
      photos_captured,
      miles_traveled,
      unique_locations: places_explored,
      weather_experiences,
      activity_types,
    };

    console.log("📊 Calculated real stats:", stats);
    return stats;
  } catch (error) {
    console.error("Error calculating real stats:", error);
    // Return fallback stats if calculation fails
    return {
      journal_entries: 0,
      places_explored: 0,
      memory_tags: 0,
      photos_captured: 0,
      miles_traveled: 0,
      unique_locations: 0,
      weather_experiences: 0,
      activity_types: 0,
    };
  }
}

/**
 * Get additional calculated statistics
 */
export async function getAdditionalStats(): Promise<{
  munros_climbed: number;
  castles_visited: number;
  wildlife_spotted: number;
  adventures_this_year: number;
}> {
  try {
    const journalEntries = await getJournalEntries();
    const currentYear = new Date().getFullYear();

    // Count Munros (mountains over 3000ft in Scotland)
    const munroKeywords = [
      "munro",
      "ben",
      "mountain",
      "peak",
      "summit",
      "cairn",
    ];
    const munros_climbed = journalEntries.filter((entry) => {
      const searchText =
        `${entry.title} ${entry.content} ${entry.tags?.join(" ")}`.toLowerCase();
      return munroKeywords.some((keyword) => searchText.includes(keyword));
    }).length;

    // Count castles visited
    const castleKeywords = ["castle", "fortress", "tower", "keep", "palace"];
    const castles_visited = journalEntries.filter((entry) => {
      const searchText =
        `${entry.title} ${entry.content} ${entry.tags?.join(" ")}`.toLowerCase();
      return castleKeywords.some((keyword) => searchText.includes(keyword));
    }).length;

    // Count wildlife encounters
    const wildlifeKeywords = [
      "deer",
      "eagle",
      "seal",
      "dolphin",
      "whale",
      "bird",
      "wildlife",
      "animal",
      "sheep",
      "cow",
      "horse",
      "rabbit",
      "fox",
    ];
    const wildlife_spotted = journalEntries.filter((entry) => {
      const searchText =
        `${entry.title} ${entry.content} ${entry.tags?.join(" ")}`.toLowerCase();
      return wildlifeKeywords.some((keyword) => searchText.includes(keyword));
    }).length;

    // Count adventures this year
    const adventures_this_year = journalEntries.filter((entry) => {
      const entryYear = new Date(entry.date).getFullYear();
      return entryYear === currentYear;
    }).length;

    return {
      munros_climbed,
      castles_visited,
      wildlife_spotted,
      adventures_this_year,
    };
  } catch (error) {
    console.error("Error calculating additional stats:", error);
    return {
      munros_climbed: 0,
      castles_visited: 0,
      wildlife_spotted: 0,
      adventures_this_year: 0,
    };
  }
}

/**
 * Get comprehensive real adventure statistics
 */
export async function getAllRealStats(): Promise<{
  primary: RealAdventureStats;
  additional: {
    munros_climbed: number;
    castles_visited: number;
    wildlife_spotted: number;
    adventures_this_year: number;
  };
}> {
  const [primary, additional] = await Promise.all([
    calculateRealStats(),
    getAdditionalStats(),
  ]);

  return { primary, additional };
}

/**
 * Format stats for display with descriptions
 */
export function formatStatsForDisplay(
  stats: RealAdventureStats,
  additional: any,
) {
  return {
    journal_entries: {
      value: stats.journal_entries,
      label: "Journal Entries",
      description: "Stories captured & memories preserved",
    },
    places_explored: {
      value: stats.places_explored,
      label: "Places Explored",
      description: "Across Scotland's breathtaking landscapes",
    },
    memory_tags: {
      value: stats.memory_tags,
      label: "Memory Tags",
      description: "Special moments & magical experiences",
    },
    photos_captured: {
      value: stats.photos_captured,
      label: "Photos Captured",
      description: "Beautiful moments frozen in time",
    },
    miles_traveled: {
      value: stats.miles_traveled,
      label: "Miles Traveled",
      description: "Across Scotland's stunning terrain",
    },
    munros_climbed: {
      value: additional.munros_climbed,
      label: "Munros Climbed",
      description: "Scottish peaks conquered together",
    },
    adventures_this_year: {
      value: additional.adventures_this_year,
      label: "Adventures This Year",
      description: "Family expeditions & discoveries",
    },
    wildlife_spotted: {
      value: additional.wildlife_spotted,
      label: "Wildlife Spotted",
      description: "Amazing creatures encountered",
    },
    castles_explored: {
      value: additional.castles_visited,
      label: "Castles Explored",
      description: "Historic fortresses & legends",
    },
    weather_adventures: {
      value: stats.weather_experiences,
      label: "Weather Adventures",
      description: "Sunshine, rain & Scottish mists",
    },
  };
}
