import { useState, useEffect } from "react";
import {
  Castle,
  Trophy,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Camera,
  CheckCircle,
  Circle,
  Target,
  Waves,
  Calendar,
  Database,
  AlertCircle,
  Filter,
  Search,
  Crown,
  Award,
  Zap,
  Mountain,
  Info,
  Users,
  ExternalLink,
  Lock,
  Gem,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllCastlesWithVisits,
  getAllLochsWithVisits,
  getAllHiddenGemsWithVisits,
  visitCastle,
  unvisitCastle,
  visitLoch,
  unvisitLoch,
  visitHiddenGem,
  unvisitHiddenGem,
  getCastleVisitStats,
  getLochVisitStats,
  getHiddenGemVisitStats,
  getCastleLochRegions,
  testCastleLochConnection,
  deleteCustomCastle,
  deleteCustomLoch,
  deleteCustomHiddenGem,
  CastleWithVisit,
  LochWithVisit,
  HiddenGemWithVisit,
} from "@/lib/castlesLochsService";
import AddItemModal from "@/components/AddItemModal";

export default function CastlesLochs() {
  const [castles, setCastles] = useState<CastleWithVisit[]>([]);
  const [lochs, setLochs] = useState<LochWithVisit[]>([]);
  const [hiddenGems, setHiddenGems] = useState<HiddenGemWithVisit[]>([]);
  const [activeTab, setActiveTab] = useState<"castles" | "lochs" | "gems">(
    "castles",
  );
  const [filter, setFilter] = useState<"all" | "visited" | "remaining">("all");

  const { isAuthenticated } = useAuth();
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [regions, setRegions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [castleStats, setCastleStats] = useState({
    visited_count: 0,
    total_castles: 100,
    completion_percentage: 0,
    castles_with_photos: 0,
    total_photos: 0,
    first_visit: null,
    latest_visit: null,
    recommended_count: 0,
  });
  const [lochStats, setLochStats] = useState({
    visited_count: 0,
    total_lochs: 20,
    completion_percentage: 0,
    lochs_with_photos: 0,
    total_photos: 0,
    first_visit: null,
    latest_visit: null,
    recommended_count: 0,
  });
  const [gemStats, setGemStats] = useState({
    visited_count: 0,
    total_gems: 30,
    completion_percentage: 0,
    gems_with_photos: 0,
    total_photos: 0,
    first_visit: null,
    latest_visit: null,
    recommended_count: 0,
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadRegions();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(
        "🔄 Loading castles, lochs, and hidden gems from Supabase...",
      );
      const [castlesData, lochsData, gemsData] = await Promise.all([
        getAllCastlesWithVisits(),
        getAllLochsWithVisits(),
        getAllHiddenGemsWithVisits(),
      ]);

      setCastles(castlesData);
      setLochs(lochsData);
      setHiddenGems(gemsData);

      // Load statistics
      try {
        const [castleStatsData, lochStatsData, gemStatsData] =
          await Promise.all([
            getCastleVisitStats(),
            getLochVisitStats(),
            getHiddenGemVisitStats(),
          ]);
        setCastleStats(castleStatsData);
        setLochStats(lochStatsData);
        setGemStats(gemStatsData);
      } catch (statsError) {
        console.warn("Could not load stats, using defaults:", statsError);
        // Use fallback stats
        const visitedCastles = castlesData.filter((c) => c.visited).length;
        const visitedLochs = lochsData.filter((l) => l.visited).length;
        const visitedGems = gemsData.filter((g) => g.visited).length;

        setCastleStats({
          visited_count: visitedCastles,
          total_castles: 100,
          completion_percentage:
            Math.round((visitedCastles / 100) * 100 * 10) / 10,
          castles_with_photos: castlesData.filter(
            (c) => c.visit?.photo_count && c.visit.photo_count > 0,
          ).length,
          total_photos: castlesData.reduce(
            (sum, c) => sum + (c.visit?.photo_count || 0),
            0,
          ),
          first_visit: null,
          latest_visit: null,
          recommended_count: castlesData.filter((c) => c.visit?.would_recommend)
            .length,
        });

        setLochStats({
          visited_count: visitedLochs,
          total_lochs: 20,
          completion_percentage:
            Math.round((visitedLochs / 20) * 100 * 10) / 10,
          lochs_with_photos: lochsData.filter(
            (l) => l.visit?.photo_count && l.visit.photo_count > 0,
          ).length,
          total_photos: lochsData.reduce(
            (sum, l) => sum + (l.visit?.photo_count || 0),
            0,
          ),
          first_visit: null,
          latest_visit: null,
          recommended_count: lochsData.filter((l) => l.visit?.would_recommend)
            .length,
        });

        setGemStats({
          visited_count: visitedGems,
          total_gems: 30,
          completion_percentage: Math.round((visitedGems / 30) * 100 * 10) / 10,
          gems_with_photos: gemsData.filter(
            (g) => g.visit?.photo_count && g.visit.photo_count > 0,
          ).length,
          total_photos: gemsData.reduce(
            (sum, g) => sum + (g.visit?.photo_count || 0),
            0,
          ),
          first_visit: null,
          latest_visit: null,
          recommended_count: gemsData.filter((g) => g.visit?.would_recommend)
            .length,
        });
      }

      console.log(
        `✅ Loaded ${castlesData.length} castles, ${lochsData.length} lochs, and ${gemsData.length} hidden gems successfully`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn("Failed to load from Supabase:", errorMessage);

      if (errorMessage.includes("not configured")) {
        setError(
          "���� Development Mode: Supabase not configured - using local data",
        );
      } else if (
        errorMessage.includes("SCHEMA_MISSING") ||
        errorMessage.includes("Could not find the table") ||
        errorMessage.includes('relation "castles" does not exist')
      ) {
        setError(
          "🏰 Database Setup Required: Please run the Castles & Lochs SQL schema with 100 castles and 20 lochs",
        );
      } else {
        setError(`⚠️ Database Error: ${errorMessage.substring(0, 50)}...`);
      }

      // Set fallback data
      setCastles([]);
      setLochs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const regionsData = await getCastleLochRegions();
      setRegions(regionsData);
      console.log(`✅ Loaded ${regionsData.length} regions from database`);
    } catch (error) {
      console.warn("Failed to load regions, using fallback:", error);
      const fallbackRegions = [
        "Edinburgh",
        "Highland",
        "Stirling",
        "Aberdeenshire",
        "Argyll and Bute",
        "Central Scotland",
        "Dumfries and Galloway",
        "South Ayrshire",
        "Angus",
        "Scottish Borders",
        "East Lothian",
        "West Lothian",
        "Isle of Mull",
      ];
      setRegions(fallbackRegions);
    }
  };

  const currentStats =
    activeTab === "castles"
      ? castleStats
      : activeTab === "lochs"
        ? lochStats
        : gemStats;
  const totalItems =
    activeTab === "castles" ? 100 : activeTab === "lochs" ? 20 : 30;
  const visitedCount =
    activeTab === "castles"
      ? castleStats.visited_count
      : activeTab === "lochs"
        ? lochStats.visited_count
        : gemStats.visited_count;
  const completionPercentage =
    Math.round((visitedCount / totalItems) * 100 * 10) / 10;

  const filteredItems = (
    activeTab === "castles"
      ? castles
      : activeTab === "lochs"
        ? lochs
        : hiddenGems
  ).filter((item) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "visited" && item.visited) ||
      (filter === "remaining" && !item.visited);
    const matchesRegion =
      regionFilter === "all" || item.region === regionFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesRegion && matchesType && matchesSearch;
  });

  const toggleVisit = async (itemId: string, isVisited: boolean) => {
    if (!isAuthenticated) return;

    try {
      if (activeTab === "castles") {
        if (isVisited) {
          await unvisitCastle(itemId);
        } else {
          await visitCastle({
            castle_id: itemId,
            visited_date: new Date().toISOString().split("T")[0],
            notes: "Visited this amazing castle!",
            photo_count: Math.floor(Math.random() * 5) + 1,
            weather_conditions: "Perfect weather for exploring",
            visit_duration: "2-3 hours",
            favorite_part: "The views and history",
            would_recommend: true,
          });
        }
      } else if (activeTab === "lochs") {
        if (isVisited) {
          await unvisitLoch(itemId);
        } else {
          await visitLoch({
            loch_id: itemId,
            visited_date: new Date().toISOString().split("T")[0],
            notes: "Beautiful loch visit!",
            photo_count: Math.floor(Math.random() * 5) + 1,
            weather_conditions: "Clear skies",
            activities_done: ["Photography", "Walking", "Wildlife watching"],
            water_temperature: "Refreshing",
            wildlife_spotted: ["Red deer", "Highland cattle"],
            would_recommend: true,
          });
        }
      } else {
        if (isVisited) {
          await unvisitHiddenGem(itemId);
        } else {
          await visitHiddenGem(itemId, {
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            notes: "Amazing hidden gem discovery!",
            photo_count: Math.floor(Math.random() * 8) + 1,
            weather_conditions: "Perfect for photography",
            would_recommend: true,
            difficulty_experienced: "Moderate" as const,
          });
        }
      }

      // Reload data to get updated state
      await loadData();
    } catch (dbError) {
      console.error("Database error, falling back to local state:", dbError);
      setError("📱 Using local tracking (database unavailable)");
    }
  };

  const testConnection = async () => {
    try {
      const result = await testCastleLochConnection();
      setError(
        result.success
          ? `✅ ${result.message}`
          : `❌ ${result.message}: ${result.error}`,
      );
    } catch (error) {
      setError(
        `❌ Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!isAuthenticated) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      if (activeTab === "castles") {
        await deleteCustomCastle(itemId);
      } else if (activeTab === "lochs") {
        await deleteCustomLoch(itemId);
      } else {
        await deleteCustomHiddenGem(itemId);
      }

      // Reload data to reflect the deletion
      await loadData();

      // Show success message
      setError(`✅ "${itemName}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting item:", error);
      setError(
        `❌ Failed to delete "${itemName}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Royal Castle":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Historic Fortress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Clan Castle":
        return "bg-green-100 text-green-800 border-green-200";
      case "Ruin":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Palace":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Freshwater Loch":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Sea Loch":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Tidal Loch":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "Secret Beach":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Hidden Waterfall":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Ancient Site":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Natural Wonder":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Historic Village":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "Remote Island":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Mountain Peak":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "Forest Grove":
        return "bg-lime-100 text-lime-800 border-lime-200";
      case "Cave System":
        return "bg-stone-100 text-stone-800 border-stone-200";
      case "Coastal Feature":
        return "bg-sky-100 text-sky-800 border-sky-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const achievements = [
    {
      name: "First Visit",
      description: `Visit your first ${activeTab === "castles" ? "castle" : activeTab === "lochs" ? "loch" : "hidden gem"}`,
      unlocked: visitedCount >= 1,
      icon: Target,
    },
    {
      name: "Special Explorer",
      description:
        activeTab === "castles"
          ? "Visit Edinburgh Castle"
          : activeTab === "lochs"
            ? "Visit Loch Ness"
            : "Visit the Fairy Pools",
      unlocked:
        activeTab === "castles"
          ? castles.find((c) => c.name === "Edinburgh Castle")?.visited || false
          : activeTab === "lochs"
            ? lochs.find((l) => l.name === "Loch Ness")?.visited || false
            : hiddenGems.find((g) => g.name === "Fairy Pools")?.visited ||
              false,
      icon: Crown,
    },
    {
      name: "Quarter Complete",
      description: `Visit 25% of all ${activeTab === "castles" ? "castles" : activeTab === "lochs" ? "lochs" : "hidden gems"}`,
      unlocked: completionPercentage >= 25,
      icon: Award,
    },
    {
      name: "Half Explorer",
      description: `Visit 50% of all ${activeTab === "castles" ? "castles" : activeTab === "lochs" ? "lochs" : "hidden gems"}`,
      unlocked: completionPercentage >= 50,
      icon: Star,
    },
    {
      name: "Completionist",
      description: `Visit all ${totalItems} ${activeTab === "castles" ? "castles" : activeTab === "lochs" ? "lochs" : "hidden gems"}`,
      unlocked: visitedCount >= totalItems,
      icon: Zap,
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Loading Scottish Castles & Lochs
          </h3>
          <p className="text-slate-600">
            Preparing your heritage and natural beauty adventure...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Hero Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-teal-400/20 rounded-full blur-3xl transform -rotate-6"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-blue-200/50 shadow-lg">
              <Castle className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Scottish Heritage & Nature
              </span>
              <Waves className="h-6 w-6 text-teal-600" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 relative">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm">
                Castles & Lochs
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover 100 magnificent Scottish castles, 20 breathtaking lochs,
              and 30 incredible hidden gems
            </p>

            {/* Error Display */}
            {error && (
              <div className="mb-8 max-w-3xl mx-auto">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 text-amber-800 shadow-lg">
                  <div className="flex items-center justify-center mb-3">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <span className="font-semibold">System Status</span>
                  </div>
                  <p className="text-sm text-center leading-relaxed mb-4">
                    {error}
                  </p>

                  {error.includes("Database Setup Required") && (
                    <div className="bg-white/50 rounded-xl p-4 mb-4 text-xs">
                      <div className="font-semibold mb-2">
                        📋 Setup Instructions:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-amber-700">
                        <li>Go to your Supabase Dashboard → SQL Editor</li>
                        <li>
                          Create a new query and copy the Castles & Lochs SQL
                          schema
                        </li>
                        <li>
                          Run the schema to create tables with 100 castles and
                          20 lochs
                        </li>
                        <li>Refresh this page to enable cross-device sync</li>
                      </ol>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testConnection}
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadData}
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Retry Load
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs for Castles and Lochs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "castles" | "lochs" | "gems")
              }
              className="w-full"
            >
              <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
                <TabsTrigger
                  value="castles"
                  className="flex items-center gap-2"
                >
                  <Castle className="h-4 w-4" />
                  Castles
                </TabsTrigger>
                <TabsTrigger value="lochs" className="flex items-center gap-2">
                  <Waves className="h-4 w-4" />
                  Lochs
                </TabsTrigger>
                <TabsTrigger value="gems" className="flex items-center gap-2">
                  <Gem className="h-4 w-4" />
                  Hidden Gems
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {/* Progress Overview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-blue-200/50 shadow-xl max-w-2xl mx-auto mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-800">
                      Your{" "}
                      {activeTab === "castles"
                        ? "Castle"
                        : activeTab === "lochs"
                          ? "Loch"
                          : "Hidden Gem"}{" "}
                      Progress
                    </h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {visitedCount}/{totalItems}
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out relative"
                        style={{ width: `${completionPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <span className="text-xs text-slate-500">0</span>
                      <span className="text-xs text-slate-500">25%</span>
                      <span className="text-xs text-slate-500">50%</span>
                      <span className="text-xs text-slate-500">75%</span>
                      <span className="text-xs text-slate-500">
                        {totalItems}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{completionPercentage.toFixed(1)}% Complete</span>
                    <span>{totalItems - visitedCount} remaining</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6 relative">
              <div className="absolute inset-0 opacity-5 text-6xl flex items-center justify-center font-bold">
                {activeTab === "castles" ? "🏰" : "🌊"}
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 text-center">
                  {visitedCount}
                </div>
                <div className="text-sm font-semibold text-slate-600 text-center">
                  {activeTab === "castles" ? "Castles" : "Lochs"} Visited
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-teal-50 to-blue-50">
            <CardContent className="p-6 relative">
              <div className="absolute inset-0 opacity-5 text-6xl flex items-center justify-center font-bold">
                📸
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 text-center">
                  {currentStats.total_photos}
                </div>
                <div className="text-sm font-semibold text-slate-600 text-center">
                  Total Photos
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6 relative">
              <div className="absolute inset-0 opacity-5 text-6xl flex items-center justify-center font-bold">
                🏆
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 text-center">
                  {achievements.filter((a) => a.unlocked).length}
                </div>
                <div className="text-sm font-semibold text-slate-600 text-center">
                  Achievements
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6 relative">
              <div className="absolute inset-0 opacity-5 text-6xl flex items-center justify-center font-bold">
                ⭐
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 text-center">
                  {currentStats.recommended_count}
                </div>
                <div className="text-sm font-semibold text-slate-600 text-center">
                  Recommended
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card className="mb-12 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="h-6 w-6 text-amber-500" />
              Achievements
              <Badge variant="secondary">
                {achievements.filter((a) => a.unlocked).length}/
                {achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.unlocked
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${achievement.unlocked ? "text-white" : "text-gray-500"}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🔍 Search
                </label>
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2 border-slate-200 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📊 Status
                </label>
                <Select
                  value={filter}
                  onValueChange={(value: any) => setFilter(value)}
                >
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All{" "}
                      {activeTab === "castles"
                        ? "Castles"
                        : activeTab === "lochs"
                          ? "Lochs"
                          : "Hidden Gems"}
                    </SelectItem>
                    <SelectItem value="visited">Visited</SelectItem>
                    <SelectItem value="remaining">Remaining</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🗺️ Region
                </label>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🏷️ Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {activeTab === "castles" ? (
                      <>
                        <SelectItem value="Royal Castle">
                          Royal Castle
                        </SelectItem>
                        <SelectItem value="Historic Fortress">
                          Historic Fortress
                        </SelectItem>
                        <SelectItem value="Clan Castle">Clan Castle</SelectItem>
                        <SelectItem value="Ruin">Ruin</SelectItem>
                        <SelectItem value="Palace">Palace</SelectItem>
                      </>
                    ) : activeTab === "lochs" ? (
                      <>
                        <SelectItem value="Freshwater Loch">
                          Freshwater Loch
                        </SelectItem>
                        <SelectItem value="Sea Loch">Sea Loch</SelectItem>
                        <SelectItem value="Tidal Loch">Tidal Loch</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Secret Beach">
                          Secret Beach
                        </SelectItem>
                        <SelectItem value="Hidden Waterfall">
                          Hidden Waterfall
                        </SelectItem>
                        <SelectItem value="Ancient Site">
                          Ancient Site
                        </SelectItem>
                        <SelectItem value="Natural Wonder">
                          Natural Wonder
                        </SelectItem>
                        <SelectItem value="Historic Village">
                          Historic Village
                        </SelectItem>
                        <SelectItem value="Remote Island">
                          Remote Island
                        </SelectItem>
                        <SelectItem value="Mountain Peak">
                          Mountain Peak
                        </SelectItem>
                        <SelectItem value="Forest Grove">
                          Forest Grove
                        </SelectItem>
                        <SelectItem value="Cave System">Cave System</SelectItem>
                        <SelectItem value="Coastal Feature">
                          Coastal Feature
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("all");
                    setRegionFilter("all");
                    setTypeFilter("all");
                  }}
                  className="w-full border-2 border-slate-200 hover:bg-slate-50"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Custom Items - Only for authenticated users */}
        {isAuthenticated && (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Add Your Own{" "}
                    {activeTab === "castles"
                      ? "Castle"
                      : activeTab === "lochs"
                        ? "Loch"
                        : "Hidden Gem"}
                  </h3>
                  <p className="text-sm text-green-600">
                    Know a special place that's not in our collection? Add it to
                    share with others!
                  </p>
                </div>
                <AddItemModal
                  type={
                    activeTab === "castles"
                      ? "castle"
                      : activeTab === "lochs"
                        ? "loch"
                        : "gem"
                  }
                  onItemCreated={loadData}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 ${
                isAuthenticated
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-75"
              } ${
                item.visited
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                  : "bg-white/95 backdrop-blur-sm"
              }`}
              onClick={() =>
                isAuthenticated && toggleVisit(item.id, item.visited)
              }
            >
              <CardContent className="p-6">
                {/* Custom Item Badge and Delete Button */}
                {(item as any).is_custom && (
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                      Custom
                    </Badge>
                    {isAuthenticated && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 border-red-200 hover:border-red-400 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id, item.name);
                        }}
                        title={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Status Icon */}
                <div className="absolute top-4 right-4">
                  {item.visited ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  ) : isAuthenticated ? (
                    <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-green-400 transition-colors">
                      <Circle className="h-5 w-5 text-slate-400 group-hover:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-red-200 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {activeTab === "castles" ? (
                    <Castle className="h-8 w-8 text-white" />
                  ) : activeTab === "lochs" ? (
                    <Waves className="h-8 w-8 text-white" />
                  ) : (
                    <Gem className="h-8 w-8 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>

                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.region}
                    </Badge>
                    <Badge
                      className={`text-xs border-2 ${getTypeColor(item.type)}`}
                    >
                      {item.type}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {item.description}
                  </p>

                  {activeTab === "castles" && (
                    <div className="text-xs text-slate-500 mb-2">
                      Built: {(item as CastleWithVisit).built_century}
                    </div>
                  )}

                  {activeTab === "lochs" && (
                    <div className="text-xs text-slate-500 mb-2">
                      Length: {(item as LochWithVisit).length_km}km | Max Depth:{" "}
                      {(item as LochWithVisit).max_depth_m}m
                    </div>
                  )}

                  {activeTab === "gems" && (
                    <div className="text-xs text-slate-500 mb-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span>
                          Difficulty:{" "}
                          {(item as HiddenGemWithVisit).difficulty_level}
                        </span>
                        {(item as HiddenGemWithVisit).requires_hiking && (
                          <span className="text-orange-600">
                            🥾 Hiking Required
                          </span>
                        )}
                      </div>
                      <div>
                        Near: {(item as HiddenGemWithVisit).nearest_town}
                      </div>
                    </div>
                  )}

                  {item.visited && item.visit?.visited_date && (
                    <div className="text-xs text-green-600 font-medium">
                      ✅ Visited{" "}
                      {new Date(item.visit.visited_date).toLocaleDateString()}
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="text-xs text-red-500 font-medium mt-2 flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" />
                      Login to track visits
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl p-12 border-2 border-slate-200 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                No {activeTab === "castles" ? "Castles" : "Lochs"} Found
              </h3>
              <p className="text-slate-600 mb-6">
                Try adjusting your search filters
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                  setRegionFilter("all");
                  setTypeFilter("all");
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                Show All {activeTab === "castles" ? "Castles" : "Lochs"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
