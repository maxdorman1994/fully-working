import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Milestones Service
 * Handles milestone data, progress tracking, and achievements
 */

export interface MilestoneCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category_id: string;
  icon: string;
  xp_reward: number;
  color_scheme: {
    color: string;
    bgColor: string;
    borderColor: string;
  };
  milestone_type: "simple" | "progress" | "locked";
  target_value?: number;
  requirement_text?: string;
  required_milestone_ids?: string[];
  sort_order: number;
  is_active: boolean;
}

export interface UserMilestoneProgress {
  id: string;
  user_id: string;
  milestone_id: string;
  status: "locked" | "available" | "in_progress" | "completed";
  current_progress: number;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneWithProgress extends Milestone {
  progress?: UserMilestoneProgress;
  progressPercentage?: number;
  dateCompleted?: string;
}

export interface MilestoneStats {
  completed_count: number;
  in_progress_count: number;
  locked_count: number;
  total_xp: number;
  completion_percentage: number;
}

/**
 * Get all milestone categories
 */
export async function getMilestoneCategories(): Promise<MilestoneCategory[]> {
  if (!isSupabaseConfigured()) {
    return getFallbackCategories();
  }

  try {
    console.log("🔄 Fetching milestone categories from database...");

    const { data: categories, error } = await supabase
      .from("milestone_categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching milestone categories:", error);
      throw new Error(`Failed to fetch milestone categories: ${error.message}`);
    }

    console.log(`✅ Loaded ${categories?.length || 0} milestone categories`);
    return categories || getFallbackCategories();
  } catch (error) {
    console.error("Error in getMilestoneCategories:", error);
    return getFallbackCategories();
  }
}

/**
 * Get all milestones with user progress
 */
export async function getMilestonesWithProgress(
  userId: string = "demo-user",
): Promise<MilestoneWithProgress[]> {
  if (!isSupabaseConfigured()) {
    return getFallbackMilestones();
  }

  try {
    console.log("🔄 Fetching milestones with progress from database...");

    // Get milestones with progress
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select(
        `
        *,
        user_milestone_progress!left(*)
      `,
      )
      .eq("user_milestone_progress.user_id", userId)
      .eq("is_active", true)
      .order("sort_order");

    if (milestonesError) {
      console.error("Error fetching milestones:", milestonesError);
      throw new Error(`Failed to fetch milestones: ${milestonesError.message}`);
    }

    // Transform the data
    const transformedMilestones: MilestoneWithProgress[] = (
      milestones || []
    ).map((milestone) => {
      const progress = Array.isArray(milestone.user_milestone_progress)
        ? milestone.user_milestone_progress[0]
        : milestone.user_milestone_progress;

      const progressPercentage =
        milestone.target_value && progress?.current_progress
          ? (progress.current_progress / milestone.target_value) * 100
          : 0;

      return {
        ...milestone,
        progress: progress || undefined,
        progressPercentage,
        dateCompleted: progress?.completion_date || undefined,
      };
    });

    console.log(
      `✅ Loaded ${transformedMilestones.length} milestones with progress`,
    );
    return transformedMilestones;
  } catch (error) {
    console.error("Error in getMilestonesWithProgress:", error);
    return getFallbackMilestones();
  }
}

/**
 * Get milestone statistics for a user
 */
export async function getMilestoneStats(
  userId: string = "demo-user",
): Promise<MilestoneStats> {
  if (!isSupabaseConfigured()) {
    console.log("⚠️ Supabase not configured, using fallback stats");
    return getFallbackStats();
  }

  try {
    console.log("🔄 Fetching milestone statistics from database...");

    // First try to get stats from the leaderboard view
    const { data: stats, error } = await supabase
      .from("milestone_leaderboard")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    if (error) {
      console.error(
        "Error fetching milestone stats from leaderboard:",
        error.message || error,
      );

      // Fallback: Calculate stats manually from user_milestone_progress table
      return await calculateStatsManually(userId);
    }

    // If no stats found in leaderboard (user has no progress yet), return empty stats
    if (!stats) {
      console.log(
        "📊 No milestone stats found for user, returning empty stats",
      );
      return {
        completed_count: 0,
        in_progress_count: 0,
        locked_count: 0,
        total_xp: 0,
        completion_percentage: 0,
      };
    }

    const result: MilestoneStats = {
      completed_count: stats.completed_milestones || 0,
      in_progress_count: 0, // We'll calculate this separately if needed
      locked_count: 0, // We'll calculate this separately if needed
      total_xp: stats.total_xp || 0,
      completion_percentage: stats.completion_percentage || 0,
    };

    console.log("✅ Milestone stats loaded:", result);
    return result;
  } catch (error) {
    console.error(
      "Error in getMilestoneStats:",
      error instanceof Error ? error.message : String(error),
    );
    return getFallbackStats();
  }
}

/**
 * Calculate milestone stats manually when leaderboard view fails
 */
async function calculateStatsManually(userId: string): Promise<MilestoneStats> {
  try {
    console.log("🔄 Calculating milestone stats manually...");

    // Get user progress directly
    const { data: progressData, error: progressError } = await supabase
      .from("user_milestone_progress")
      .select(
        `
        status,
        milestone_id,
        milestones!inner(xp_reward)
      `,
      )
      .eq("user_id", userId);

    if (progressError) {
      console.error("Error fetching user progress:", progressError.message);
      return getFallbackStats();
    }

    const progress = progressData || [];

    const completed_count = progress.filter(
      (p) => p.status === "completed",
    ).length;
    const in_progress_count = progress.filter(
      (p) => p.status === "in_progress",
    ).length;
    const total_xp = progress
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.milestones?.xp_reward || 0), 0);

    // Get total milestone count for percentage calculation
    const { count: totalMilestones } = await supabase
      .from("milestones")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const completion_percentage = totalMilestones
      ? (completed_count / totalMilestones) * 100
      : 0;

    const result = {
      completed_count,
      in_progress_count,
      locked_count:
        (totalMilestones || 0) - completed_count - in_progress_count,
      total_xp,
      completion_percentage,
    };

    console.log("✅ Manually calculated milestone stats:", result);
    return result;
  } catch (error) {
    console.error(
      "Error calculating stats manually:",
      error instanceof Error ? error.message : String(error),
    );
    return getFallbackStats();
  }
}

/**
 * Update milestone progress
 */
export async function updateMilestoneProgress(
  userId: string,
  milestoneId: string,
  progressIncrement: number = 1,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, cannot update milestone progress");
    return false;
  }

  try {
    console.log(
      `🔄 Updating milestone progress: ${milestoneId} (+${progressIncrement})`,
    );

    const { data, error } = await supabase.rpc("update_milestone_progress", {
      p_user_id: userId,
      p_milestone_id: milestoneId,
      p_progress_increment: progressIncrement,
    });

    if (error) {
      console.error("Error updating milestone progress:", error);
      return false;
    }

    console.log(`✅ Milestone progress updated successfully`);
    return true;
  } catch (error) {
    console.error("Error in updateMilestoneProgress:", error);
    return false;
  }
}

/**
 * Subscribe to milestone progress changes
 */
export function subscribeToMilestoneUpdates(
  userId: string,
  callback: (milestones: MilestoneWithProgress[]) => void,
) {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, skipping milestone subscription");
    return () => {};
  }

  console.log("🔄 Setting up real-time milestone progress sync...");

  const subscription = supabase
    .channel("milestone_progress_updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_milestone_progress",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log(
          "📡 Real-time milestone progress change detected:",
          payload.eventType,
        );

        try {
          const milestones = await getMilestonesWithProgress(userId);
          callback(milestones);
          console.log("✅ Milestone progress sync updated");
        } catch (error) {
          console.error("Error in milestone progress subscription:", error);
        }
      },
    )
    .subscribe((status) => {
      console.log("📡 Milestone progress subscription status:", status);
    });

  console.log("✅ Real-time milestone progress sync enabled");

  return () => {
    console.log("🔌 Unsubscribing from milestone progress changes");
    subscription.unsubscribe();
  };
}

/**
 * Test milestone system connection
 */
export async function testMilestonesConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Supabase not configured",
      error: "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    };
  }

  try {
    console.log("🔍 Testing milestone system connection...");

    // Test milestone categories
    const { data: categories, error: categoriesError } = await supabase
      .from("milestone_categories")
      .select("*", { count: "exact", head: true });

    if (categoriesError) {
      return {
        success: false,
        message: "Failed to connect to milestone categories",
        error: categoriesError.message,
      };
    }

    // Test milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select("*", { count: "exact", head: true });

    if (milestonesError) {
      return {
        success: false,
        message: "Failed to connect to milestones",
        error: milestonesError.message,
      };
    }

    // Get actual counts
    const stats = await getMilestoneStats();

    return {
      success: true,
      message: `✅ Milestone system connected! Found ${stats.completed_count} completed milestones with ${stats.total_xp} total XP.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Connection test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fallback data when database is not available
 */
function getFallbackCategories(): MilestoneCategory[] {
  return [
    { id: "all", name: "All", icon: "Star" },
    { id: "exploration", name: "Exploration", icon: "MapPin" },
    { id: "photography", name: "Photography", icon: "Camera" },
    { id: "family", name: "Family", icon: "Heart" },
    { id: "adventure", name: "Adventure", icon: "Mountain" },
    { id: "documentation", name: "Documentation", icon: "Eye" },
    { id: "time", name: "Time", icon: "Calendar" },
    { id: "wildlife", name: "Wildlife", icon: "Eye" },
    { id: "culture", name: "Culture", icon: "Trophy" },
    { id: "nature", name: "Nature", icon: "Mountain" },
    { id: "legendary", name: "Legendary", icon: "Award" },
  ];
}

function getFallbackMilestones(): MilestoneWithProgress[] {
  // Return basic milestone structure without progress when database is unavailable
  return [
    {
      id: "first-adventure",
      title: "First Adventure",
      description:
        "Record your first journal entry to start your Scottish exploration journey",
      category_id: "exploration",
      icon: "MapPin",
      xp_reward: 100,
      color_scheme: {
        color: "from-blue-500 to-indigo-600",
        bgColor: "from-blue-50 to-indigo-100",
        borderColor: "border-blue-200/60",
      },
      milestone_type: "simple",
      sort_order: 1,
      is_active: true,
      // No progress when using fallback - shows as locked/not started
    },
    {
      id: "photo-memories",
      title: "Photo Memories",
      description: "Upload your first photos to capture Scottish memories",
      category_id: "photography",
      icon: "Camera",
      xp_reward: 50,
      color_scheme: {
        color: "from-emerald-500 to-teal-600",
        bgColor: "from-emerald-50 to-teal-100",
        borderColor: "border-emerald-200/60",
      },
      milestone_type: "simple",
      sort_order: 2,
      is_active: true,
    },
    {
      id: "location-explorer",
      title: "Location Explorer",
      description: "Visit and document 5 different Scottish locations",
      category_id: "exploration",
      icon: "MapPin",
      xp_reward: 200,
      color_scheme: {
        color: "from-amber-500 to-orange-600",
        bgColor: "from-amber-50 to-orange-100",
        borderColor: "border-amber-200/60",
      },
      milestone_type: "progress",
      target_value: 5,
      sort_order: 3,
      is_active: true,
    },
  ];
}

function getFallbackStats(): MilestoneStats {
  return {
    completed_count: 0,
    in_progress_count: 0,
    locked_count: 3,
    total_xp: 0,
    completion_percentage: 0,
  };
}
