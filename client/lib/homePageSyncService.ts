import { supabase } from "./supabase";
import { debugNetworkError } from "./debug";

export interface HomePageStats {
  total_adventures: number;
  total_distance: number;
  total_elevation: number;
  munros_completed: number;
  family_photos_count: number;
  recent_adventure_count: number;
  updated_at: string;
}

export interface SyncedHomeData {
  stats: HomePageStats;
  recent_adventures: any[];
  family_members: any[];
  milestones: any[];
}

/**
 * Load all home page data for cross-device sync
 */
export async function loadHomePageData(): Promise<SyncedHomeData> {
  try {
    console.log("🔄 Loading comprehensive home page data...");

    // Load all data in parallel for better performance
    const [statsData, adventuresData, familyData, milestonesData] =
      await Promise.all([
        loadDynamicStats(),
        loadRecentAdventures(),
        loadFamilyMembersData(),
        loadMilestonesData(),
      ]);

    const homeData: SyncedHomeData = {
      stats: statsData,
      recent_adventures: adventuresData,
      family_members: familyData,
      milestones: milestonesData,
    };

    console.log("✅ Home page data loaded:", {
      stats: homeData.stats,
      adventures: homeData.recent_adventures.length,
      family: homeData.family_members.length,
      milestones: homeData.milestones.length,
    });

    // Cache for offline access
    localStorage.setItem("home_page_data", JSON.stringify(homeData));

    return homeData;
  } catch (error) {
    console.error("❌ Failed to load home page data:", error);
    debugNetworkError(error);

    // Fallback to cached data
    const cached = localStorage.getItem("home_page_data");
    if (cached) {
      console.log("📱 Using cached home page data");
      return JSON.parse(cached);
    }

    // Return empty data structure
    return {
      stats: {
        total_adventures: 0,
        total_distance: 0,
        total_elevation: 0,
        munros_completed: 0,
        family_photos_count: 0,
        recent_adventure_count: 0,
        updated_at: new Date().toISOString(),
      },
      recent_adventures: [],
      family_members: [],
      milestones: [],
    };
  }
}

/**
 * Load dynamic stats from multiple tables
 */
async function loadDynamicStats(): Promise<HomePageStats> {
  console.log("📊 Loading dynamic home page stats...");

  const { data: journalStats, error: journalError } = await supabase
    .from("recent_adventures_view")
    .select("*");

  if (journalError) {
    console.error("Failed to load journal stats:", journalError);
  }

  const { data: familyStats, error: familyError } = await supabase
    .from("family_members")
    .select("id, display_avatar");

  if (familyError) {
    console.error("Failed to load family stats:", familyError);
  }

  const { data: milestoneStats, error: milestoneError } = await supabase
    .from("milestones")
    .select("id, completed, milestone_type");

  if (milestoneError) {
    console.error("Failed to load milestone stats:", milestoneError);
  }

  // Calculate comprehensive stats
  const stats: HomePageStats = {
    total_adventures: journalStats?.length || 0,
    total_distance:
      journalStats?.reduce((sum, adv) => sum + (adv.distance || 0), 0) || 0,
    total_elevation:
      journalStats?.reduce((sum, adv) => sum + (adv.elevation_gain || 0), 0) ||
      0,
    munros_completed:
      milestoneStats?.filter((m) => m.milestone_type === "munro" && m.completed)
        .length || 0,
    family_photos_count:
      familyStats?.filter(
        (f) => f.display_avatar && f.display_avatar !== "/placeholder.svg",
      ).length || 0,
    recent_adventure_count:
      journalStats?.filter((adv) => {
        const adventureDate = new Date(adv.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return adventureDate > thirtyDaysAgo;
      }).length || 0,
    updated_at: new Date().toISOString(),
  };

  console.log("📊 Dynamic stats calculated:", stats);
  return stats;
}

/**
 * Load recent adventures
 */
async function loadRecentAdventures(): Promise<any[]> {
  console.log("📖 Loading recent adventures...");

  const { data, error } = await supabase
    .from("recent_adventures_view")
    .select("*")
    .order("date", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to load recent adventures:", error);
    return [];
  }

  return data || [];
}

/**
 * Load family members data
 */
async function loadFamilyMembersData(): Promise<any[]> {
  console.log("👨‍👩‍👧‍👦 Loading family members...");

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load family members:", error);
    return [];
  }

  return data || [];
}

/**
 * Load milestones data
 */
async function loadMilestonesData(): Promise<any[]> {
  console.log("🎯 Loading milestones...");

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to load milestones:", error);
    return [];
  }

  return data || [];
}

/**
 * Subscribe to home page data changes for real-time sync
 */
export function subscribeToHomePageSync(
  callback: (data: Partial<SyncedHomeData>) => void,
): () => void {
  console.log("🔄 Setting up comprehensive home page sync...");

  const subscriptions: any[] = [];

  // Subscribe to journal entries (affects stats and recent adventures)
  const journalSub = supabase
    .channel("home_journal_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "journal_entries" },
      (payload) => {
        console.log("🔄 Journal changed, refreshing home data");
        loadDynamicStats().then((stats) => callback({ stats }));
        loadRecentAdventures().then((recent_adventures) =>
          callback({ recent_adventures }),
        );
      },
    )
    .subscribe();

  // Subscribe to family members
  const familySub = supabase
    .channel("home_family_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "family_members" },
      (payload) => {
        console.log("🔄 Family members changed, refreshing home data");
        loadFamilyMembersData().then((family_members) =>
          callback({ family_members }),
        );
        loadDynamicStats().then((stats) => callback({ stats }));
      },
    )
    .subscribe();

  // Subscribe to milestones
  const milestonesSub = supabase
    .channel("home_milestones_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "milestones" },
      (payload) => {
        console.log("🔄 Milestones changed, refreshing home data");
        loadMilestonesData().then((milestones) => callback({ milestones }));
        loadDynamicStats().then((stats) => callback({ stats }));
      },
    )
    .subscribe();

  subscriptions.push(journalSub, familySub, milestonesSub);

  // Return cleanup function
  return () => {
    subscriptions.forEach((sub) => supabase.removeChannel(sub));
  };
}

/**
 * Force refresh all home page data
 */
export async function forceRefreshHomeData(): Promise<SyncedHomeData> {
  console.log("🔄 Force refreshing all home page data...");
  return await loadHomePageData();
}

/**
 * Get cached home page data
 */
export function getCachedHomeData(): SyncedHomeData | null {
  try {
    const cached = localStorage.getItem("home_page_data");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Failed to get cached home data:", error);
    return null;
  }
}
