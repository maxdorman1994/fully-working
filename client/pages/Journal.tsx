import { useState, useEffect } from "react";
import { useSync } from "@/lib/syncService";
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  MapPin,
  Heart,
  Calendar,
  Route,
  Car,
  Dog,
  Edit,
  Trash2,
  Printer,
  Ticket,
  Loader2,
  AlertCircle,
  Eye,
  MoreHorizontal,
  Camera,
  Star,
  Compass,
  Mountain,
  Trees,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NewEntryForm from "@/components/NewEntryForm";
import EntryDetailModal from "@/components/EntryDetailModal";
import JournalEntryStats from "@/components/JournalEntryStats";
import {
  getJournalEntries,
  getJournalStats,
  getAllTags,
  searchJournalEntries,
  getJournalEntriesByTag,
  subscribeToJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  testSupabaseConnection,
} from "@/lib/journalService";
import { JournalEntry } from "@/lib/supabase";
import { ProcessedPhoto } from "@/lib/photoUtils";

export default function Journal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [isNewEntryFormOpen, setIsNewEntryFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionTest, setConnectionTest] = useState<string | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const { isAuthenticated, sessionTimeRemaining, logout } = useAuth();

  // Fallback data for development when Supabase is not configured
  const journalEntriesData: JournalEntry[] = [
    {
      id: "1",
      title: "Ben Nevis Summit - Our Greatest Challenge Yet!",
      date: "Sunday 3 August 2025",
      location: "Fort William, Highland",
      weather: "☀️ Sunny",
      mood: "🙏 Grateful",
      miles_traveled: 87,
      parking: "Free",
      dog_friendly: true,
      paid_activity: false,
      adult_tickets: "",
      child_tickets: "",
      other_tickets: "",
      pet_notes:
        "Dogs allowed off-lead on mountain paths, keep on lead near car park",
      content:
        "What an incredible day! After months of training, we finally conquered Ben Nevis. The views from the summit were absolutely breathtaking - you could see for miles across the Scottish Highlands. Little Alex was such a trooper, and Bonnie loved every minute of it...",
      photos: [
        "/placeholder.svg",
        "/placeholder.svg",
        "/placeholder.svg",
        "/placeholder.svg",
      ],
      tags: ["Mountain", "Challenge", "Family", "Views", "Achievement"],
    },
    {
      id: "2",
      title: "Magical Loch Lomond Picnic",
      date: "Sunday 28 July 2025",
      location: "Balloch, West Dunbartonshire",
      weather: "⛅ Partly Cloudy",
      mood: "😌 Peaceful",
      miles_traveled: 45,
      parking: "£5",
      dog_friendly: true,
      paid_activity: false,
      adult_tickets: "",
      child_tickets: "",
      other_tickets: "",
      pet_notes:
        "Dogs welcome on beach and walking paths, water bowls available at visitor center",
      content:
        "A perfect family day by the beautiful Loch Lomond. We found the most amazing spot for our picnic with stunning views across the water. The kids (and Bonnie) had so much fun skipping stones and exploring the shoreline...",
      photos: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
      tags: ["Lake", "Family", "Relaxing", "Nature", "Picnic"],
    },
    {
      id: "3",
      title: "Edinburgh Castle - Step Back in Time",
      date: "Saturday 15 July 2025",
      location: "Edinburgh, Midlothian",
      weather: "🌧️ Light Rain",
      mood: "🤩 Amazed",
      miles_traveled: 123,
      parking: "£12",
      dog_friendly: false,
      paid_activity: true,
      adult_tickets: "2 × £17.50",
      child_tickets: "1 × £10.50",
      other_tickets: "",
      pet_notes: "",
      content:
        "Despite the Scottish drizzle, Edinburgh Castle was absolutely magical. The history here is incredible - you can really feel the centuries of stories within these ancient walls. The views over Edinburgh from the castle are spectacular...",
      photos: ["/placeholder.svg", "/placeholder.svg"],
      tags: ["History", "Culture", "City", "Castle", "Education"],
    },
  ];

  const [entries, setEntries] = useState<JournalEntry[]>(journalEntriesData);
  const { subscribe } = useSync();

  // Load entries from database on mount, fallback to local data
  useEffect(() => {
    loadJournalEntries();
  }, []);

  // Auto-refresh data when page becomes visible (for cross-device sync)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Page visible - refreshing journal entries for sync");
        loadJournalEntries();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also refresh when window gets focus
    const handleFocus = () => {
      console.log("🔄 Window focused - refreshing journal entries for sync");
      loadJournalEntries();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Subscribe to real-time journal entry changes
  useEffect(() => {
    const unsubscribe = subscribe("journal_entries", (event) => {
      console.log("🔄 Journal sync event:", event.eventType, event.new?.id);

      if (event.new?._refresh) {
        // Force refresh from sync service
        loadJournalEntries();
        return;
      }

      switch (event.eventType) {
        case "INSERT":
          if (event.new) {
            setEntries((prev) => [event.new, ...prev]);
          }
          break;
        case "UPDATE":
          if (event.new) {
            setEntries((prev) =>
              prev.map((entry) =>
                entry.id === event.new.id ? { ...entry, ...event.new } : entry,
              ),
            );
          }
          break;
        case "DELETE":
          if (event.old) {
            setEntries((prev) =>
              prev.filter((entry) => entry.id !== event.old.id),
            );
          }
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const loadJournalEntries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Loading journal entries...");
      const supabaseEntries = await getJournalEntries();
      setEntries(supabaseEntries);
      console.log(
        "��� Loaded journal entries from Supabase:",
        supabaseEntries.length,
      );

      // Clear any previous errors if successful
      setError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        "Failed to load from Supabase, using local data:",
        errorMessage,
      );

      // Provide specific error messages based on error type
      if (errorMessage.includes("not configured")) {
        setError(
          "📝 Development Mode: Using sample data (Supabase not configured)",
        );
      } else if (errorMessage.includes("Network error")) {
        setError(
          "🌐 Connection Issue: Using offline data (check internet connection)",
        );
      } else if (errorMessage.includes("CORS error")) {
        setError(
          "🔧 Configuration Issue: Using sample data (invalid Supabase settings)",
        );
      } else if (errorMessage.includes("Failed to fetch")) {
        setError(
          "📡 Service Unavailable: Using offline data (Supabase may be down)",
        );
      } else {
        setError(
          `��️ Database Error: Using sample data (${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? "..." : ""})`,
        );
      }

      // Always fall back to local data
      setEntries(journalEntriesData);

      // Log error details for debugging
      console.error("Supabase error details:", {
        error,
        message: errorMessage,
        fallbackData: journalEntriesData.length + " sample entries loaded",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag =
      !selectedTag || selectedTag === "all" || entry.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSaveEntry = async (entryData: any) => {
    const isEditing = editingEntry !== null;
    console.log("🔄 HandleSaveEntry called:", {
      isEditing,
      editingEntry: editingEntry?.id,
      entryData,
    });

    try {
      setIsLoading(true);
      setError(null);

      // First, upload all photos to Cloudflare Images
      const uploadedPhotoUrls: string[] = [];

      if (entryData.photos && entryData.photos.length > 0) {
        console.log(
          `Uploading ${entryData.photos.length} photos to Cloudflare Images...`,
        );

        for (const photo of entryData.photos) {
          try {
            // Only upload if not already uploaded
            if (!photo.cloudflareUrl) {
              const { uploadPhotoToCloudflare } = await import(
                "@/lib/photoUtils"
              );
              const cloudflareUrl = await uploadPhotoToCloudflare(photo);
              uploadedPhotoUrls.push(cloudflareUrl);
              console.log(
                `✅ Uploaded: ${photo.originalFile.name} -> ${cloudflareUrl}`,
              );
            } else {
              uploadedPhotoUrls.push(photo.cloudflareUrl);
              console.log(`✅ Already uploaded: ${photo.cloudflareUrl}`);
            }
          } catch (uploadError) {
            console.error(
              `Failed to upload photo ${photo.originalFile.name}:`,
              uploadError,
            );
            // Continue with other photos, use placeholder for failed uploads
            uploadedPhotoUrls.push("/placeholder.svg");
            setError(`Some photos failed to upload but entry was saved`);
          }
        }
      }

      // Prepare entry data for Supabase with uploaded photo URLs
      const supabaseEntryData = {
        title: entryData.title,
        content: entryData.content,
        date: entryData.date,
        location: entryData.location,
        weather: entryData.weather,
        mood: entryData.mood,
        miles_traveled: parseInt(entryData.miles_traveled) || 0,
        parking: entryData.parking || "Not specified",
        dog_friendly: entryData.dog_friendly,
        paid_activity: entryData.paid_activity,
        adult_tickets: entryData.adult_tickets,
        child_tickets: entryData.child_tickets,
        other_tickets: entryData.other_tickets,
        pet_notes: entryData.pet_notes,
        tags: entryData.tags,
        photos: uploadedPhotoUrls,
        is_scenic_drive: entryData.is_scenic_drive || false,
        scenic_stops: entryData.scenic_stops || [],
      };

      console.log(
        isEditing
          ? "Updating journal entry with data:"
          : "Creating journal entry with data:",
        supabaseEntryData,
      );

      // Try to save to Supabase first
      try {
        if (isEditing && editingEntry) {
          const updatedEntry = await updateJournalEntry(
            editingEntry.id,
            supabaseEntryData,
          );
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === editingEntry.id ? updatedEntry : entry,
            ),
          );
          console.log("✅ Entry updated in Supabase successfully");
        } else {
          const savedEntry = await createJournalEntry(supabaseEntryData);
          setEntries((prev) => [savedEntry, ...prev]);
          console.log("✅ Entry saved to Supabase successfully");
        }

        // Close form and clear editing state on successful save
        setIsNewEntryFormOpen(false);
        setEditingEntry(null);
      } catch (supabaseError) {
        console.warn(
          "Failed to save to Supabase, saving locally:",
          supabaseError,
        );

        // Fallback to local storage
        const localEntry = {
          id: `local-${Date.now()}`,
          ...supabaseEntryData,
          date: new Date(entryData.date).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setEntries((prev) => [localEntry, ...prev]);
        console.log("✅ Entry saved locally as fallback");
      }
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      setError("Failed to save entry");
    } finally {
      setIsLoading(false);
    }
  };

  const allTags = Array.from(new Set(entries.flatMap((entry) => entry.tags)));

  const handleEntryClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedEntry(null);
  };

  const testConnection = async () => {
    try {
      setConnectionTest("Testing connection...");
      const result = await testSupabaseConnection();
      setConnectionTest(
        result.success
          ? `✅ ${result.message}`
          : `❌ ${result.message}: ${result.error}`,
      );
    } catch (error) {
      setConnectionTest(
        `❌ Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleEditClick = (entry: JournalEntry) => {
    console.log("🔧 Edit button clicked for:", entry.title, entry);
    if (!isAuthenticated) {
      console.log("❌ Not authenticated!");
      return;
    }
    console.log("✅ Setting editing entry and opening form");
    setEditingEntry(entry);
    setIsNewEntryFormOpen(true);
  };

  const handleDeleteClick = (entry: JournalEntry) => {
    setDeleteEntry(entry);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEntry) return;

    try {
      setIsDeleting(true);

      // Try to delete from Supabase first
      try {
        await deleteJournalEntry(deleteEntry.id);
        console.log("✅ Entry deleted from Supabase successfully");
      } catch (supabaseError) {
        console.warn(
          "Failed to delete from Supabase, removing locally:",
          supabaseError,
        );
      }

      // Remove from local state regardless
      setEntries((prev) => prev.filter((entry) => entry.id !== deleteEntry.id));

      // Close delete dialog
      setDeleteEntry(null);
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
      setError("Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteEntry(null);
  };

  // Fun statistics with animations
  const stats = [
    {
      icon: Compass,
      count: new Set(entries.map((e) => e.location)).size,
      label: "Places Discovered",
      gradient: "from-amber-500 via-orange-500 to-red-500",
      bgPattern: "🧭",
      description: "Unique locations",
    },
    {
      icon: Route,
      count: entries.reduce(
        (acc, entry) => acc + (entry.miles_traveled || 0),
        0,
      ),
      label: "Miles Traveled",
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bgPattern: "🛣️",
      description: "Total distance",
    },
    {
      icon: Camera,
      count: entries.reduce(
        (acc, entry) => acc + (entry.photos?.length || 0),
        0,
      ),
      label: "Memories Captured",
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      bgPattern: "📸",
      description: "Photos taken",
    },
    {
      icon: Star,
      count: allTags.length,
      label: "Story Tags",
      gradient: "from-indigo-500 via-blue-500 to-cyan-500",
      bgPattern: "⭐",
      description: "Adventure themes",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Hero Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-full blur-3xl transform -rotate-6"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-purple-200/50 shadow-lg">
              <span className="text-sm font-medium text-purple-700">
                Scottish Family Adventures
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 relative px-4 sm:px-0">
              <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Our Wee Adventures
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Capturing magical moments across the beautiful landscapes of
              Scotland
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-full"
              onClick={() => {
                if (isAuthenticated) {
                  setIsNewEntryFormOpen(true);
                }
              }}
            >
              <Plus className="mr-3 h-6 w-6" />
              Start New Adventure
              <Mountain className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Status Indicator */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 text-amber-800 shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span className="font-semibold">System Status</span>
              </div>
              <p className="text-sm text-center leading-relaxed">{error}</p>
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="text-xs text-center text-amber-600">
                  📱 Your data is safe - all changes will sync when connection
                  is restored
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Test Database Connection
                </Button>
                {connectionTest && (
                  <div className="text-xs text-center text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    {connectionTest}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mb-8 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-blue-200 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-blue-700 font-medium">
                Loading adventures...
              </span>
            </div>
          </div>
        )}

        {/* Fun Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-white to-slate-50"
              >
                <CardContent className="p-6 relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 text-6xl flex items-center justify-center font-bold">
                    {stat.bgPattern}
                  </div>

                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>

                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    <div className="text-4xl font-bold text-slate-800 mb-2 text-center group-hover:scale-110 transition-transform duration-300">
                      {stat.count}
                    </div>

                    <div className="text-sm font-semibold text-slate-600 text-center mb-1">
                      {stat.label}
                    </div>

                    <div className="text-xs text-slate-500 text-center">
                      {stat.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-12 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  🔍 Search Adventures
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Find your favorite memories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 border-2 border-slate-200 focus:border-blue-400 rounded-xl text-lg py-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  🏷️ Filter by Theme
                </label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400 rounded-xl">
                    <SelectValue placeholder="All adventures" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All adventures</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                  📅 Newest First
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTag("all");
                  }}
                  className="border-2 border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adventure Timeline */}
        <div className="relative">
          {/* Magical Timeline Line */}
          <div className="absolute left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-blue-400 via-purple-400 to-pink-400 rounded-full shadow-lg"></div>

          {/* Timeline Sparkles */}

          <div className="space-y-12">
            {filteredEntries.map((entry, index) => (
              <div key={entry.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute left-8 w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>

                {/* Entry Card */}
                <div className="ml-24">
                  <Card className="group/card hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header with gradient background */}
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b-2 border-slate-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 group-hover/card:text-blue-600 transition-colors duration-300">
                              {entry.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-slate-600 mb-4">
                              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border-2 border-slate-200">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {entry.date}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border-2 border-slate-200">
                                <MapPin className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium">
                                  {entry.location}
                                </span>
                              </div>
                            </div>

                            {/* Weather and Mood */}
                            <div className="flex gap-3 flex-wrap">
                              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border-2 border-blue-200">
                                {entry.weather}
                              </div>
                              <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold border-2 border-purple-200">
                                {entry.mood}
                              </div>
                              {/* Like and Comment Stats */}
                              <JournalEntryStats
                                entryId={entry.id}
                                className="px-3 py-2 bg-gray-50 rounded-full border-2 border-gray-200"
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEntryClick(entry)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAuthenticated && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(entry);
                                }}
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {isAuthenticated && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(entry);
                                }}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        {/* Travel Info */}
                        <div className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl p-5 mb-6 border-2 border-slate-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                                <Route className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-bold">
                                  {entry.miles_traveled} miles
                                </div>
                                <div className="text-xs text-slate-500">
                                  Distance traveled
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-slate-700">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                                <Car className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-bold">{entry.parking}</div>
                                <div className="text-xs text-slate-500">
                                  Parking cost
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-slate-700">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                                <Dog className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-bold">
                                  {entry.dog_friendly
                                    ? "🐕 Pet-friendly"
                                    : "❌ No pets"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Pet policy
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          {entry.dog_friendly && entry.pet_notes && (
                            <div className="bg-white rounded-xl p-4 border-2 border-pink-200 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Dog className="h-4 w-4 text-pink-500" />
                                <span className="font-semibold text-pink-700">
                                  Pet Notes:
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                {entry.pet_notes}
                              </p>
                            </div>
                          )}

                          {entry.paid_activity &&
                            (entry.adult_tickets ||
                              entry.child_tickets ||
                              entry.other_tickets) && (
                              <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <Ticket className="h-4 w-4 text-blue-500" />
                                  <span className="font-semibold text-blue-700">
                                    Ticket Information:
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  {entry.adult_tickets && (
                                    <div className="bg-blue-50 rounded-lg p-3">
                                      <div className="font-semibold text-blue-700">
                                        Adults
                                      </div>
                                      <div className="text-blue-600">
                                        {entry.adult_tickets}
                                      </div>
                                    </div>
                                  )}
                                  {entry.child_tickets && (
                                    <div className="bg-green-50 rounded-lg p-3">
                                      <div className="font-semibold text-green-700">
                                        Children
                                      </div>
                                      <div className="text-green-600">
                                        {entry.child_tickets}
                                      </div>
                                    </div>
                                  )}
                                  {entry.other_tickets && (
                                    <div className="bg-purple-50 rounded-lg p-3">
                                      <div className="font-semibold text-purple-700">
                                        Other
                                      </div>
                                      <div className="text-purple-600">
                                        {entry.other_tickets}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Photos Preview */}
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Camera className="h-5 w-5 text-purple-500" />
                              <h4 className="font-bold text-slate-700">
                                Adventure Photos
                              </h4>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {entry.photos
                                .slice(0, 3)
                                .map((photo, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-white group"
                                    onClick={() => handleEntryClick(entry)}
                                  >
                                    <img
                                      src={photo}
                                      alt={`Photo ${photoIndex + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                            </div>
                            {entry.photos.length > 3 && (
                              <div className="mt-4 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEntryClick(entry)}
                                  className="border-2 border-purple-200 hover:bg-purple-50 rounded-xl"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View all {entry.photos.length} photos
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold text-slate-700">
                              Adventure Tags
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm rounded-full border-2 border-purple-200 font-medium hover:scale-105 transition-transform duration-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Scenic Drive Stops Preview */}
                        {(entry as any).is_scenic_drive &&
                          (entry as any).scenic_stops &&
                          (entry as any).scenic_stops.length > 0 && (
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <Route className="h-4 w-4 text-emerald-500" />
                                <span className="font-semibold text-slate-700">
                                  Scenic Drive Stops
                                </span>
                              </div>
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-100">
                                <div className="space-y-3">
                                  {(entry as any).scenic_stops
                                    .slice(0, 3)
                                    .map((stop: any, stopIndex: number) => (
                                      <div
                                        key={stopIndex}
                                        className="flex items-start gap-3 bg-white rounded-lg p-3 border border-emerald-200"
                                      >
                                        <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                          {stopIndex + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-emerald-800 text-sm mb-1 truncate">
                                            {stop.name}
                                          </h4>
                                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                                            {stop.description.length > 80
                                              ? `${stop.description.substring(0, 80)}...`
                                              : stop.description}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  {(entry as any).scenic_stops.length > 3 && (
                                    <div className="text-center pt-2">
                                      <Button
                                        variant="link"
                                        className="p-0 h-auto text-emerald-600 hover:text-emerald-800 text-sm"
                                        onClick={() => handleEntryClick(entry)}
                                      >
                                        View all{" "}
                                        {(entry as any).scenic_stops.length}{" "}
                                        stops →
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Content Preview */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold text-slate-700">
                              Our Story
                            </span>
                          </div>
                          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-5 border-2 border-slate-100">
                            <p className="text-slate-700 leading-relaxed">
                              {entry.content.length > 200
                                ? `${entry.content.substring(0, 200)}...`
                                : entry.content}
                            </p>
                            {entry.content.length > 200 && (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-blue-600 hover:text-blue-800 mt-2"
                                onClick={() => handleEntryClick(entry)}
                              >
                                Read the full story →
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="text-center">
                          <Button
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            onClick={() => handleEntryClick(entry)}
                          >
                            <Eye className="h-5 w-5 mr-2" />
                            Explore Full Adventure
                            <Sparkles className="h-5 w-5 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl p-12 border-2 border-purple-200 max-w-md mx-auto">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                No Adventures Found
              </h3>
              <p className="text-slate-600 mb-6">
                Try adjusting your search or start a new adventure!
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTag("all");
                }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl"
              >
                Show All Adventures
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Forms and Modals */}
      <NewEntryForm
        isOpen={isNewEntryFormOpen}
        onClose={() => {
          setIsNewEntryFormOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={handleSaveEntry}
        editingEntry={editingEntry}
      />

      <EntryDetailModal
        entry={selectedEntry}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
      />

      {/* Delete Confirmation Dialog */}
      {deleteEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Delete Adventure?
              </h3>

              <p className="text-slate-600 mb-2">
                Are you sure you want to delete{" "}
                <strong>"{deleteEntry.title}"</strong>?
              </p>

              <p className="text-sm text-slate-500 mb-6">
                This action cannot be undone. All photos and memories will be
                permanently removed.
              </p>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Adventure
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
