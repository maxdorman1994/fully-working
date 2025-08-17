import {
  hasuraClient,
  JournalEntry,
  isHasuraConfigured,
  executeQuery,
  executeMutation,
  GET_JOURNAL_ENTRIES,
  GET_RECENT_ADVENTURES,
  INSERT_JOURNAL_ENTRY,
  UPDATE_JOURNAL_ENTRY,
  DELETE_JOURNAL_ENTRY,
} from "./hasura";
import {
  getEnvironmentInfo,
  validateSupabaseConfig,
  debugNetworkError,
} from "./debug";
import { updateMilestonesFromJournalEntry } from "./milestoneTracker";

/**
 * Hasura Journal Service
 * Handles all database operations for journal entries via GraphQL
 * Photos are stored in Cloudflare R2, URLs stored in database
 */

export interface CreateJournalEntryData {
  title: string;
  content: string;
  date: string;
  location: string;
  weather: string;
  mood: string;
  miles_traveled: number;
  parking: string;
  dog_friendly: boolean;
  paid_activity: boolean;
  adult_tickets: string;
  child_tickets: string;
  other_tickets: string;
  pet_notes: string;
  tags: string[];
  photos: string[]; // Cloudflare R2 URLs
}

/**
 * Create a new journal entry in Hasura
 */
export async function createJournalEntry(
  data: CreateJournalEntryData,
): Promise<JournalEntry> {
  console.log("🔧 Hasura configured:", isHasuraConfigured());
  console.log("🔧 Hasura URL:", import.meta.env.VITE_HASURA_GRAPHQL_URL);

  if (!isHasuraConfigured()) {
    throw new Error(
      "Hasura not configured - please set VITE_HASURA_GRAPHQL_URL",
    );
  }

  console.log("📝 Creating journal entry with data:", data);

  try {
    console.log("🚀 Attempting to insert journal entry via GraphQL...");
    const result = await executeMutation(INSERT_JOURNAL_ENTRY, {
      entry: data,
    });
    console.log("✅ GraphQL mutation result:", result);

    if (!result.insert_journal_entries_one) {
      throw new Error("Failed to create journal entry");
    }

    const entry = result.insert_journal_entries_one as JournalEntry;

    // Update milestones based on the new entry
    try {
      await updateMilestonesFromJournalEntry(entry);
    } catch (milestoneError) {
      console.warn("Failed to update milestones:", milestoneError);
      // Don't fail the journal creation if milestone update fails
    }

    console.log("✅ Journal entry created successfully:", entry.id);
    return entry;
  } catch (error) {
    console.error("❌ Failed to create journal entry:", error);
    debugNetworkError(error);
    throw error;
  }
}

/**
 * Get all journal entries from Hasura
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔄 Fetching journal entries from Hasura...");

    const result = await executeQuery(GET_JOURNAL_ENTRIES);

    if (!result.journal_entries) {
      console.warn("No journal entries found in response");
      return [];
    }

    const entries = result.journal_entries as JournalEntry[];
    console.log(`✅ Loaded ${entries.length} journal entries from Hasura`);
    return entries;
  } catch (error) {
    console.error("❌ Failed to fetch journal entries:", error);
    debugNetworkError(error);
    throw error;
  }
}

/**
 * Get recent adventures (last 3 entries) from Hasura
 */
export async function getRecentAdventures(): Promise<any[]> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔄 Fetching recent adventures from Hasura...");

    const result = await executeQuery(GET_RECENT_ADVENTURES);

    if (!result.recent_adventures) {
      console.warn("No recent adventures found in response");
      return [];
    }

    const adventures = result.recent_adventures;
    console.log(`✅ Loaded ${adventures.length} recent adventures from Hasura`);
    return adventures;
  } catch (error) {
    console.error("❌ Failed to fetch recent adventures:", error);
    debugNetworkError(error);
    throw error;
  }
}

/**
 * Update an existing journal entry in Hasura
 */
export async function updateJournalEntry(
  id: string,
  data: Partial<CreateJournalEntryData>,
): Promise<JournalEntry> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔄 Updating journal entry:", id);

    const result = await executeMutation(UPDATE_JOURNAL_ENTRY, {
      id,
      entry: data,
    });

    if (!result.update_journal_entries_by_pk) {
      throw new Error("Failed to update journal entry - entry not found");
    }

    const updatedEntry = result.update_journal_entries_by_pk as JournalEntry;

    // Update milestones based on the updated entry
    try {
      await updateMilestonesFromJournalEntry(updatedEntry);
    } catch (milestoneError) {
      console.warn("Failed to update milestones:", milestoneError);
    }

    console.log("✅ Journal entry updated successfully:", updatedEntry.id);
    return updatedEntry;
  } catch (error) {
    console.error("❌ Failed to update journal entry:", error);
    debugNetworkError(error);
    throw error;
  }
}

/**
 * Delete a journal entry from Hasura
 */
export async function deleteJournalEntry(id: string): Promise<void> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔄 Deleting journal entry:", id);

    const result = await executeMutation(DELETE_JOURNAL_ENTRY, {
      id,
    });

    if (!result.delete_journal_entries_by_pk) {
      throw new Error("Failed to delete journal entry - entry not found");
    }

    console.log("✅ Journal entry deleted successfully:", id);
  } catch (error) {
    console.error("❌ Failed to delete journal entry:", error);
    debugNetworkError(error);
    throw error;
  }
}

/**
 * Get all unique tags from journal entries
 */
export async function getAllTags(): Promise<string[]> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    const entries = await getJournalEntries();
    const allTags = entries.flatMap((entry) => entry.tags || []);
    const uniqueTags = Array.from(new Set(allTags)).sort();

    console.log(`✅ Found ${uniqueTags.length} unique tags`);
    return uniqueTags;
  } catch (error) {
    console.error("❌ Failed to get tags:", error);
    throw error;
  }
}

/**
 * Search journal entries by query
 */
export async function searchJournalEntries(query: string): Promise<JournalEntry[]> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔍 Searching journal entries for:", query);

    const SEARCH_QUERY = `
      query SearchJournalEntries($query: String!) {
        search_journal_entries(args: {search_query: $query}) {
          id
          title
          content
          date
          location
          weather
          mood
          miles_traveled
          parking
          dog_friendly
          paid_activity
          adult_tickets
          child_tickets
          other_tickets
          pet_notes
          tags
          photos
          created_at
          updated_at
          rank
        }
      }
    `;

    const result = await executeQuery(SEARCH_QUERY, { query });

    if (!result.search_journal_entries) {
      console.warn("No search results found");
      return [];
    }

    const entries = result.search_journal_entries as JournalEntry[];
    console.log(`✅ Found ${entries.length} matching entries`);
    return entries;
  } catch (error) {
    console.error("❌ Failed to search journal entries:", error);
    // Fallback to basic filtering
    const allEntries = await getJournalEntries();
    return allEntries.filter((entry) =>
      entry.title.toLowerCase().includes(query.toLowerCase()) ||
      entry.content.toLowerCase().includes(query.toLowerCase()) ||
      entry.location.toLowerCase().includes(query.toLowerCase())
    );
  }
}

/**
 * Test Hasura connection for journal entries
 */
export async function testHasuraConnection(): Promise<{
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
    console.log("🔄 Testing Hasura connection...");

    const TEST_QUERY = `
      query TestConnection {
        journal_entries(limit: 1) {
          id
        }
      }
    `;

    const result = await executeQuery(TEST_QUERY);

    console.log("✅ Hasura connection test successful");
    return {
      success: true,
      message: "Hasura connection working",
    };
  } catch (error) {
    console.error("❌ Hasura connection test failed:", error);
    return {
      success: false,
      message: "Connection failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Legacy function name for compatibility
export const testSupabaseConnection = testHasuraConnection;

/**
 * Get journal statistics
 */
export async function getJournalStats(): Promise<{
  total_entries: number;
  total_places: number;
  total_photos: number;
  total_tags: number;
}> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    const STATS_QUERY = `
      query GetJournalStats {
        journal_stats {
          total_entries
          total_places
          total_photos
          total_tags
        }
      }
    `;

    const result = await executeQuery(STATS_QUERY);

    if (!result.journal_stats || result.journal_stats.length === 0) {
      return {
        total_entries: 0,
        total_places: 0,
        total_photos: 0,
        total_tags: 0,
      };
    }

    return result.journal_stats[0];
  } catch (error) {
    console.error("❌ Failed to get journal stats:", error);
    throw error;
  }
}
