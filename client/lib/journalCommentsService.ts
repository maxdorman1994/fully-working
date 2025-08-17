import { supabase } from "./supabase";

// Debug function to check if tables exist
export async function checkCommentsLikesTables(): Promise<void> {
  try {
    console.log("🔍 Checking if comments and likes tables exist...");

    // Test journal_comments table
    const { data: commentsTest, error: commentsError } = await supabase
      .from("journal_comments")
      .select("count")
      .limit(1);

    if (commentsError) {
      console.error(
        "❌ journal_comments table issue:",
        JSON.stringify(commentsError, null, 2),
      );
    } else {
      console.log("✅ journal_comments table exists and accessible");
    }

    // Test journal_likes table
    const { data: likesTest, error: likesError } = await supabase
      .from("journal_likes")
      .select("count")
      .limit(1);

    if (likesError) {
      console.error(
        "❌ journal_likes table issue:",
        JSON.stringify(likesError, null, 2),
      );
    } else {
      console.log("✅ journal_likes table exists and accessible");
    }

    // Test journal_entry_stats view
    const { data: statsTest, error: statsError } = await supabase
      .from("journal_entry_stats")
      .select("count")
      .limit(1);

    if (statsError) {
      console.error(
        "❌ journal_entry_stats view issue:",
        JSON.stringify(statsError, null, 2),
      );
    } else {
      console.log("✅ journal_entry_stats view exists and accessible");
    }
  } catch (error) {
    console.error("❌ Error checking tables:", JSON.stringify(error, null, 2));
  }
}

export interface JournalComment {
  id: string;
  journal_entry_id: string;
  visitor_name: string;
  comment_text: string;
  created_at: string;
}

export interface JournalLike {
  id: string;
  journal_entry_id: string;
  visitor_name: string;
  created_at: string;
}

export interface JournalEntryStats {
  id: string;
  title: string;
  created_at: string;
  comment_count: number;
  like_count: number;
}

// Comments functions
export async function getCommentsForEntry(
  entryId: string,
): Promise<JournalComment[]> {
  try {
    const { data, error } = await supabase
      .from("journal_comments")
      .select("*")
      .eq("journal_entry_id", entryId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", JSON.stringify(error, null, 2));
      console.error("Error details:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(
      "Error in getCommentsForEntry:",
      JSON.stringify(error, null, 2),
    );
    console.error("Error details:", error);
    throw error;
  }
}

export async function addComment(
  entryId: string,
  visitorName: string,
  commentText: string,
): Promise<JournalComment> {
  try {
    if (!visitorName.trim() || !commentText.trim()) {
      throw new Error("Visitor name and comment text are required");
    }

    const { data, error } = await supabase
      .from("journal_comments")
      .insert({
        journal_entry_id: entryId,
        visitor_name: visitorName.trim(),
        comment_text: commentText.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in addComment:", error);
    throw error;
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("journal_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteComment:", error);
    throw error;
  }
}

// Likes functions
export async function getLikesForEntry(
  entryId: string,
): Promise<JournalLike[]> {
  try {
    const { data, error } = await supabase
      .from("journal_likes")
      .select("*")
      .eq("journal_entry_id", entryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching likes:", JSON.stringify(error, null, 2));
      console.error("Error details:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getLikesForEntry:", JSON.stringify(error, null, 2));
    console.error("Error details:", error);
    throw error;
  }
}

export async function toggleLike(
  entryId: string,
  visitorName: string,
): Promise<{ liked: boolean; likeCount: number }> {
  try {
    if (!visitorName.trim()) {
      throw new Error("Visitor name is required");
    }

    // Check if user already liked this entry
    const { data: existingLike, error: checkError } = await supabase
      .from("journal_likes")
      .select("id")
      .eq("journal_entry_id", entryId)
      .eq("visitor_name", visitorName.trim())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking existing like:", checkError);
      throw checkError;
    }

    let liked = false;

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from("journal_likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        throw deleteError;
      }
      liked = false;
    } else {
      // Like - add the like
      const { error: insertError } = await supabase
        .from("journal_likes")
        .insert({
          journal_entry_id: entryId,
          visitor_name: visitorName.trim(),
        });

      if (insertError) {
        console.error("Error adding like:", insertError);
        throw insertError;
      }
      liked = true;
    }

    // Get updated like count
    const { data: likeCountData, error: countError } = await supabase
      .from("journal_likes")
      .select("id")
      .eq("journal_entry_id", entryId);

    if (countError) {
      console.error("Error getting like count:", countError);
      throw countError;
    }

    return {
      liked,
      likeCount: likeCountData?.length || 0,
    };
  } catch (error) {
    console.error("Error in toggleLike:", error);
    throw error;
  }
}

export async function deleteLike(likeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("journal_likes")
      .delete()
      .eq("id", likeId);

    if (error) {
      console.error("Error deleting like:", JSON.stringify(error, null, 2));
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteLike:", JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function checkIfUserLiked(
  entryId: string,
  visitorName: string,
): Promise<boolean> {
  try {
    if (!visitorName.trim()) {
      return false;
    }

    const { data, error } = await supabase
      .from("journal_likes")
      .select("id")
      .eq("journal_entry_id", entryId)
      .eq("visitor_name", visitorName.trim())
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking if user liked:", error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error in checkIfUserLiked:", error);
    return false;
  }
}

// Stats functions
export async function getEntryStats(
  entryId: string,
): Promise<{ commentCount: number; likeCount: number }> {
  try {
    const { data, error } = await supabase
      .from("journal_entry_stats")
      .select("comment_count, like_count")
      .eq("id", entryId);

    if (error) {
      console.error(
        "Error fetching entry stats:",
        JSON.stringify(error, null, 2),
      );
      console.error("Error details:", error);
      // Fallback to individual queries if view doesn't exist yet
      const [comments, likes] = await Promise.all([
        getCommentsForEntry(entryId),
        getLikesForEntry(entryId),
      ]);

      return {
        commentCount: comments.length,
        likeCount: likes.length,
      };
    }

    // Handle case where no stats exist for this entry (empty result)
    if (!data || data.length === 0) {
      const [comments, likes] = await Promise.all([
        getCommentsForEntry(entryId),
        getLikesForEntry(entryId),
      ]);

      return {
        commentCount: comments.length,
        likeCount: likes.length,
      };
    }

    // Use the first (and should be only) result
    const stats = data[0];
    return {
      commentCount: stats.comment_count || 0,
      likeCount: stats.like_count || 0,
    };
  } catch (error) {
    console.error("Error in getEntryStats:", JSON.stringify(error, null, 2));
    console.error("Error details:", error);
    return { commentCount: 0, likeCount: 0 };
  }
}

export async function getAllEntryStats(): Promise<JournalEntryStats[]> {
  try {
    const { data, error } = await supabase
      .from("journal_entry_stats")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all entry stats:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllEntryStats:", error);
    throw error;
  }
}
