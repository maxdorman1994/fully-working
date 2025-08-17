import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getCommentsForEntry,
  getLikesForEntry,
  addComment,
  deleteComment,
  deleteLike,
  toggleLike,
  checkIfUserLiked,
  getEntryStats,
  checkCommentsLikesTables,
  type JournalComment,
  type JournalLike,
} from "@/lib/journalCommentsService";

interface JournalCommentsLikesProps {
  entryId: string;
  entryTitle: string;
}

export default function JournalCommentsLikes({
  entryId,
  entryTitle,
}: JournalCommentsLikesProps) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<JournalComment[]>([]);
  const [likes, setLikes] = useState<JournalLike[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [visitorName, setVisitorName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Load stored visitor name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("visitor_name");
    if (storedName) {
      setVisitorName(storedName);
    }
  }, []);

  // Save visitor name to localStorage when it changes
  useEffect(() => {
    if (visitorName.trim()) {
      localStorage.setItem("visitor_name", visitorName.trim());
    }
  }, [visitorName]);

  // Load comments, likes, and stats
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Check if tables exist first (for debugging)
      await checkCommentsLikesTables();

      const [commentsData, likesData, statsData] = await Promise.all([
        getCommentsForEntry(entryId),
        getLikesForEntry(entryId),
        getEntryStats(entryId),
      ]);

      setComments(commentsData);
      setLikes(likesData);
      setLikeCount(statsData.likeCount);
      setCommentCount(statsData.commentCount);
    } catch (error) {
      console.error("Error loading comments and likes:", error);
      toast({
        title: "Error",
        description: "Failed to load comments and likes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current visitor has liked this entry (separate from data loading)
  const checkUserLikeStatus = async (name: string) => {
    if (!name.trim()) {
      setIsLiked(false);
      return;
    }

    try {
      const userLiked = await checkIfUserLiked(entryId, name);
      setIsLiked(userLiked);
    } catch (error) {
      console.error("Error checking user like status:", error);
      setIsLiked(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entryId]);

  // Check like status when visitor name changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUserLikeStatus(visitorName);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [visitorName, entryId]);

  const handleLike = async () => {
    if (!visitorName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to like this adventure",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await toggleLike(entryId, visitorName);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);

      toast({
        title: result.liked ? "❤️ Liked!" : "Like removed",
        description: result.liked
          ? "Thanks for liking this adventure!"
          : "Your like has been removed",
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim() || !commentText.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your name and a comment",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newComment = await addComment(entryId, visitorName, commentText);
      setComments((prev) => [...prev, newComment]);
      setCommentCount((prev) => prev + 1);
      setCommentText("");
      setShowCommentForm(false);

      toast({
        title: "💬 Comment added!",
        description: "Thanks for sharing your thoughts on this adventure!",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => prev - 1);

      toast({
        title: "Comment deleted",
        description: "The comment has been removed",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLike = async (likeId: string, likeVisitorName: string) => {
    try {
      await deleteLike(likeId);
      setLikes((prev) => prev.filter((l) => l.id !== likeId));
      setLikeCount((prev) => prev - 1);

      // If this was the current user's like, update the liked state
      if (likeVisitorName === visitorName.trim()) {
        setIsLiked(false);
      }

      toast({
        title: "Like removed",
        description: `Removed like from ${likeVisitorName}`,
      });
    } catch (error) {
      console.error("Error deleting like:", error);
      toast({
        title: "Error",
        description: "Failed to remove like",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading comments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Family & Friends</span>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {likeCount}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {commentCount}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Like and Comment Actions */}
        <div className="flex flex-col gap-4">
          {/* Visitor Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Your Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name (e.g., Grandma, Uncle Rob, etc.)"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLike}
              variant={isLiked ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 ${
                isLiked
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "hover:bg-red-50 hover:text-red-600"
              }`}
              disabled={!visitorName.trim()}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "Liked" : "Like"} ({likeCount})
            </Button>

            <Button
              onClick={() => setShowCommentForm(!showCommentForm)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600"
              disabled={!visitorName.trim()}
            >
              <MessageCircle className="h-4 w-4" />
              Comment ({commentCount})
            </Button>
          </div>
        </div>

        {/* Comment Form */}
        {showCommentForm && (
          <form
            onSubmit={handleSubmitComment}
            className="space-y-3 p-4 bg-gray-50 rounded-lg"
          >
            <Textarea
              placeholder="Share your thoughts about this adventure..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {commentText.length}/500 characters
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !commentText.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        {comments.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Comments</h4>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.visitor_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {comment.comment_text}
                    </p>
                  </div>
                  {(visitorName.trim() === comment.visitor_name ||
                    isAuthenticated) && (
                    <Button
                      onClick={() => handleDeleteComment(comment.id)}
                      variant="ghost"
                      size="sm"
                      className={`ml-2 ${
                        isAuthenticated
                          ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                          : "text-gray-400 hover:text-red-600"
                      }`}
                      title={
                        isAuthenticated
                          ? "Admin: Delete comment"
                          : "Delete your comment"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Comments Message */}
        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-1">No comments yet</p>
            <p className="text-sm">
              Be the first to share your thoughts about this adventure!
            </p>
          </div>
        )}

        {/* Likes List */}
        {likes.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                Liked by:
              </span>
            </div>
            <div className="space-y-2">
              {likes.map((like) => (
                <div
                  key={like.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">
                      {like.visitor_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(like.created_at)}
                    </span>
                  </div>
                  {isAuthenticated && (
                    <Button
                      onClick={() =>
                        handleDeleteLike(like.id, like.visitor_name)
                      }
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0"
                      title="Admin: Remove like"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
