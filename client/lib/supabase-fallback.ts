// Fallback stubs for remaining Supabase services
// These provide basic functionality while we use Hasura for core features

export const homePageSyncService = {
  loadHomePageData: async () => ({
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
  }),
};

export const appSettingsService = {
  getAppSettings: async () => ({}),
  updateAppSettings: async () => ({}),
};

export const syncService = {
  syncData: async () => ({ success: true }),
  isOnline: () => true,
};

export const journalCommentsService = {
  getComments: async () => [],
  addComment: async () => ({}),
  getLikes: async () => [],
};

export const milestonesService = {
  getMilestones: async () => [],
  updateMilestone: async () => ({}),
};

export const milestoneTracker = {
  trackProgress: async () => ({}),
  updateProgress: async () => ({}),
};

export const realMilestonesService = {
  getRealMilestones: async () => [],
  updateRealMilestone: async () => ({}),
};
