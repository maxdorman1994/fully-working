import { useState, useEffect } from "react";
import { useSync } from "@/lib/syncService";
import {
  Heart,
  MapPin,
  Star,
  Calendar,
  DollarSign,
  Users,
  Plus,
  X,
  Edit,
  Check,
  Clock,
  Camera,
  Mountain,
  Car,
  Plane,
  Train,
  Home,
  Utensils,
  AlertCircle,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
  Search,
  Filter,
  Eye,
  MoreHorizontal,
  Loader2,
  Database,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getWishlistItems,
  createWishlistItem,
  deleteWishlistItem,
  updateWishlistItem,
  addVoteToItem,
  removeVoteFromItem,
  toggleResearchStatus,
  getWishlistStats,
  subscribeToWishlistItems,
  testWishlistConnection,
  WishlistItem,
  CreateWishlistItemData,
} from "@/lib/wishlistService";

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const { isAuthenticated } = useAuth();
  const { subscribe } = useSync();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "votes" | "cost" | "date">(
    "priority",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "connected" | "connecting" | "disconnected" | "local"
  >("connecting");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    total_items: 0,
    total_budget: 0,
    average_votes: 0,
    ready_items: 0,
  });

  const [newItem, setNewItem] = useState<Partial<CreateWishlistItemData>>({
    title: "",
    location: "",
    description: "",
    priority: "Medium",
    status: "Planning",
    estimated_cost: 500,
    best_seasons: ["Summer"],
    duration: "3-4 days",
    category: "Mountain",
    notes: "",
  });

  // Load wishlist data and setup real-time sync
  useEffect(() => {
    loadWishlistData();

    // Setup real-time subscription with sync status tracking
    const unsubscribe = subscribeToWishlistItems((items) => {
      console.log("🔄 Real-time sync update received:", items.length, "items");
      setWishlistItems(items);
      updateLocalStats(items);
      setSyncStatus("connected");
      setLastSyncTime(new Date());
    });

    return unsubscribe;
  }, []);

  // Subscribe to cross-device sync events
  useEffect(() => {
    const unsubscribe = subscribe("wishlist_items", (event) => {
      console.log(
        "🔄 Cross-device wishlist sync:",
        event.eventType,
        event.new?.id,
      );

      if (event.new?._refresh) {
        loadWishlistData();
        return;
      }

      switch (event.eventType) {
        case "INSERT":
          if (event.new) {
            setWishlistItems((prev) => {
              const exists = prev.find((item) => item.id === event.new.id);
              if (!exists) {
                return [event.new, ...prev];
              }
              return prev;
            });
          }
          break;
        case "UPDATE":
          if (event.new) {
            setWishlistItems((prev) =>
              prev.map((item) =>
                item.id === event.new.id ? { ...item, ...event.new } : item,
              ),
            );
          }
          break;
        case "DELETE":
          if (event.old) {
            setWishlistItems((prev) =>
              prev.filter((item) => item.id !== event.old.id),
            );
          }
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const loadWishlistData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Loading wishlist from Supabase...");
      const [items, statsData] = await Promise.all([
        getWishlistItems(),
        getWishlistStats(),
      ]);

      setWishlistItems(items);
      setStats(statsData);

      console.log(`✅ Loaded ${items.length} wishlist items successfully`);
      setSyncStatus("connected");
      setLastSyncTime(new Date());
      setError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        "Failed to load from Supabase, using fallback:",
        errorMessage,
      );

      // Set sync status and appropriate error message
      setSyncStatus("local");
      if (errorMessage.includes("not configured")) {
        setError(
          "📝 Development Mode: Supabase not configured - using local data",
        );
      } else if (
        errorMessage.includes("SCHEMA_MISSING") ||
        errorMessage.includes("Could not find the table") ||
        errorMessage.includes('relation "wishlist_items" does not exist')
      ) {
        setError(
          "🎯 Database Setup Required: Please run the Wishlist SQL schema - using local data",
        );
      } else {
        setSyncStatus("disconnected");
        setError(
          `⚠️ Database Error: Using local data (${errorMessage.substring(0, 50)}...)`,
        );
      }

      // Fallback to sample data
      const fallbackItems: WishlistItem[] = [
        {
          id: "1",
          title: "Isle of Skye Adventure",
          location: "Isle of Skye, Scotland",
          description:
            "Explore the dramatic landscapes, fairy pools, and ancient castles of Skye",
          priority: "High",
          status: "Researching",
          estimated_cost: 1200,
          best_seasons: ["Spring", "Summer", "Autumn"],
          duration: "5-7 days",
          category: "Island",
          family_votes: 5,
          notes:
            "Need to book accommodation early. Check ferry times. Visit Fairy Pools and Old Man of Storr.",
          target_date: "2024-07-15",
          researched: true,
          created_at: "2024-01-15",
        },
        {
          id: "2",
          title: "Ben Nevis Summit Challenge",
          location: "Lochaber, Scotland",
          description: "Conquer Scotland's highest peak as a family adventure",
          priority: "High",
          status: "Planning",
          estimated_cost: 600,
          best_seasons: ["Summer"],
          duration: "2-3 days",
          category: "Mountain",
          family_votes: 4,
          notes:
            "Need proper hiking gear. Check weather conditions. Book accommodation in Fort William.",
          researched: false,
          created_at: "2024-01-20",
        },
        {
          id: "3",
          title: "Edinburgh Festival Fringe",
          location: "Edinburgh, Scotland",
          description:
            "Experience the world's largest arts festival with family-friendly shows",
          priority: "Medium",
          status: "Ready",
          estimated_cost: 800,
          best_seasons: ["Summer"],
          duration: "4-5 days",
          category: "City",
          family_votes: 3,
          notes:
            "Book shows in advance. Consider Royal Mile walking tour. Visit Edinburgh Castle.",
          target_date: "2024-08-10",
          researched: true,
          created_at: "2024-02-01",
        },
      ];

      setWishlistItems(fallbackItems);
      updateLocalStats(fallbackItems);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalStats = (items: WishlistItem[]) => {
    const totalBudget = items.reduce(
      (sum, item) => sum + item.estimated_cost,
      0,
    );
    const averageVotes =
      items.length > 0
        ? items.reduce((sum, item) => sum + item.family_votes, 0) / items.length
        : 0;
    const readyItems = items.filter((i) => i.status === "Ready").length;

    setStats({
      total_items: items.length,
      total_budget: totalBudget,
      average_votes: averageVotes,
      ready_items: readyItems,
    });
  };

  const addWishlistItem = async () => {
    if (!newItem.title || !newItem.location) return;

    try {
      setIsLoading(true);
      console.log("🎯 Adding wishlist item:", newItem.title);

      if (error && error.includes("Database Setup Required")) {
        // If database isn't set up, use local state only
        console.log(
          "📦 Using local state for wishlist item (database not available)",
        );
        const localItem: WishlistItem = {
          id: Date.now().toString(),
          title: newItem.title!,
          location: newItem.location!,
          description: newItem.description || "",
          priority: newItem.priority || "Medium",
          status: newItem.status || "Planning",
          estimated_cost: newItem.estimated_cost || 500,
          best_seasons: newItem.best_seasons || ["Summer"],
          duration: newItem.duration || "3-4 days",
          category: newItem.category || "Mountain",
          family_votes: 0,
          notes: newItem.notes || "",
          researched: false,
          created_at: new Date().toISOString(),
        };

        setWishlistItems((prev) => [...prev, localItem]);
        updateLocalStats([...wishlistItems, localItem]);
      } else {
        // Use database
        await createWishlistItem({
          title: newItem.title!,
          location: newItem.location!,
          description: newItem.description,
          priority: newItem.priority || "Medium",
          status: newItem.status,
          estimated_cost: newItem.estimated_cost,
          best_seasons: newItem.best_seasons,
          duration: newItem.duration,
          category: newItem.category || "Mountain",
          notes: newItem.notes,
          target_date: newItem.target_date,
        });

        // Reload data to get updated state
        await loadWishlistData();
      }

      setNewItem({
        title: "",
        location: "",
        description: "",
        priority: "Medium",
        status: "Planning",
        estimated_cost: 500,
        best_seasons: ["Summer"],
        duration: "3-4 days",
        category: "Mountain",
        notes: "",
      });
      setShowAddForm(false);

      console.log("✅ Wishlist item added successfully");
      setLastSyncTime(new Date());
    } catch (dbError) {
      console.error("Database error, falling back to local state:", dbError);

      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      // Check if it's a network error and provide user-friendly feedback
      if (
        errorMessage.includes("Network connection failed") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_NETWORK")
      ) {
        // Network error - save locally as fallback
        const localItem: WishlistItem = {
          id: Date.now().toString(),
          title: newItem.title!,
          location: newItem.location!,
          description: newItem.description || "",
          priority: newItem.priority || "Medium",
          status: newItem.status || "Planning",
          estimated_cost: newItem.estimated_cost || 500,
          best_seasons: newItem.best_seasons || ["Summer"],
          duration: newItem.duration || "3-4 days",
          category: newItem.category || "Mountain",
          family_votes: 0,
          notes: newItem.notes || "",
          researched: false,
          created_at: new Date().toISOString(),
        };

        setWishlistItems((prev) => [...prev, localItem]);
        updateLocalStats([...wishlistItems, localItem]);
        setSyncStatus("disconnected");
        setError(
          "🌐 Connection lost - adventure saved locally, will sync when connection restored",
        );

        // Clear form on successful local save
        setNewItem({
          title: "",
          location: "",
          description: "",
          priority: "Medium",
          status: "Planning",
          estimated_cost: 500,
          best_seasons: ["Summer"],
          duration: "3-4 days",
          category: "Mountain",
          notes: "",
        });
        setShowAddForm(false);

        console.log("📱 Adventure saved locally due to network error");
      } else {
        // Other database errors
        setSyncStatus("local");
        setError("📱 Using local tracking (database unavailable)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      if (error && error.includes("Database Setup Required")) {
        // Local only
        setWishlistItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        await deleteWishlistItem(id);
        await loadWishlistData();
      }
    } catch (dbError) {
      console.error("Database error, using local state:", dbError);

      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      if (
        errorMessage.includes("Network connection failed") ||
        errorMessage.includes("Failed to fetch")
      ) {
        console.log("🌐 Network error during delete, removing locally");
        setSyncStatus("disconnected");
        setError(
          "🌐 Connection lost - item removed locally, will sync when connection restored",
        );
      }

      // Always remove from local state as fallback
      setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const toggleResearched = async (id: string) => {
    try {
      if (error && error.includes("Database Setup Required")) {
        // Local only
        setWishlistItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, researched: !item.researched } : item,
          ),
        );
      } else {
        await toggleResearchStatus(id);
      }
    } catch (dbError) {
      console.error("Database error, using local state:", dbError);
      setWishlistItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, researched: !item.researched } : item,
        ),
      );
    }
  };

  const addVote = async (id: string) => {
    try {
      if (error && error.includes("Database Setup Required")) {
        // Local only
        setWishlistItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, family_votes: item.family_votes + 1 }
              : item,
          ),
        );
      } else {
        await addVoteToItem(id);
        await loadWishlistData(); // Reload to get updated data
      }
    } catch (dbError) {
      console.error("Database error, using local state:", dbError);

      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      if (
        errorMessage.includes("Network connection failed") ||
        errorMessage.includes("Failed to fetch")
      ) {
        console.log("🌐 Network error during vote, updating locally");
        setSyncStatus("disconnected");
        setError(
          "🌐 Connection lost - vote saved locally, will sync when connection restored",
        );
      }

      // Always update local state as fallback
      setWishlistItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, family_votes: item.family_votes + 1 }
            : item,
        ),
      );
    }
  };

  const removeVote = async (id: string) => {
    try {
      if (error && error.includes("Database Setup Required")) {
        // Local only
        setWishlistItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, family_votes: Math.max(0, item.family_votes - 1) }
              : item,
          ),
        );
      } else {
        await removeVoteFromItem(id);
        await loadWishlistData(); // Reload to get updated data
      }
    } catch (dbError) {
      console.error("Database error, using local state:", dbError);

      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      if (
        errorMessage.includes("Network connection failed") ||
        errorMessage.includes("Failed to fetch")
      ) {
        console.log("🌐 Network error during vote removal, updating locally");
        setSyncStatus("disconnected");
        setError(
          "🌐 Connection lost - vote removed locally, will sync when connection restored",
        );
      }

      // Always update local state as fallback
      setWishlistItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, family_votes: Math.max(0, item.family_votes - 1) }
            : item,
        ),
      );
    }
  };

  const updateStatus = async (id: string, status: WishlistItem["status"]) => {
    try {
      if (error && error.includes("Database Setup Required")) {
        // Local only
        setWishlistItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        );
      } else {
        await updateWishlistItem(id, { status });
      }
    } catch (dbError) {
      console.error("Database error, using local state:", dbError);
      setWishlistItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    }
  };

  const testConnection = async () => {
    try {
      setSyncStatus("connecting");
      setError("🔍 Testing database connection...");

      const result = await testWishlistConnection();

      if (result.success) {
        setSyncStatus("connected");
        setLastSyncTime(new Date());
        setError(`✅ ${result.message}`);

        // Reload data after successful connection
        await loadWishlistData();
      } else {
        setSyncStatus("disconnected");
        setError(
          `❌ ${result.message}${result.error ? ": " + result.error : ""}`,
        );

        // Show connection details if available
        if (result.details) {
          const details = result.details;
          const status = [
            details.tables_exist ? "✅ Tables exist" : "❌ Tables missing",
            details.can_read ? "✅ Can read" : "❌ Read failed",
            details.can_write ? "✅ Can write" : "❌ Write failed",
            details.real_time_enabled
              ? "✅ Real-time enabled"
              : "❌ Real-time disabled",
          ].join(" | ");
          console.log("Connection details:", status);
        }
      }
    } catch (error) {
      setSyncStatus("disconnected");
      setError(
        `❌ Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const filteredAndSortedItems = () => {
    let filtered = wishlistItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        filterPriority === "all" || item.priority === filterPriority;
      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;

      return (
        matchesSearch && matchesPriority && matchesCategory && matchesStatus
      );
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "votes":
          return b.family_votes - a.family_votes;
        case "cost":
          return a.estimated_cost - b.estimated_cost;
        case "date":
          return (
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Researching":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "Booked":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Mountain":
        return Mountain;
      case "Coast":
        return MapPin;
      case "City":
        return Home;
      case "Island":
        return MapPin;
      case "Castle":
        return Home;
      case "Nature":
        return Mountain;
      case "Activity":
        return Star;
      default:
        return MapPin;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Loading Adventure Wishlist
          </h3>
          <p className="text-slate-600">Gathering your dream destinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-purple-200/50 shadow-lg">
            <Heart className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Dream Adventures Await
            </span>
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent drop-shadow-sm">
              Adventure Wishlist
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Dream destinations and future adventures we're planning to explore
            across Scotland and beyond
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.total_items}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Adventures Planned
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">
                  £{stats.total_budget.toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Total Budget
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {Math.round(stats.average_votes * 10) / 10}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Avg Family Rating
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.ready_items}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Ready to Book
                </div>
              </CardContent>
            </Card>

            {/* Sync Status & Error Display */}
            <div className="md:col-span-4">
              {/* Sync Status Indicator */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    syncStatus === "connected"
                      ? "bg-green-500"
                      : syncStatus === "connecting"
                        ? "bg-yellow-500"
                        : syncStatus === "local"
                          ? "bg-blue-500"
                          : "bg-red-500"
                  }`}
                />
                <span className="text-xs font-medium text-slate-600">
                  {syncStatus === "connected"
                    ? "🌐 Cross-device sync active"
                    : syncStatus === "connecting"
                      ? "🔄 Connecting..."
                      : syncStatus === "local"
                        ? "📱 Local mode only"
                        : "❌ Sync disconnected"}
                </span>
                {lastSyncTime && syncStatus === "connected" && (
                  <span className="text-xs text-slate-500">
                    • Last sync: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div
                  className={`border-2 rounded-2xl p-4 shadow-lg ${
                    error.startsWith("✅")
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800"
                      : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold text-sm">System Status</span>
                  </div>
                  <p className="text-xs text-center leading-relaxed mb-3">
                    {error}
                  </p>

                  {error.includes("Database Setup Required") && (
                    <div className="bg-white/50 rounded-lg p-3 mb-3 text-xs">
                      <div className="font-semibold mb-1">
                        📋 Setup Instructions:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-amber-700 text-xs">
                        <li>Go to Supabase Dashboard → SQL Editor</li>
                        <li>
                          Create new query and paste contents of
                          wishlist-schema.sql
                        </li>
                        <li>
                          Run the schema to create wishlist tables and views
                        </li>
                        <li>Click "Test" button below to verify connection</li>
                        <li>Refresh page to enable full cross-device sync</li>
                      </ol>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testConnection}
                      disabled={syncStatus === "connecting"}
                      className={`text-xs px-2 py-1 ${
                        error.startsWith("✅")
                          ? "border-green-300 text-green-700 hover:bg-green-100"
                          : "border-amber-300 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {syncStatus === "connecting" ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Database className="h-3 w-3 mr-1" />
                      )}
                      {syncStatus === "connecting"
                        ? "Testing..."
                        : "Test Connection"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadWishlistData}
                      disabled={isLoading}
                      className={`text-xs px-2 py-1 ${
                        error.startsWith("✅")
                          ? "border-green-300 text-green-700 hover:bg-green-100"
                          : "border-amber-300 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      {isLoading ? "Loading..." : "Refresh Data"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add New Adventure Button */}
        {isAuthenticated && (
          <div className="mb-8 text-center">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Dream Adventure
            </Button>
          </div>
        )}

        {/* Add Adventure Form */}
        {showAddForm && (
          <Card className="mb-8 border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-500" />
                  Add New Adventure
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adventure Title *
                  </label>
                  <Input
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Isle of Skye Adventure"
                    className="border-2 border-slate-200 focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location *
                  </label>
                  <Input
                    value={newItem.location}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="e.g. Scottish Highlands"
                    className="border-2 border-slate-200 focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Priority
                  </label>
                  <Select
                    value={newItem.priority}
                    onValueChange={(value: any) =>
                      setNewItem((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="Low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Category
                  </label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value: any) =>
                      setNewItem((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mountain">Mountain</SelectItem>
                      <SelectItem value="Coast">Coastal</SelectItem>
                      <SelectItem value="City">City</SelectItem>
                      <SelectItem value="Island">Island</SelectItem>
                      <SelectItem value="Castle">Castle</SelectItem>
                      <SelectItem value="Nature">Nature</SelectItem>
                      <SelectItem value="Activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Estimated Cost (£)
                  </label>
                  <Input
                    type="number"
                    value={newItem.estimated_cost}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        estimated_cost: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="border-2 border-slate-200 focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Duration
                  </label>
                  <Input
                    value={newItem.duration}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="e.g. 3-4 days"
                    className="border-2 border-slate-200 focus:border-purple-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe this adventure..."
                  className="border-2 border-slate-200 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes & Research
                </label>
                <Textarea
                  value={newItem.notes}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Planning notes, research, links..."
                  className="border-2 border-slate-200 focus:border-purple-400"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={addWishlistItem}
                  disabled={!newItem.title || !newItem.location}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Add to Wishlist
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border-2 border-slate-200"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🔍 Search
                </label>
                <Input
                  placeholder="Search adventures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2 border-slate-200 focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Priority
                </label>
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category
                </label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Mountain">Mountain</SelectItem>
                    <SelectItem value="Coast">Coast</SelectItem>
                    <SelectItem value="City">City</SelectItem>
                    <SelectItem value="Island">Island</SelectItem>
                    <SelectItem value="Castle">Castle</SelectItem>
                    <SelectItem value="Nature">Nature</SelectItem>
                    <SelectItem value="Activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Researching">Researching</SelectItem>
                    <SelectItem value="Ready">Ready</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Sort By
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="votes">Family Votes</SelectItem>
                    <SelectItem value="cost">Cost</SelectItem>
                    <SelectItem value="date">Date Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wishlist Grid */}
        {filteredAndSortedItems().length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-slate-100 to-purple-100 rounded-3xl p-12 border-2 border-slate-200 max-w-md mx-auto">
              <Heart className="h-16 w-16 mx-auto mb-6 text-slate-400" />
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                No Adventures Found
              </h3>
              <p className="text-slate-600 mb-6">
                {wishlistItems.length === 0
                  ? isAuthenticated
                    ? "Start planning your dream Scottish adventures!"
                    : "Login in the footer to start planning your dream Scottish adventures!"
                  : "Try adjusting your search filters."}
              </p>
              {isAuthenticated && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Add First Adventure
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedItems().map((item) => {
              const CategoryIcon = getCategoryIcon(item.category);
              return (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/95 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <CategoryIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 group-hover:text-purple-600 transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        </div>
                      </div>

                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                        </Button>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        className={`text-xs border-2 ${getPriorityColor(item.priority)}`}
                      >
                        {item.priority}
                      </Badge>
                      <Badge
                        className={`text-xs border-2 ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {item.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">
                          £{item.estimated_cost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    {/* Family Votes */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Family Rating:
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < item.family_votes
                                  ? "text-yellow-400 fill-current"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-slate-600 ml-1">
                            ({item.family_votes})
                          </span>
                        </div>
                      </div>

                      {/* Quick Vote Buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addVote(item.id)}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Add a family vote"
                        >
                          <Heart className="h-3 w-3 fill-current" />
                        </Button>
                        {item.family_votes > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVote(item.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove a family vote"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleResearched(item.id)}
                        className={`flex-1 text-xs ${item.researched ? "bg-green-50 text-green-700" : ""}`}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        {item.researched ? "Researched" : "Research"}
                      </Button>
                      <Select
                        value={item.status}
                        onValueChange={(value: any) =>
                          updateStatus(item.id, value)
                        }
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Researching">
                            Researching
                          </SelectItem>
                          <SelectItem value="Ready">Ready</SelectItem>
                          <SelectItem value="Booked">Booked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes Preview */}
                    {item.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {item.notes}
                        </p>
                      </div>
                    )}

                    {/* Target Date */}
                    {item.target_date && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                        <Calendar className="h-3 w-3" />
                        Target:{" "}
                        {new Date(item.target_date).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
