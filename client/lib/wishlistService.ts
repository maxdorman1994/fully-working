import {
  executeQuery,
  executeMutation,
  GET_WISHLIST_ITEMS,
  INSERT_WISHLIST_ITEM,
  UPDATE_WISHLIST_ITEM,
  DELETE_WISHLIST_ITEM,
  INCREMENT_WISHLIST_VOTES,
  TOGGLE_WISHLIST_RESEARCH,
  isHasuraConfigured,
} from "./hasura";

/**
 * Supabase Wishlist Service
 * Handles all database operations for adventure wishlist items
 */

export interface WishlistItem {
  id: string;
  title: string;
  location: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Planning" | "Researching" | "Ready" | "Booked";
  estimated_cost: number;
  best_seasons: string[];
  duration: string;
  category:
    | "Mountain"
    | "Coast"
    | "City"
    | "Island"
    | "Castle"
    | "Nature"
    | "Activity";
  family_votes: number;
  notes: string;
  target_date?: string;
  researched: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWishlistItemData {
  title: string;
  location: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  status?: "Planning" | "Researching" | "Ready" | "Booked";
  estimated_cost?: number;
  best_seasons?: string[];
  duration?: string;
  category:
    | "Mountain"
    | "Coast"
    | "City"
    | "Island"
    | "Castle"
    | "Nature"
    | "Activity";
  notes?: string;
  target_date?: string;
}

/**
 * Get all wishlist items from Hasura
 */
export async function getWishlistItems(): Promise<WishlistItem[]> {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, returning empty wishlist");
    return [];
  }

  try {
    console.log("🔄 Fetching wishlist items from Hasura...");

    const response = await executeQuery<{ wishlist_items: WishlistItem[] }>(
      GET_WISHLIST_ITEMS,
    );

    const items = response.wishlist_items || [];
    console.log(`✅ Loaded ${items.length} wishlist items from Hasura`);
    return items;
  } catch (error) {
    console.error("❌ Error fetching wishlist items from Hasura:", error);
    console.log("🔄 Returning empty array as fallback");
    return [];
  }
}

/**
 * Create a new wishlist item in Hasura
 */
export async function createWishlistItem(
  data: CreateWishlistItemData,
): Promise<WishlistItem> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(`🎯 Creating wishlist item in Hasura: ${data.title}...`);

    const itemData = {
      title: data.title,
      location: data.location,
      description: data.description || "",
      priority: data.priority,
      status: data.status || "Planning",
      estimated_cost: data.estimated_cost || 500,
      best_seasons: data.best_seasons || ["Summer"],
      duration: data.duration || "3-4 days",
      category: data.category,
      family_votes: 0,
      notes: data.notes || "",
      target_date: data.target_date || null,
      researched: false,
    };

    const response = await executeMutation<{
      insert_wishlist_items_one: WishlistItem;
    }>(INSERT_WISHLIST_ITEM, { item: itemData });

    if (!response.insert_wishlist_items_one) {
      throw new Error("Failed to create wishlist item");
    }

    console.log(
      `✅ Wishlist item created successfully in Hasura: ${data.title}`,
    );
    return response.insert_wishlist_items_one;
  } catch (error) {
    console.error("❌ Error creating wishlist item in Hasura:", error);
    throw error;
  }
}

/**
 * Update a wishlist item in Hasura
 */
export async function updateWishlistItem(
  id: string,
  updates: Partial<WishlistItem>,
): Promise<WishlistItem> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(`🔄 Updating wishlist item in Hasura: ${id}...`);

    const response = await executeMutation<{
      update_wishlist_items_by_pk: WishlistItem;
    }>(UPDATE_WISHLIST_ITEM, {
      id,
      item: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    });

    if (!response.update_wishlist_items_by_pk) {
      throw new Error(`Failed to update wishlist item with ID: ${id}`);
    }

    console.log(`✅ Wishlist item updated successfully in Hasura: ${id}`);
    return response.update_wishlist_items_by_pk;
  } catch (error) {
    console.error("❌ Error updating wishlist item in Hasura:", error);
    throw error;
  }
}

/**
 * Delete a wishlist item from Hasura
 */
export async function deleteWishlistItem(id: string): Promise<void> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(`🗑️ Deleting wishlist item from Hasura: ${id}...`);

    const response = await executeMutation<{
      delete_wishlist_items_by_pk: { id: string };
    }>(DELETE_WISHLIST_ITEM, { id });

    if (!response.delete_wishlist_items_by_pk) {
      throw new Error(`Failed to delete wishlist item with ID: ${id}`);
    }

    console.log(`✅ Wishlist item deleted successfully from Hasura: ${id}`);
  } catch (error) {
    console.error("❌ Error deleting wishlist item from Hasura:", error);
    throw error;
  }
}

/**
 * Add a family vote to a wishlist item in Hasura
 */
export async function addVoteToItem(id: string): Promise<WishlistItem> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(`👍 Adding vote to wishlist item in Hasura: ${id}...`);

    const response = await executeMutation<{
      update_wishlist_items_by_pk: WishlistItem;
    }>(INCREMENT_WISHLIST_VOTES, {
      id,
      increment: 1,
    });

    if (!response.update_wishlist_items_by_pk) {
      throw new Error(`Failed to add vote to wishlist item with ID: ${id}`);
    }

    console.log(`✅ Vote added successfully in Hasura: ${id}`);
    return response.update_wishlist_items_by_pk;
  } catch (error) {
    console.error("❌ Error adding vote in Hasura:", error);
    throw error;
  }
}

/**
 * Remove a family vote from a wishlist item in Hasura
 */
export async function removeVoteFromItem(id: string): Promise<WishlistItem> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(`👎 Removing vote from wishlist item in Hasura: ${id}...`);

    const response = await executeMutation<{
      update_wishlist_items_by_pk: WishlistItem;
    }>(INCREMENT_WISHLIST_VOTES, {
      id,
      increment: -1,
    });

    if (!response.update_wishlist_items_by_pk) {
      throw new Error(
        `Failed to remove vote from wishlist item with ID: ${id}`,
      );
    }

    console.log(`✅ Vote removed successfully in Hasura: ${id}`);
    return response.update_wishlist_items_by_pk;
  } catch (error) {
    console.error("❌ Error removing vote in Hasura:", error);
    throw error;
  }
}

/**
 * Toggle research status of a wishlist item in Hasura
 */
export async function toggleResearchStatus(id: string): Promise<WishlistItem> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log(`🔍 Toggling research status in Hasura: ${id}...`);

    // First get current item to check research status
    const items = await getWishlistItems();
    const currentItem = items.find((item) => item.id === id);

    if (!currentItem) {
      throw new Error(`Wishlist item not found: ${id}`);
    }

    const newStatus = !currentItem.researched;

    const response = await executeMutation<{
      update_wishlist_items_by_pk: WishlistItem;
    }>(TOGGLE_WISHLIST_RESEARCH, {
      id,
      researched: newStatus,
    });

    if (!response.update_wishlist_items_by_pk) {
      throw new Error(
        `Failed to toggle research status for wishlist item with ID: ${id}`,
      );
    }

    console.log(`✅ Research status toggled successfully in Hasura: ${id}`);
    return response.update_wishlist_items_by_pk;
  } catch (error) {
    console.error("❌ Error toggling research status in Hasura:", error);
    throw error;
  }
}

/**
 * Get wishlist statistics from Hasura
 */
export async function getWishlistStats(): Promise<{
  total_items: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  planning_items: number;
  researching_items: number;
  ready_items: number;
  booked_items: number;
  total_categories: number;
  total_budget: number;
  average_votes: number;
  highest_votes: number;
}> {
  const defaultStats = {
    total_items: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0,
    planning_items: 0,
    researching_items: 0,
    ready_items: 0,
    booked_items: 0,
    total_categories: 0,
    total_budget: 0,
    average_votes: 0,
    highest_votes: 0,
  };

  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, returning default wishlist stats");
    return defaultStats;
  }

  try {
    console.log("📊 Calculating wishlist statistics from items...");

    // Get all items and calculate stats client-side
    const items = await getWishlistItems();

    const stats = {
      total_items: items.length,
      high_priority: items.filter((item) => item.priority === "High").length,
      medium_priority: items.filter((item) => item.priority === "Medium")
        .length,
      low_priority: items.filter((item) => item.priority === "Low").length,
      planning_items: items.filter((item) => item.status === "Planning").length,
      researching_items: items.filter((item) => item.status === "Researching")
        .length,
      ready_items: items.filter((item) => item.status === "Ready").length,
      booked_items: items.filter((item) => item.status === "Booked").length,
      total_categories: [...new Set(items.map((item) => item.category))].length,
      total_budget: items.reduce(
        (sum, item) => sum + (item.estimated_cost || 0),
        0,
      ),
      average_votes:
        items.length > 0
          ? Math.round(
              items.reduce((sum, item) => sum + (item.family_votes || 0), 0) /
                items.length,
            )
          : 0,
      highest_votes: Math.max(
        0,
        ...items.map((item) => item.family_votes || 0),
      ),
    };

    console.log("✅ Wishlist stats calculated successfully from Hasura data");
    return stats;
  } catch (error) {
    console.error("❌ Error calculating wishlist stats:", error);
    console.warn("Falling back to default stats due to error");
    return defaultStats;
  }
}

/**
 * Subscribe to real-time changes in wishlist items (polling-based for Hasura)
 */
export function subscribeToWishlistItems(
  callback: (items: WishlistItem[]) => void,
) {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, skipping real-time subscription");
    return () => {}; // Return empty unsubscribe function
  }

  console.log("🔄 Setting up real-time wishlist sync (polling-based)...");

  // Initial fetch
  getWishlistItems().then(callback).catch(console.error);

  // Set up polling for real-time-like updates
  const pollInterval = setInterval(() => {
    console.log("🔄 Polling for wishlist updates...");
    getWishlistItems().then(callback).catch(console.error);
  }, 7000); // Poll every 7 seconds

  console.log("✅ Real-time wishlist sync enabled (polling)");

  return () => {
    console.log("🔌 Stopping wishlist polling");
    clearInterval(pollInterval);
  };
}

/**
 * Test Hasura connection for wishlist data
 */
export async function testWishlistConnection(): Promise<{
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
    console.log("🔍 Testing wishlist Hasura connection...");

    const items = await getWishlistItems();

    return {
      success: true,
      message: `✅ Wishlist Hasura connected! Found ${items.length} adventure${items.length !== 1 ? "s" : ""}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Hasura connection test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
