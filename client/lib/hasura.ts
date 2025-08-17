import { GraphQLClient } from "graphql-request";

// Hasura configuration
const hasuraUrl = import.meta.env.VITE_HASURA_GRAPHQL_URL || "";
const hasuraAdminSecret = import.meta.env.VITE_HASURA_ADMIN_SECRET || "";

console.log("🔧 Hasura Configuration Check:", {
  hasUrl: !!hasuraUrl,
  hasSecret: !!hasuraAdminSecret,
  urlFormat: hasuraUrl
    ? hasuraUrl.startsWith("https://")
      ? "Valid HTTPS URL"
      : "Invalid URL format"
    : "Missing",
});

if (!hasuraUrl) {
  console.warn(
    "⚠️  Hasura configuration missing. Please set VITE_HASURA_GRAPHQL_URL",
  );
}

// Create Hasura GraphQL client
export const hasuraClient = new GraphQLClient(hasuraUrl, {
  headers: hasuraAdminSecret
    ? {
        "x-hasura-admin-secret": hasuraAdminSecret,
      }
    : {},
});

// Database types for Hasura tables (same as before)
export interface JournalEntry {
  id: string;
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
  photos: string[]; // Array of Cloudflare R2 URLs
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  position_index: number;
  colors: any;
  created_at?: string;
  updated_at?: string;
}

export interface AdventureStat {
  id: string;
  stat_type: string;
  stat_value: number;
  stat_description?: string;
  last_updated: string;
  created_at: string;
}

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
  category: string;
  family_votes: number;
  notes: string;
  target_date?: string;
  researched: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessedPhoto {
  id: string;
  file: File;
  originalFile: File;
  preview: string;
  isProcessing: boolean;
  uploadProgress: number;
  cloudflareUrl?: string; // R2 URL
  error?: string;
}

// GraphQL Queries
export const GET_JOURNAL_ENTRIES = `
  query GetJournalEntries {
    journal_entries(order_by: {date: desc}) {
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
    }
  }
`;

export const GET_RECENT_ADVENTURES = `
  query GetRecentAdventures {
    recent_adventures {
      id
      title
      location
      formatted_date
      featured_image
      tags
      excerpt
      photo_count
      tag_count
    }
  }
`;

export const GET_FAMILY_MEMBERS = `
  query GetFamilyMembers {
    family_members_with_stats(order_by: {position_index: asc}) {
      id
      name
      role
      bio
      display_avatar
      colors
      position_index
    }
  }
`;

export const GET_ADVENTURE_STATS = `
  query GetAdventureStats {
    adventure_stats_summary(order_by: {display_order: asc}) {
      stat_type
      stat_value
      stat_description
      last_updated
      is_primary_stat
    }
  }
`;

export const GET_PRIMARY_STATS = `
  query GetPrimaryStats {
    primary_adventure_stats {
      stat_type
      stat_value
      stat_description
      last_updated
    }
  }
`;

export const GET_WISHLIST_ITEMS = `
  query GetWishlistItems {
    wishlist_items(order_by: {family_votes: desc}) {
      id
      title
      location
      description
      priority
      status
      estimated_cost
      best_seasons
      duration
      category
      family_votes
      notes
      target_date
      researched
      created_at
      updated_at
    }
  }
`;

export const INSERT_JOURNAL_ENTRY = `
  mutation InsertJournalEntry($entry: journal_entries_insert_input!) {
    insert_journal_entries_one(object: $entry) {
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
      is_scenic_drive
      scenic_stops
      created_at
      updated_at
    }
  }
`;

export const UPDATE_JOURNAL_ENTRY = `
  mutation UpdateJournalEntry($id: uuid!, $entry: journal_entries_set_input!) {
    update_journal_entries_by_pk(pk_columns: {id: $id}, _set: $entry) {
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
    }
  }
`;

export const DELETE_JOURNAL_ENTRY = `
  mutation DeleteJournalEntry($id: uuid!) {
    delete_journal_entries_by_pk(id: $id) {
      id
    }
  }
`;

// Adventure Stats GraphQL Queries
export const GET_ADVENTURE_STATS_SUMMARY = `
  query GetAdventureStatsSummary {
    adventure_stats_summary(order_by: {display_order: asc}) {
      stat_type
      stat_value
      stat_description
      last_updated
      is_primary_stat
      display_order
    }
  }
`;

export const GET_PRIMARY_ADVENTURE_STATS = `
  query GetPrimaryAdventureStats {
    primary_adventure_stats {
      stat_type
      stat_value
      stat_description
      last_updated
    }
  }
`;

export const UPDATE_ADVENTURE_STAT = `
  mutation UpdateAdventureStat($stat_type: String!, $value: numeric!, $description: String) {
    update_adventure_stats(where: {stat_type: {_eq: $stat_type}}, _set: {stat_value: $value, stat_description: $description, last_updated: "now()"}) {
      affected_rows
      returning {
        stat_type
        stat_value
        stat_description
        last_updated
      }
    }
  }
`;

export const INCREMENT_ADVENTURE_STAT = `
  mutation IncrementAdventureStat($stat_type: String!, $increment: numeric!) {
    update_adventure_stats(where: {stat_type: {_eq: $stat_type}}, _inc: {stat_value: $increment}, _set: {last_updated: "now()"}) {
      affected_rows
      returning {
        stat_type
        stat_value
        stat_description
        last_updated
      }
    }
  }
`;

// Wishlist GraphQL Queries
export const INSERT_WISHLIST_ITEM = `
  mutation InsertWishlistItem($item: wishlist_items_insert_input!) {
    insert_wishlist_items_one(object: $item) {
      id
      title
      location
      description
      priority
      status
      estimated_cost
      best_seasons
      duration
      category
      family_votes
      notes
      target_date
      researched
      created_at
      updated_at
    }
  }
`;

export const UPDATE_WISHLIST_ITEM = `
  mutation UpdateWishlistItem($id: uuid!, $item: wishlist_items_set_input!) {
    update_wishlist_items_by_pk(pk_columns: {id: $id}, _set: $item) {
      id
      title
      location
      description
      priority
      status
      estimated_cost
      best_seasons
      duration
      category
      family_votes
      notes
      target_date
      researched
      created_at
      updated_at
    }
  }
`;

export const DELETE_WISHLIST_ITEM = `
  mutation DeleteWishlistItem($id: uuid!) {
    delete_wishlist_items_by_pk(id: $id) {
      id
    }
  }
`;

export const INCREMENT_WISHLIST_VOTES = `
  mutation IncrementWishlistVotes($id: uuid!, $increment: Int!) {
    update_wishlist_items_by_pk(pk_columns: {id: $id}, _inc: {family_votes: $increment}) {
      id
      title
      location
      description
      priority
      status
      estimated_cost
      best_seasons
      duration
      category
      family_votes
      notes
      target_date
      researched
      created_at
      updated_at
    }
  }
`;

export const TOGGLE_WISHLIST_RESEARCH = `
  mutation ToggleWishlistResearch($id: uuid!, $researched: Boolean!) {
    update_wishlist_items_by_pk(pk_columns: {id: $id}, _set: {researched: $researched}) {
      id
      title
      location
      description
      priority
      status
      estimated_cost
      best_seasons
      duration
      category
      family_votes
      notes
      target_date
      researched
      created_at
      updated_at
    }
  }
`;

// Castles and Lochs GraphQL Queries
export const GET_CASTLES = `
  query GetCastles {
    castles(order_by: {rank: asc}) {
      id
      name
      region
      type
      built_century
      latitude
      longitude
      description
      visiting_info
      best_seasons
      admission_fee
      managed_by
      accessibility
      rank
      is_custom
      created_at
      updated_at
    }
  }
`;

export const GET_LOCHS = `
  query GetLochs {
    lochs(order_by: {rank: asc}) {
      id
      name
      region
      type
      length_km
      max_depth_m
      latitude
      longitude
      description
      activities
      best_seasons
      famous_for
      nearest_town
      rank
      is_custom
      created_at
      updated_at
    }
  }
`;

export const GET_CASTLE_VISITS = `
  query GetCastleVisits {
    castle_visits {
      id
      castle_id
      visited_date
      notes
      photo_count
      weather_conditions
      visit_duration
      favorite_part
      would_recommend
      created_at
      updated_at
    }
  }
`;

export const GET_LOCH_VISITS = `
  query GetLochVisits {
    loch_visits {
      id
      loch_id
      visited_date
      notes
      photo_count
      weather_conditions
      activities_done
      water_temperature
      wildlife_spotted
      would_recommend
      created_at
      updated_at
    }
  }
`;

export const INSERT_CASTLE_VISIT = `
  mutation InsertCastleVisit($visit: castle_visits_insert_input!) {
    insert_castle_visits_one(object: $visit, on_conflict: {constraint: castle_visits_castle_id_key, update_columns: [visited_date, notes, photo_count, weather_conditions, visit_duration, favorite_part, would_recommend, updated_at]}) {
      id
      castle_id
      visited_date
      notes
      photo_count
      weather_conditions
      visit_duration
      favorite_part
      would_recommend
      created_at
      updated_at
    }
  }
`;

export const INSERT_LOCH_VISIT = `
  mutation InsertLochVisit($visit: loch_visits_insert_input!) {
    insert_loch_visits_one(object: $visit, on_conflict: {constraint: loch_visits_loch_id_key, update_columns: [visited_date, notes, photo_count, weather_conditions, activities_done, water_temperature, wildlife_spotted, would_recommend, updated_at]}) {
      id
      loch_id
      visited_date
      notes
      photo_count
      weather_conditions
      activities_done
      water_temperature
      wildlife_spotted
      would_recommend
      created_at
      updated_at
    }
  }
`;

export const DELETE_CASTLE_VISIT = `
  mutation DeleteCastleVisit($castle_id: String!) {
    delete_castle_visits(where: {castle_id: {_eq: $castle_id}}) {
      affected_rows
    }
  }
`;

export const DELETE_LOCH_VISIT = `
  mutation DeleteLochVisit($loch_id: String!) {
    delete_loch_visits(where: {loch_id: {_eq: $loch_id}}) {
      affected_rows
    }
  }
`;

export const INSERT_CUSTOM_CASTLE = `
  mutation InsertCustomCastle($castle: castles_insert_input!) {
    insert_castles_one(object: $castle) {
      id
      name
      region
      type
      built_century
      latitude
      longitude
      description
      visiting_info
      best_seasons
      admission_fee
      managed_by
      accessibility
      rank
      is_custom
      created_at
      updated_at
    }
  }
`;

export const INSERT_CUSTOM_LOCH = `
  mutation InsertCustomLoch($loch: lochs_insert_input!) {
    insert_lochs_one(object: $loch) {
      id
      name
      region
      type
      length_km
      max_depth_m
      latitude
      longitude
      description
      activities
      best_seasons
      famous_for
      nearest_town
      rank
      is_custom
      created_at
      updated_at
    }
  }
`;

export const DELETE_CUSTOM_CASTLE = `
  mutation DeleteCustomCastle($id: String!) {
    delete_castles_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_CUSTOM_LOCH = `
  mutation DeleteCustomLoch($id: String!) {
    delete_lochs_by_pk(id: $id) {
      id
    }
  }
`;

// Munro GraphQL Queries
export const GET_MUNROS = `
  query GetMunros {
    munros(order_by: {rank: asc}) {
      id
      name
      height
      region
      difficulty
      latitude
      longitude
      description
      estimated_time
      best_seasons
      os_grid_ref
      rank
      created_at
      updated_at
    }
  }
`;

export const GET_MUNRO_COMPLETIONS = `
  query GetMunroCompletions {
    munro_completions {
      id
      munro_id
      completed_date
      notes
      photo_count
      weather_conditions
      climbing_time
      created_at
      updated_at
    }
  }
`;

export const INSERT_MUNRO_COMPLETION = `
  mutation InsertMunroCompletion($completion: munro_completions_insert_input!) {
    insert_munro_completions_one(object: $completion, on_conflict: {constraint: munro_completions_munro_id_key, update_columns: [completed_date, notes, photo_count, weather_conditions, climbing_time, updated_at]}) {
      id
      munro_id
      completed_date
      notes
      photo_count
      weather_conditions
      climbing_time
      created_at
      updated_at
    }
  }
`;

export const UPDATE_MUNRO_COMPLETION = `
  mutation UpdateMunroCompletion($munro_id: String!, $completion: munro_completions_set_input!) {
    update_munro_completions(where: {munro_id: {_eq: $munro_id}}, _set: $completion) {
      affected_rows
      returning {
        id
        munro_id
        completed_date
        notes
        photo_count
        weather_conditions
        climbing_time
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_MUNRO_COMPLETION = `
  mutation DeleteMunroCompletion($munro_id: String!) {
    delete_munro_completions(where: {munro_id: {_eq: $munro_id}}) {
      affected_rows
    }
  }
`;

export const INSERT_CUSTOM_MUNRO = `
  mutation InsertCustomMunro($munro: munros_insert_input!) {
    insert_munros_one(object: $munro) {
      id
      name
      height
      region
      difficulty
      latitude
      longitude
      description
      estimated_time
      best_seasons
      os_grid_ref
      rank
      created_at
      updated_at
    }
  }
`;

/**
 * Check if Hasura is properly configured
 */
export function isHasuraConfigured(): boolean {
  return Boolean(hasuraUrl);
}

/**
 * Get Hasura configuration status
 */
export function getHasuraStatus(): {
  configured: boolean;
  message: string;
  url?: string;
} {
  if (!hasuraUrl) {
    return {
      configured: false,
      message:
        "Hasura not configured. Please set VITE_HASURA_GRAPHQL_URL environment variable.",
    };
  }

  return {
    configured: true,
    message: "Hasura configured successfully",
    url: hasuraUrl,
  };
}

/**
 * Execute GraphQL query
 */
export async function executeQuery<T = any>(
  query: string,
  variables?: any,
): Promise<T> {
  try {
    const data = await hasuraClient.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error("GraphQL query error:", error);
    throw error;
  }
}

/**
 * Execute GraphQL mutation
 */
export async function executeMutation<T = any>(
  mutation: string,
  variables?: any,
): Promise<T> {
  try {
    const data = await hasuraClient.request<T>(mutation, variables);
    return data;
  } catch (error) {
    console.error("GraphQL mutation error:", error);
    throw error;
  }
}
