import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Camera,
  Heart,
  Trophy,
  Star,
  Mountain,
  Users,
  Target,
  CheckCircle,
  Lock,
  Award,
  Zap,
  Map,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSync } from "@/lib/syncService";
import {
  calculateRealMilestones,
  getRealMilestoneStats,
  subscribeToRealMilestones,
  filterMilestonesByCategory,
  getNextMilestones,
  getRecentlyCompleted,
  MILESTONE_CATEGORIES,
  RealMilestone,
  MilestoneCategory,
  MilestoneStats,
} from "@/lib/realMilestonesService";

export default function Milestones() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [milestones, setMilestones] = useState<RealMilestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats>({
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
    available_milestones: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { subscribe } = useSync();

  // Load real milestone data from journal entries
  useEffect(() => {
    const loadRealMilestoneData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("🔄 Loading real milestones from journal data...");

        // Calculate milestones from actual journal entries
        const realMilestones = await calculateRealMilestones();
        const realStats = await getRealMilestoneStats();

        setMilestones(realMilestones);
        setStats(realStats);

        console.log(
          `✅ Loaded ${realMilestones.length} real milestones, ${realStats.completed_milestones} completed`,
        );
      } catch (error) {
        console.error("Error loading real milestone data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load milestone data from journal entries",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadRealMilestoneData();

    // Set up real-time subscription to journal changes
    const unsubscribeMilestones = subscribeToRealMilestones(
      (updatedMilestones) => {
        console.log(
          "🔄 Milestones updated from journal changes:",
          updatedMilestones.length,
        );
        setMilestones(updatedMilestones);
        // Recalculate stats
        getRealMilestoneStats().then(setStats);
      },
    );

    return unsubscribeMilestones;
  }, []);

  // Subscribe to cross-device sync
  useEffect(() => {
    const unsubscribeSync = subscribe("journal_entries", (event) => {
      console.log("🔄 Journal entry synced, recalculating milestones...");

      // Recalculate milestones when journal entries change
      calculateRealMilestones().then(setMilestones);
      getRealMilestoneStats().then(setStats);
    });

    return unsubscribeSync;
  }, [subscribe]);

  // Force refresh milestones
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshedMilestones = await calculateRealMilestones();
      const refreshedStats = await getRealMilestoneStats();
      setMilestones(refreshedMilestones);
      setStats(refreshedStats);
    } catch (error) {
      console.error("Failed to refresh milestones:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Split milestones by status using real data
  const completedMilestones = milestones.filter((m) => m.completed);
  const inProgressMilestones = milestones.filter(
    (m) => !m.completed && m.current_value > 0,
  );
  const availableMilestones = milestones.filter((m) => !m.completed);
  const lockedMilestones = milestones.filter(
    (m) => !m.completed && m.current_value === 0,
  );

  // Helper function to get the correct icon component
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      MapPin,
      Camera,
      Heart,
      Trophy,
      Star,
      Mountain,
      Users,
      Target,
      CheckCircle,
      Lock,
      Award,
      Zap,
      Map,
      Eye,
      Calendar,
    };
    return iconMap[iconName] || MapPin;
  };

  // Helper function to get color scheme based on milestone category
  const getColorScheme = (milestone: RealMilestone) => {
    const category = MILESTONE_CATEGORIES.find(
      (cat) => cat.id === milestone.category,
    );
    const defaultColor = "from-gray-500 to-slate-500";
    const baseColor = category?.color || defaultColor;

    // Define color schemes based on difficulty and category
    const difficultyColors = {
      bronze: "from-amber-50 to-orange-50",
      silver: "from-slate-50 to-gray-50",
      gold: "from-yellow-50 to-amber-50",
      platinum: "from-purple-50 to-indigo-50",
    };

    const difficultyBorders = {
      bronze: "border-amber-200/60",
      silver: "border-slate-200/60",
      gold: "border-yellow-200/60",
      platinum: "border-purple-200/60",
    };

    return {
      color: baseColor,
      bgColor:
        difficultyColors[milestone.difficulty] || "from-gray-50 to-slate-50",
      borderColor:
        difficultyBorders[milestone.difficulty] || "border-gray-200/60",
    };
  };

  const filterMilestones = (milestones: RealMilestone[], category: string) => {
    return filterMilestonesByCategory(milestones, category);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-blue mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-muted-foreground">
            Loading Milestones...
          </h2>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ Error loading milestones</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Adventure Milestones
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Track your progress, celebrate achievements, and unlock new adventures
          as you explore Scotland!
        </p>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200/60">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-800 mb-1">
                {stats.completed_milestones}
              </h3>
              <p className="text-sm text-emerald-600">Completed Milestones</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200/60">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-1">
                {stats.total_xp}
              </h3>
              <p className="text-sm text-amber-600">Total XP Earned</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200/60">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-800 mb-1">
                {Math.round(stats.completion_percentage)}%
              </h3>
              <p className="text-sm text-blue-600">Progress Complete</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Add "All" category */}
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          className={`flex items-center gap-2 ${
            selectedCategory === "all"
              ? "bg-gradient-to-r from-vibrant-blue to-scotland-loch text-white"
              : "hover:bg-scotland-thistle/10"
          }`}
        >
          <Star className="h-4 w-4" />
          All ({milestones.length})
        </Button>

        {/* Real milestone categories */}
        {MILESTONE_CATEGORIES.map((category) => {
          const categoryMilestones = filterMilestones(milestones, category.id);
          if (categoryMilestones.length === 0) return null;
          const Icon = getIconComponent(category.icon);
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-vibrant-blue to-scotland-loch text-white"
                  : "hover:bg-scotland-thistle/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name} ({categoryMilestones.length})
            </Button>
          );
        })}
      </div>

      {/* Completed Milestones */}
      {filterMilestones(completedMilestones, selectedCategory).length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              🏆 Completed Achievements
            </span>
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filterMilestones(completedMilestones, selectedCategory).length})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterMilestones(completedMilestones, selectedCategory)
              .slice(0, showAllCompleted ? undefined : 3)
              .map((milestone) => {
                const Icon = getIconComponent(milestone.icon);
                const colorScheme = getColorScheme(milestone);
                return (
                  <Card
                    key={milestone.id}
                    className={`bg-gradient-to-br ${colorScheme.bgColor} border-2 ${colorScheme.borderColor} hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
                  >
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <CardContent className="p-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${colorScheme.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-center">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 text-center">
                        {milestone.description}
                      </p>
                      <div className="text-center space-y-2">
                        <div className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full inline-block">
                          ✅ Completed
                        </div>
                        <p className="text-xs text-gray-500">
                          Completed on{" "}
                          {milestone.completed_date
                            ? new Date(
                                milestone.completed_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700">
                            +{milestone.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {/* View More/Less Button */}
          {filterMilestones(completedMilestones, selectedCategory).length >
            3 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAllCompleted(!showAllCompleted)}
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showAllCompleted
                  ? `View Less (showing ${filterMilestones(completedMilestones, selectedCategory).length})`
                  : `View More (${filterMilestones(completedMilestones, selectedCategory).length - 3} more)`}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* In Progress Milestones */}
      {filterMilestones(inProgressMilestones, selectedCategory).length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              🚀 In Progress
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterMilestones(inProgressMilestones, selectedCategory).map(
              (milestone) => {
                const Icon = getIconComponent(milestone.icon);
                const colorScheme = getColorScheme(milestone);
                const progressPercentage = milestone.progress_percentage || 0;
                const currentProgress = milestone.current_value || 0;
                const targetValue = milestone.target_value || 1;
                return (
                  <Card
                    key={milestone.id}
                    className={`bg-gradient-to-br ${colorScheme.bgColor} border-2 ${colorScheme.borderColor} hover:shadow-lg transition-all duration-300`}
                  >
                    <CardContent className="p-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${colorScheme.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-center">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 text-center">
                        {milestone.description}
                      </p>
                      <div className="space-y-3">
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${colorScheme.color} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-center text-sm font-medium">
                          {currentProgress} / {targetValue}
                        </p>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700">
                            +{milestone.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </section>
      )}

      {/* Locked Milestones */}
      {filterMilestones(lockedMilestones, selectedCategory).length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
              🔒 Locked Achievements
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterMilestones(lockedMilestones, selectedCategory).map(
              (milestone) => {
                const Icon = getIconComponent(milestone.icon);
                const colorScheme = getColorScheme(milestone);
                return (
                  <Card
                    key={milestone.id}
                    className={`bg-gradient-to-br ${colorScheme.bgColor} border-2 ${colorScheme.borderColor} opacity-75 relative`}
                  >
                    <div className="absolute top-2 right-2">
                      <Lock className="w-6 h-6 text-gray-500" />
                    </div>
                    <CardContent className="p-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${colorScheme.color} rounded-full flex items-center justify-center mx-auto mb-4 opacity-50`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-center text-gray-500">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 text-center">
                        {milestone.description}
                      </p>
                      <div className="text-center space-y-2">
                        <div className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full inline-block">
                          🔒 Locked
                        </div>
                        <p className="text-xs text-gray-500">
                          {milestone.unlock_condition ||
                            "Complete previous milestones to unlock"}
                        </p>
                        <div className="flex items-center justify-center gap-1 opacity-50">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700">
                            +{milestone.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="text-center bg-gradient-to-r from-vibrant-blue/10 via-scotland-thistle/10 to-vibrant-pink/10 rounded-2xl p-8 border border-scotland-thistle/20">
        <Award className="w-16 h-16 mx-auto mb-4 text-vibrant-blue" />
        <h2 className="text-2xl font-bold mb-4">
          <span className="bg-gradient-to-r from-vibrant-blue to-scotland-loch bg-clip-text text-transparent">
            Keep Exploring Scotland!
          </span>
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Continue your Scottish adventure to unlock new milestones and earn XP.
          Every journey creates memories and brings you closer to becoming a
          true Highland Explorer!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-gradient-to-r from-vibrant-blue to-scotland-loch hover:from-vibrant-blue/90 hover:to-scotland-loch/90"
            onClick={() => (window.location.href = "/journal")}
          >
            <Eye className="mr-2 h-5 w-5" />
            Add Journal Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/gallery")}
          >
            <Camera className="mr-2 h-5 w-5" />
            Upload Photos
          </Button>
        </div>
      </section>
    </div>
  );
}
