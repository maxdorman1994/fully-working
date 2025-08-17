import { supabase, isSupabaseConfigured, JournalEntry } from "./supabase";
import { updateMilestoneProgress } from "./milestonesService";

/**
 * Milestone Tracker Service
 * Automatically updates milestone progress based on journal entry data
 */

/**
 * Update milestones based on journal entry data
 */
export async function updateMilestonesFromJournalEntry(
  entry: JournalEntry,
  userId: string = "demo-user",
  isNewEntry: boolean = true,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, skipping milestone updates");
    return;
  }

  try {
    console.log("🎯 Updating milestones from journal entry:", entry.title);

    // Basic milestones for any journal entry
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "journal-keeper", 1);
      console.log("📝 Updated Journal Keeper milestone");
    }

    // Photo-related milestones
    if (entry.photos && entry.photos.length > 0) {
      await updateMilestoneProgress(
        userId,
        "photo-collector",
        entry.photos.length,
      );
      console.log(
        `📸 Updated Photo Collector milestone (+${entry.photos.length})`,
      );

      if (isNewEntry) {
        await updateMilestoneProgress(userId, "photo-variety", 1);
        console.log("🎨 Updated Photo Variety milestone");
      }
    }

    // Tag-related milestones
    if (entry.tags && entry.tags.length > 0) {
      // Get unique tags for tag master milestone
      const uniqueTags = await getUniqueTagsCount(userId);
      await setMilestoneProgress(userId, "tag-master", uniqueTags);
      console.log(
        `🏷️ Updated Tag Master milestone (${uniqueTags} unique tags)`,
      );
    }

    // Location-based milestones
    if (entry.location && isNewEntry) {
      const uniqueLocations = await getUniqueLocationsCount(userId);
      await setMilestoneProgress(userId, "highland-explorer", uniqueLocations);
      console.log(
        `🏔️ Updated Highland Explorer milestone (${uniqueLocations} locations)`,
      );
    }

    // Miles traveled milestone
    if (entry.miles_traveled && entry.miles_traveled > 0) {
      const totalMiles = await getTotalMilesTraveled(userId);
      await setMilestoneProgress(userId, "distance-tracker", totalMiles);
      console.log(
        `🚗 Updated Distance Tracker milestone (${totalMiles} miles)`,
      );
    }

    // Weather-related milestones
    if (entry.weather && isNewEntry) {
      const uniqueWeatherConditions = await getUniqueWeatherConditions(userId);
      await setMilestoneProgress(
        userId,
        "weather-explorer",
        uniqueWeatherConditions,
      );
      console.log(
        `🌤️ Updated Weather Explorer milestone (${uniqueWeatherConditions} conditions)`,
      );
    }

    // Mood tracking milestone
    if (entry.mood && isNewEntry) {
      const uniqueMoods = await getUniqueMoods(userId);
      await setMilestoneProgress(userId, "mood-tracker", uniqueMoods);
      console.log(`😊 Updated Mood Tracker milestone (${uniqueMoods} moods)`);
    }

    // Family adventure milestone (check if entry includes family-related tags)
    if (
      entry.tags &&
      entry.tags.some((tag) =>
        [
          "family",
          "kids",
          "children",
          "together",
          "dad",
          "mum",
          "parents",
        ].includes(tag.toLowerCase()),
      ) &&
      isNewEntry
    ) {
      await updateMilestoneProgress(userId, "family-time", 1);
      console.log("👨‍👩‍👧‍👦 Updated Family Time milestone");
    }

    // Memory maker milestone (entries with tags)
    if (entry.tags && entry.tags.length > 0 && isNewEntry) {
      await updateMilestoneProgress(userId, "memory-maker", 1);
      console.log("💭 Updated Memory Maker milestone");
    }

    // Adventure type specific milestones
    await updateAdventureTypeSpecificMilestones(entry, userId, isNewEntry);

    // Time-based milestones
    await updateTimeBasisedMilestones(userId);

    console.log("✅ Milestone updates completed successfully");
  } catch (error) {
    console.error("Error updating milestones from journal entry:", error);
  }
}

/**
 * Update adventure type specific milestones
 */
async function updateAdventureTypeSpecificMilestones(
  entry: JournalEntry,
  userId: string,
  isNewEntry: boolean,
): Promise<void> {
  const content = (
    entry.title +
    " " +
    entry.content +
    " " +
    (entry.tags?.join(" ") || "")
  ).toLowerCase();

  // Castle-related milestones
  if (
    content.includes("castle") ||
    content.includes("fortress") ||
    content.includes("palace")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "castle-conqueror", 1);
      console.log("🏰 Updated Castle Conqueror milestone");
    }
  }

  // Munro/Mountain milestones
  if (
    content.includes("munro") ||
    content.includes("mountain") ||
    content.includes("peak") ||
    content.includes("summit")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "munro-beginner", 1);
      console.log("⛰️ Updated Munro Beginner milestone");
    }
  }

  // Loch/Lake milestones
  if (
    content.includes("loch") ||
    content.includes("lake") ||
    content.includes("water")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "loch-legend", 1);
      console.log("🏞️ Updated Loch Legend milestone");
    }
  }

  // Beach milestones
  if (
    content.includes("beach") ||
    content.includes("coast") ||
    content.includes("shore") ||
    content.includes("sea")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "beach-comber", 1);
      console.log("🏖️ Updated Beach Comber milestone");
    }
  }

  // Forest/Nature milestones
  if (
    content.includes("forest") ||
    content.includes("wood") ||
    content.includes("trees") ||
    content.includes("nature")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "forest-walker", 1);
      console.log("🌲 Updated Forest Walker milestone");
    }
  }

  // Waterfall milestones
  if (
    content.includes("waterfall") ||
    content.includes("falls") ||
    content.includes("cascade")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "waterfall-hunter", 1);
      console.log("���� Updated Waterfall Hunter milestone");
    }
  }

  // Bridge milestones
  if (content.includes("bridge") || content.includes("crossing")) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "bridge-crosser", 1);
      console.log("🌉 Updated Bridge Crosser milestone");
    }
  }

  // Island milestones
  if (content.includes("island") || content.includes("isle")) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "island-hopper", 1);
      console.log("🏝️ Updated Island Hopper milestone");
    }
  }

  // Wildlife milestones
  if (
    content.includes("wildlife") ||
    content.includes("animal") ||
    content.includes("bird") ||
    content.includes("deer") ||
    content.includes("seal") ||
    content.includes("otter")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "wildlife-spotter", 1);
      console.log("🦌 Updated Wildlife Spotter milestone");
    }
  }

  // Cultural/Heritage milestones
  if (
    content.includes("heritage") ||
    content.includes("historic") ||
    content.includes("museum") ||
    content.includes("culture") ||
    content.includes("traditional")
  ) {
    if (isNewEntry) {
      await updateMilestoneProgress(userId, "heritage-explorer", 1);
      console.log("🏛️ Updated Heritage Explorer milestone");
    }
  }
}

/**
 * Update time-based milestones
 */
async function updateTimeBasisedMilestones(userId: string): Promise<void> {
  try {
    // Get journal entries from last 30 days to check consistency
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentEntries, error } = await supabase
      .from("journal_entries")
      .select("date")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error(
        "Error fetching recent entries for time milestones:",
        error,
      );
      return;
    }

    // Check for consecutive days
    if (recentEntries && recentEntries.length > 0) {
      const consecutiveDays = calculateConsecutiveDays(
        recentEntries.map((e) => e.date),
      );
      await setMilestoneProgress(
        userId,
        "consistent-adventurer",
        consecutiveDays,
      );
      console.log(
        `⏰ Updated Consistent Adventurer milestone (${consecutiveDays} consecutive days)`,
      );
    }

    // Check for seasonal exploration
    const uniqueSeasons = await getUniqueSeasons(userId);
    await setMilestoneProgress(userId, "seasonal-explorer", uniqueSeasons);
    console.log(
      `🍂 Updated Seasonal Explorer milestone (${uniqueSeasons} seasons)`,
    );
  } catch (error) {
    console.error("Error updating time-based milestones:", error);
  }
}

/**
 * Helper function to set milestone progress to a specific value
 */
async function setMilestoneProgress(
  userId: string,
  milestoneId: string,
  targetProgress: number,
): Promise<void> {
  try {
    // Get current progress
    const { data: currentProgress, error } = await supabase
      .from("user_milestone_progress")
      .select("current_progress")
      .eq("user_id", userId)
      .eq("milestone_id", milestoneId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error getting current progress:", error);
      return;
    }

    const current = currentProgress?.current_progress || 0;

    if (targetProgress > current) {
      const increment = targetProgress - current;
      await updateMilestoneProgress(userId, milestoneId, increment);
    }
  } catch (error) {
    console.error("Error setting milestone progress:", error);
  }
}

/**
 * Get count of unique locations visited
 */
async function getUniqueLocationsCount(userId: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("location")
    .not("location", "is", null)
    .not("location", "eq", "");

  if (error) {
    console.error("Error getting unique locations:", error);
    return 0;
  }

  const uniqueLocations = new Set(
    entries?.map((e) => e.location.trim().toLowerCase()),
  );
  return uniqueLocations.size;
}

/**
 * Get count of unique tags used
 */
async function getUniqueTagsCount(userId: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("tags");

  if (error) {
    console.error("Error getting unique tags:", error);
    return 0;
  }

  const allTags = entries?.flatMap((entry) => entry.tags || []) || [];
  const uniqueTags = new Set(allTags.map((tag) => tag.trim().toLowerCase()));
  return uniqueTags.size;
}

/**
 * Get total miles traveled
 */
async function getTotalMilesTraveled(userId: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("miles_traveled");

  if (error) {
    console.error("Error getting total miles:", error);
    return 0;
  }

  return (
    entries?.reduce((total, entry) => total + (entry.miles_traveled || 0), 0) ||
    0
  );
}

/**
 * Get count of unique weather conditions
 */
async function getUniqueWeatherConditions(userId: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("weather")
    .not("weather", "is", null)
    .not("weather", "eq", "");

  if (error) {
    console.error("Error getting unique weather conditions:", error);
    return 0;
  }

  const uniqueWeather = new Set(
    entries?.map((e) => e.weather.trim().toLowerCase()),
  );
  return uniqueWeather.size;
}

/**
 * Get count of unique moods
 */
async function getUniqueMoods(userId: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("mood")
    .not("mood", "is", null)
    .not("mood", "eq", "");

  if (error) {
    console.error("Error getting unique moods:", error);
    return 0;
  }

  const uniqueMoods = new Set(entries?.map((e) => e.mood.trim().toLowerCase()));
  return uniqueMoods.size;
}

/**
 * Get count of unique seasons adventured in
 */
async function getUniqueSeasons(userId: string): Promise<number> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("date");

  if (error) {
    console.error("Error getting entries for seasons:", error);
    return 0;
  }

  const seasons = new Set();
  entries?.forEach((entry) => {
    const date = new Date(entry.date);
    const month = date.getMonth() + 1; // 1-12

    if ([12, 1, 2].includes(month)) seasons.add("winter");
    else if ([3, 4, 5].includes(month)) seasons.add("spring");
    else if ([6, 7, 8].includes(month)) seasons.add("summer");
    else if ([9, 10, 11].includes(month)) seasons.add("autumn");
  });

  return seasons.size;
}

/**
 * Calculate consecutive days of adventure
 */
function calculateConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates.sort();
  let maxConsecutive = 1;
  let currentConsecutive = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = new Date(sortedDates[i - 1]);
    const diffTime = Math.abs(currentDate.getTime() - previousDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }

  return maxConsecutive;
}

/**
 * Process all existing journal entries to update milestones
 */
export async function recalculateAllMilestones(
  userId: string = "demo-user",
): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, skipping milestone recalculation");
    return;
  }

  try {
    console.log(
      "🔄 Recalculating all milestones from existing journal entries...",
    );

    // Get all journal entries
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching entries for recalculation:", error);
      return;
    }

    if (!entries || entries.length === 0) {
      console.log("No journal entries found for milestone calculation");
      return;
    }

    // Process each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isNewEntry = true; // Count each as contributing to milestones
      await updateMilestonesFromJournalEntry(entry, userId, isNewEntry);
    }

    console.log(
      `✅ Recalculated milestones from ${entries.length} journal entries`,
    );
  } catch (error) {
    console.error("Error recalculating milestones:", error);
  }
}

/**
 * Initialize milestone tracking for first-time setup
 */
export async function initializeMilestoneTracking(
  userId: string = "demo-user",
): Promise<void> {
  try {
    console.log("🎯 Initializing milestone tracking...");

    // Check if user has any milestone progress
    const { data: existingProgress, error } = await supabase
      .from("user_milestone_progress")
      .select("*")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error("Error checking existing progress:", error);
      return;
    }

    // If no progress exists, set up initial milestones
    if (!existingProgress || existingProgress.length === 0) {
      console.log("Setting up initial milestone progress...");

      // Award basic "first" milestones if journal entries exist
      const { data: entries, error: entriesError } = await supabase
        .from("journal_entries")
        .select("*")
        .limit(1);

      if (!entriesError && entries && entries.length > 0) {
        // Award first milestones
        await updateMilestoneProgress(userId, "first-adventure", 1);
        await updateMilestoneProgress(userId, "first-journal", 1);

        // Check for photos
        const hasPhotos = entries.some((e) => e.photos && e.photos.length > 0);
        if (hasPhotos) {
          await updateMilestoneProgress(userId, "photo-memories", 1);
          await updateMilestoneProgress(userId, "first-upload", 1);
        }

        // Check adventure date
        const firstEntry = entries[0];
        const entryDate = new Date(firstEntry.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        if (entryDate >= weekAgo) {
          await updateMilestoneProgress(userId, "early-bird", 1);
        }

        console.log("✅ Initial milestones awarded");
      }

      // Recalculate all milestones from existing data
      await recalculateAllMilestones(userId);
    }

    console.log("✅ Milestone tracking initialized");
  } catch (error) {
    console.error("Error initializing milestone tracking:", error);
  }
}
