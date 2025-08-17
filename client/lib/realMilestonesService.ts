import { supabase } from "./supabase";
import { debugNetworkError } from "./debug";
import { useSync } from "./syncService";

export interface RealMilestone {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  completed_date?: string;
  xp_reward: number;
  difficulty: "bronze" | "silver" | "gold" | "platinum";
  unlock_condition?: string;
  progress_percentage: number;
}

export interface MilestoneCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface MilestoneStats {
  total_adventures: number;
  total_distance: number;
  total_locations: number;
  total_photos: number;
  unique_weather_conditions: number;
  dog_friendly_adventures: number;
  paid_activities: number;
  completion_percentage: number;
  total_xp: number;
  completed_milestones: number;
  available_milestones: number;
}

/**
 * Milestone categories with real data tracking
 */
export const MILESTONE_CATEGORIES: MilestoneCategory[] = [
  {
    id: "explorer",
    name: "Explorer",
    icon: "MapPin",
    description: "Adventures and locations discovered",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "photographer",
    name: "Photographer",
    icon: "Camera",
    description: "Photos captured during adventures",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "distance",
    name: "Distance",
    icon: "Map",
    description: "Miles traveled on adventures",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "social",
    name: "Social",
    icon: "Users",
    description: "Family adventures and shared experiences",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "weather",
    name: "Weather Master",
    icon: "Zap",
    description: "Adventures in different weather conditions",
    color: "from-yellow-500 to-orange-500",
  },
];

/**
 * Define milestone templates that calculate from real journal data
 */
export const MILESTONE_TEMPLATES: Omit<
  RealMilestone,
  | "id"
  | "current_value"
  | "completed"
  | "progress_percentage"
  | "completed_date"
>[] = [
  // Explorer Milestones
  {
    title: "First Adventure",
    description: "Complete your first adventure",
    category: "explorer",
    icon: "MapPin",
    target_value: 1,
    xp_reward: 100,
    difficulty: "bronze",
  },
  {
    title: "Explorer",
    description: "Complete 5 adventures",
    category: "explorer",
    icon: "MapPin",
    target_value: 5,
    xp_reward: 250,
    difficulty: "bronze",
  },
  {
    title: "Adventurer",
    description: "Complete 10 adventures",
    category: "explorer",
    icon: "Mountain",
    target_value: 10,
    xp_reward: 500,
    difficulty: "silver",
  },
  {
    title: "Adventure Master",
    description: "Complete 25 adventures",
    category: "explorer",
    icon: "Trophy",
    target_value: 25,
    xp_reward: 1000,
    difficulty: "gold",
  },
  {
    title: "Legend",
    description: "Complete 50 adventures",
    category: "explorer",
    icon: "Award",
    target_value: 50,
    xp_reward: 2500,
    difficulty: "platinum",
  },

  // Photographer Milestones
  {
    title: "First Photo",
    description: "Capture your first adventure photo",
    category: "photographer",
    icon: "Camera",
    target_value: 1,
    xp_reward: 50,
    difficulty: "bronze",
  },
  {
    title: "Photo Collector",
    description: "Capture 25 adventure photos",
    category: "photographer",
    icon: "Camera",
    target_value: 25,
    xp_reward: 200,
    difficulty: "bronze",
  },
  {
    title: "Picture Perfect",
    description: "Capture 100 adventure photos",
    category: "photographer",
    icon: "Eye",
    target_value: 100,
    xp_reward: 500,
    difficulty: "silver",
  },
  {
    title: "Photography Master",
    description: "Capture 250 adventure photos",
    category: "photographer",
    icon: "Star",
    target_value: 250,
    xp_reward: 1000,
    difficulty: "gold",
  },

  // Distance Milestones
  {
    title: "First Steps",
    description: "Travel 1 mile on adventures",
    category: "distance",
    icon: "Map",
    target_value: 1,
    xp_reward: 50,
    difficulty: "bronze",
  },
  {
    title: "Walker",
    description: "Travel 10 miles on adventures",
    category: "distance",
    icon: "Map",
    target_value: 10,
    xp_reward: 200,
    difficulty: "bronze",
  },
  {
    title: "Hiker",
    description: "Travel 50 miles on adventures",
    category: "distance",
    icon: "Mountain",
    target_value: 50,
    xp_reward: 500,
    difficulty: "silver",
  },
  {
    title: "Distance Master",
    description: "Travel 100 miles on adventures",
    category: "distance",
    icon: "Target",
    target_value: 100,
    xp_reward: 1000,
    difficulty: "gold",
  },

  // Social Milestones
  {
    title: "Family Adventure",
    description: "Complete 3 dog-friendly adventures",
    category: "social",
    icon: "Users",
    target_value: 3,
    xp_reward: 200,
    difficulty: "bronze",
  },
  {
    title: "Pack Leader",
    description: "Complete 10 dog-friendly adventures",
    category: "social",
    icon: "Heart",
    target_value: 10,
    xp_reward: 500,
    difficulty: "silver",
  },

  // Weather Milestones
  {
    title: "Weather Warrior",
    description: "Adventure in 3 different weather conditions",
    category: "weather",
    icon: "Zap",
    target_value: 3,
    xp_reward: 300,
    difficulty: "silver",
  },
  {
    title: "All Weather Explorer",
    description: "Adventure in 5 different weather conditions",
    category: "weather",
    icon: "Zap",
    target_value: 5,
    xp_reward: 750,
    difficulty: "gold",
  },
];

/**
 * Calculate real milestone progress from journal entries
 */
export async function calculateRealMilestones(): Promise<RealMilestone[]> {
  try {
    console.log("📊 Calculating real milestones from journal data...");

    // Fetch all journal entries
    const { data: journalEntries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Failed to fetch journal entries:", error);
      return [];
    }

    if (!journalEntries || journalEntries.length === 0) {
      console.log("No journal entries found, returning empty milestones");
      return MILESTONE_TEMPLATES.map((template) => ({
        ...template,
        id: generateMilestoneId(template.title),
        current_value: 0,
        completed: false,
        progress_percentage: 0,
      }));
    }

    console.log(
      `📖 Processing ${journalEntries.length} journal entries for milestones...`,
    );

    // Calculate stats from real data
    const stats = {
      total_adventures: journalEntries.length,
      total_photos: journalEntries.reduce(
        (sum, entry) => sum + (entry.photos?.length || 0),
        0,
      ),
      total_distance: journalEntries.reduce(
        (sum, entry) => sum + (entry.miles_traveled || 0),
        0,
      ),
      unique_locations: new Set(
        journalEntries.map((entry) => entry.location?.toLowerCase().trim()),
      ).size,
      unique_weather: new Set(
        journalEntries.map((entry) => entry.weather?.toLowerCase().trim()),
      ).size,
      dog_friendly_count: journalEntries.filter(
        (entry) => entry.dog_friendly === true,
      ).length,
      paid_activities_count: journalEntries.filter(
        (entry) => entry.paid_activity === true,
      ).length,
    };

    console.log("📊 Calculated stats:", stats);

    // Generate milestones with real progress
    const milestones: RealMilestone[] = MILESTONE_TEMPLATES.map((template) => {
      let currentValue = 0;

      // Calculate current value based on milestone type
      switch (template.category) {
        case "explorer":
          if (
            template.title.includes("adventure") ||
            template.title.includes("Adventure")
          ) {
            currentValue = stats.total_adventures;
          }
          break;

        case "photographer":
          if (
            template.title.includes("photo") ||
            template.title.includes("Photo")
          ) {
            currentValue = stats.total_photos;
          }
          break;

        case "distance":
          if (
            template.title.includes("mile") ||
            template.title.includes("Travel")
          ) {
            currentValue = stats.total_distance;
          }
          break;

        case "social":
          if (template.title.includes("dog-friendly")) {
            currentValue = stats.dog_friendly_count;
          }
          break;

        case "weather":
          if (template.title.includes("weather")) {
            currentValue = stats.unique_weather;
          }
          break;
      }

      const completed = currentValue >= template.target_value;
      const progress_percentage = Math.min(
        (currentValue / template.target_value) * 100,
        100,
      );

      const milestone: RealMilestone = {
        ...template,
        id: generateMilestoneId(template.title),
        current_value: currentValue,
        completed,
        progress_percentage,
        completed_date: completed ? new Date().toISOString() : undefined,
      };

      return milestone;
    });

    console.log(
      `✅ Generated ${milestones.length} milestones, ${milestones.filter((m) => m.completed).length} completed`,
    );

    // Cache results
    localStorage.setItem("real_milestones", JSON.stringify(milestones));
    localStorage.setItem("milestone_stats", JSON.stringify(stats));

    return milestones;
  } catch (error) {
    console.error("❌ Failed to calculate real milestones:", error);
    debugNetworkError(error);

    // Return cached or default milestones
    const cached = localStorage.getItem("real_milestones");
    if (cached) {
      console.log("📱 Using cached milestones");
      return JSON.parse(cached);
    }

    return MILESTONE_TEMPLATES.map((template) => ({
      ...template,
      id: generateMilestoneId(template.title),
      current_value: 0,
      completed: false,
      progress_percentage: 0,
    }));
  }
}

/**
 * Get milestone statistics from real data
 */
export async function getRealMilestoneStats(): Promise<MilestoneStats> {
  try {
    const milestones = await calculateRealMilestones();
    const completed = milestones.filter((m) => m.completed);

    const { data: journalEntries } = await supabase
      .from("journal_entries")
      .select("*");

    const stats: MilestoneStats = {
      total_adventures: journalEntries?.length || 0,
      total_distance:
        journalEntries?.reduce(
          (sum, entry) => sum + (entry.miles_traveled || 0),
          0,
        ) || 0,
      total_locations:
        new Set(
          journalEntries?.map((entry) => entry.location?.toLowerCase().trim()),
        ).size || 0,
      total_photos:
        journalEntries?.reduce(
          (sum, entry) => sum + (entry.photos?.length || 0),
          0,
        ) || 0,
      unique_weather_conditions:
        new Set(
          journalEntries?.map((entry) => entry.weather?.toLowerCase().trim()),
        ).size || 0,
      dog_friendly_adventures:
        journalEntries?.filter((entry) => entry.dog_friendly === true).length ||
        0,
      paid_activities:
        journalEntries?.filter((entry) => entry.paid_activity === true)
          .length || 0,
      completion_percentage: (completed.length / milestones.length) * 100,
      total_xp: completed.reduce((sum, m) => sum + m.xp_reward, 0),
      completed_milestones: completed.length,
      available_milestones: milestones.length,
    };

    localStorage.setItem("real_milestone_stats", JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error("Failed to get real milestone stats:", error);

    const cached = localStorage.getItem("real_milestone_stats");
    if (cached) {
      return JSON.parse(cached);
    }

    return {
      total_adventures: 0,
      total_distance: 0,
      total_locations: 0,
      total_photos: 0,
      unique_weather_conditions: 0,
      dog_friendly_adventures: 0,
      paid_activities: 0,
      completion_percentage: 0,
      total_xp: 0,
      completed_milestones: 0,
      available_milestones: MILESTONE_TEMPLATES.length,
    };
  }
}

/**
 * Subscribe to journal changes and recalculate milestones
 */
export function subscribeToRealMilestones(
  callback: (milestones: RealMilestone[]) => void,
): () => void {
  console.log("🔄 Setting up real-time milestone calculation...");

  const subscription = supabase
    .channel("milestone_journal_sync")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "journal_entries",
      },
      async (payload) => {
        console.log("🔄 Journal changed, recalculating milestones...");
        const updatedMilestones = await calculateRealMilestones();
        callback(updatedMilestones);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Filter milestones by category
 */
export function filterMilestonesByCategory(
  milestones: RealMilestone[],
  category: string,
): RealMilestone[] {
  if (category === "all") return milestones;
  return milestones.filter((m) => m.category === category);
}

/**
 * Get milestones by completion status
 */
export function getMilestonesByStatus(
  milestones: RealMilestone[],
  completed: boolean,
): RealMilestone[] {
  return milestones.filter((m) => m.completed === completed);
}

/**
 * Generate consistent milestone ID
 */
function generateMilestoneId(title: string): string {
  return `milestone_${title
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")}`;
}

/**
 * Get next milestone suggestions
 */
export function getNextMilestones(
  milestones: RealMilestone[],
): RealMilestone[] {
  return milestones
    .filter((m) => !m.completed && m.current_value > 0)
    .sort((a, b) => b.progress_percentage - a.progress_percentage)
    .slice(0, 3);
}

/**
 * Get recently completed milestones
 */
export function getRecentlyCompleted(
  milestones: RealMilestone[],
): RealMilestone[] {
  return milestones
    .filter((m) => m.completed && m.completed_date)
    .sort(
      (a, b) =>
        new Date(b.completed_date!).getTime() -
        new Date(a.completed_date!).getTime(),
    )
    .slice(0, 5);
}
