import {
  hasuraClient,
  FamilyMember,
  isHasuraConfigured,
  executeQuery,
  executeMutation,
  GET_FAMILY_MEMBERS,
} from "./hasura";
import { uploadPhotoToCloudflare, ProcessedPhoto } from "./photoUtils";
import { debugNetworkError } from "./debug";

/**
 * Hasura Family Members Service
 * Handles all database operations for family member profiles via GraphQL
 * Profile pictures are stored in Cloudflare R2, URLs stored in database
 */

/**
 * Get all family members from Hasura
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  if (!isHasuraConfigured()) {
    console.warn("Hasura not configured, using fallback family data");
    // Return fallback data
    return [
      {
        id: "1",
        name: "Max Dorman",
        role: "DAD",
        bio: "Adventure enthusiast and family trip organizer. Loves planning routes, discovering hidden gems, and capturing the perfect Highland sunset photos.",
        position_index: 0,
        colors: {
          bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
          border: "border-blue-200/60",
          accent: "from-blue-500 to-indigo-500",
        },
      },
      {
        id: "2",
        name: "Charlotte Foster",
        role: "MUM",
        bio: "Nature lover and family historian. Documents our adventures and ensures everyone stays safe while exploring Scotland's wild landscapes.",
        position_index: 1,
        colors: {
          bg: "bg-gradient-to-br from-rose-50 to-pink-100",
          border: "border-rose-200/60",
          accent: "from-rose-500 to-pink-500",
        },
      },
      {
        id: "3",
        name: "Oscar",
        role: "SON",
        bio: "Young explorer with boundless energy. Always the first to spot wildlife and loves climbing rocks and splashing in Highland streams.",
        position_index: 2,
        colors: {
          bg: "bg-gradient-to-br from-green-50 to-emerald-100",
          border: "border-green-200/60",
          accent: "from-green-500 to-emerald-500",
        },
      },
      {
        id: "4",
        name: "Rose",
        role: "DAUGHTER",
        bio: "Curious adventurer who collects interesting stones and leaves. Has an amazing memory for the stories behind each place we visit.",
        position_index: 3,
        colors: {
          bg: "bg-gradient-to-br from-purple-50 to-violet-100",
          border: "border-purple-200/60",
          accent: "from-purple-500 to-violet-500",
        },
      },
      {
        id: "5",
        name: "Lola",
        role: "DAUGHTER",
        bio: "Our youngest adventurer with the biggest smile. Brings joy to every journey and reminds us to appreciate the simple moments.",
        position_index: 4,
        colors: {
          bg: "bg-gradient-to-br from-amber-50 to-yellow-100",
          border: "border-amber-200/60",
          accent: "from-amber-500 to-yellow-500",
        },
      },
    ];
  }

  try {
    console.log("🔄 Fetching family members from Hasura...");

    const result = await executeQuery(GET_FAMILY_MEMBERS);

    if (!result.family_members_with_stats) {
      console.warn("No family members found in response");
      return [];
    }

    const members = result.family_members_with_stats as FamilyMember[];
    console.log(`✅ Loaded ${members.length} family members from Hasura`);
    return members;
  } catch (error) {
    console.error("❌ Failed to fetch family members:", error);
    debugNetworkError(error);
    
    // Return fallback data on error
    console.log("Using fallback family member data");
    return getFamilyMembers(); // This will use the fallback since Hasura is not configured
  }
}

/**
 * Update family member profile picture
 */
export async function updateFamilyMemberAvatar(
  memberId: string,
  photo: ProcessedPhoto,
): Promise<FamilyMember> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  try {
    console.log("🔄 Uploading profile picture for member:", memberId);

    // Upload photo to Cloudflare R2
    const uploadedUrl = await uploadPhotoToCloudflare(photo);

    // Update member in Hasura
    const UPDATE_AVATAR = `
      mutation UpdateFamilyMemberAvatar($id: uuid!, $avatar_url: String!) {
        update_family_members_by_pk(
          pk_columns: {id: $id}, 
          _set: {avatar_url: $avatar_url}
        ) {
          id
          name
          role
          avatar_url
          bio
          position_index
          colors
        }
      }
    `;

    const result = await executeMutation(UPDATE_AVATAR, {
      id: memberId,
      avatar_url: uploadedUrl,
    });

    if (!result.update_family_members_by_pk) {
      throw new Error("Failed to update family member avatar");
    }

    console.log("✅ Family member avatar updated successfully");
    return result.update_family_members_by_pk as FamilyMember;
  } catch (error) {
    console.error("❌ Failed to update family member avatar:", error);
    debugNetworkError(error);
    throw error;
  }
}

/**
 * Test Hasura connection for family members
 */
export async function testFamilyMembersConnection(): Promise<{
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
    console.log("🔄 Testing Hasura connection for family members...");

    const TEST_QUERY = `
      query TestFamilyMembersConnection {
        family_members(limit: 1) {
          id
        }
      }
    `;

    await executeQuery(TEST_QUERY);

    console.log("✅ Family members Hasura connection test successful");
    return {
      success: true,
      message: "Hasura connection working",
    };
  } catch (error) {
    console.error("❌ Family members Hasura connection test failed:", error);
    return {
      success: false,
      message: "Connection failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Legacy function name for compatibility
export const testSupabaseConnection = testFamilyMembersConnection;

/**
 * Subscribe to family members changes (placeholder - not implemented for Hasura yet)
 */
export function subscribeToFamilyMembers(callback: (members: FamilyMember[]) => void): () => void {
  console.log("🔄 Family members subscription not implemented for Hasura yet");
  // Return empty unsubscribe function
  return () => {};
}

/**
 * Upload family member avatar (placeholder)
 */
export async function uploadFamilyMemberAvatar(
  memberId: string,
  photo: ProcessedPhoto,
): Promise<FamilyMember> {
  return updateFamilyMemberAvatar(memberId, photo);
}

/**
 * Remove family member avatar (placeholder)
 */
export async function removeFamilyMemberAvatar(memberId: string): Promise<FamilyMember> {
  if (!isHasuraConfigured()) {
    throw new Error("Hasura not configured");
  }

  const UPDATE_AVATAR = `
    mutation RemoveFamilyMemberAvatar($id: uuid!) {
      update_family_members_by_pk(
        pk_columns: {id: $id},
        _set: {avatar_url: null}
      ) {
        id
        name
        role
        avatar_url
        bio
        position_index
        colors
      }
    }
  `;

  const result = await executeMutation(UPDATE_AVATAR, {
    id: memberId,
  });

  if (!result.update_family_members_by_pk) {
    throw new Error("Failed to remove family member avatar");
  }

  return result.update_family_members_by_pk as FamilyMember;
}
