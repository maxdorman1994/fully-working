import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useSync } from "@/lib/syncService";
import {
  subscribeToHomePageSync,
  forceRefreshHomeData,
  getCachedHomeData,
} from "@/lib/homePageSyncService";
import HomePageSyncIndicator from "@/components/HomePageSyncIndicator";
import {
  ArrowRight,
  Camera,
  MapPin,
  Heart,
  Calendar,
  Users,
  Edit,
  Upload,
  X,
  Check,
  ChevronDown,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  processPhoto,
  uploadPhotoToCloudflare,
  validatePhotoFile,
} from "@/lib/photoUtils";
import {
  getFamilyMembers,
  updateFamilyMemberAvatar,
  removeFamilyMemberAvatar,
  uploadFamilyMemberAvatar,
  subscribeToFamilyMembers,
  testFamilyMembersConnection,
  testSupabaseConnection,
  FamilyMember,
} from "@/lib/familyMembersService";
import {
  getAllRealStats,
  formatStatsForDisplay,
  RealAdventureStats,
} from "@/lib/realStatsService";
import {
  getRecentAdventuresWithFallback,
  subscribeToAdventureUpdates,
  RecentAdventure,
} from "@/lib/recentAdventuresService";
import { initializeMilestoneTracking } from "@/lib/milestoneTracker";
import {
  getMilestonesWithProgress,
  getMilestoneStats,
  subscribeToMilestoneUpdates,
  MilestoneWithProgress,
  MilestoneStats,
} from "@/lib/milestonesService";
import SpinningWheel from "@/components/SpinningWheel";

export default function Home() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const { subscribe } = useSync();
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "connected" | "connecting" | "disconnected" | "local"
  >("connecting");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [realStats, setRealStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentAdventures, setRecentAdventures] = useState<RecentAdventure[]>(
    [],
  );
  const [adventuresLoading, setAdventuresLoading] = useState(true);
  const [milestones, setMilestones] = useState<MilestoneWithProgress[]>([]);
  const [milestoneStats, setMilestoneStats] = useState<MilestoneStats>({
    completed_count: 0,
    in_progress_count: 0,
    locked_count: 0,
    total_xp: 0,
    completion_percentage: 0,
  });
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Spinning Wheel state
  const [isSpinningWheelOpen, setIsSpinningWheelOpen] = useState(false);

  // Adventure Discovery Modal state
  const [discoveryModal, setDiscoveryModal] = useState<{
    isOpen: boolean;
    type: string;
    title: string;
    suggestion: string;
    description: string;
    tips: string[];
    emoji: string;
  }>({
    isOpen: false,
    type: "",
    title: "",
    suggestion: "",
    description: "",
    tips: [],
    emoji: "",
  });

  const loadRealStats = async () => {
    try {
      setStatsLoading(true);
      console.log("📊 Loading real adventure statistics...");

      const { primary, additional } = await getAllRealStats();
      const formattedStats = formatStatsForDisplay(primary, additional);
      setRealStats(formattedStats);

      console.log("✅ Real stats loaded:", formattedStats);
    } catch (error) {
      console.error("Error loading real stats:", error);
      // Keep realStats as null to show fallback values
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMilestones = async () => {
    try {
      setMilestonesLoading(true);
      console.log("🏆 Loading milestones from database...");

      const [milestonesData, statsData] = await Promise.all([
        getMilestonesWithProgress("demo-user"),
        getMilestoneStats("demo-user"),
      ]);

      setMilestones(milestonesData);
      setMilestoneStats(statsData);

      console.log(
        `✅ Loaded ${milestonesData.length} milestones with ${statsData.completed_count} completed`,
      );
    } catch (error) {
      console.error(
        "Error loading milestones:",
        error instanceof Error ? error.message : String(error),
      );
      // Set empty milestone state on error
      setMilestones([]);
      setMilestoneStats({
        completed_count: 0,
        in_progress_count: 0,
        locked_count: 0,
        total_xp: 0,
        completion_percentage: 0,
      });
    } finally {
      setMilestonesLoading(false);
    }
  };

  const loadRecentAdventures = async () => {
    try {
      setAdventuresLoading(true);
      console.log("🏔️ Loading real recent adventures...");

      const adventures = await getRecentAdventuresWithFallback();
      setRecentAdventures(adventures);

      console.log(
        "✅ Recent adventures loaded:",
        adventures.length,
        "adventures",
      );
    } catch (error) {
      console.error("Error loading recent adventures:", error);
      // Fallback is handled in the service
    } finally {
      setAdventuresLoading(false);
    }
  };

  // Load family members data and setup real-time sync
  useEffect(() => {
    loadFamilyMembersData();
    loadRealStats();
    loadRecentAdventures();
    loadMilestones();

    // Initialize milestone tracking
    initializeMilestoneTracking("demo-user").catch((error) => {
      console.error("Error initializing milestone tracking:", error);
    });

    // Setup real-time subscriptions
    const unsubscribeFamilyMembers = subscribeToFamilyMembers((members) => {
      console.log(
        "🔄 Real-time sync update received:",
        members.length,
        "members",
      );

      // Real-time sync confirmed for family members

      setFamilyMembers(members);
      setSyncStatus("connected");
    });

    const unsubscribeAdventures = subscribeToAdventureUpdates((adventures) => {
      console.log(
        "🔄 Real-time adventures update received:",
        adventures.length,
        "adventures",
      );
      setRecentAdventures(adventures);
    });

    const unsubscribeMilestones = subscribeToMilestoneUpdates(
      "demo-user",
      (milestonesData) => {
        console.log(
          "🔄 Real-time milestones update received:",
          milestonesData.length,
          "milestones",
        );
        setMilestones(milestonesData);
        // Recalculate stats
        getMilestoneStats("demo-user").then(setMilestoneStats);
      },
    );

    return () => {
      unsubscribeFamilyMembers();
      unsubscribeAdventures();
      unsubscribeMilestones();
    };
  }, []);

  // Auto-refresh data when page becomes visible (for cross-device sync)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Page visible - refreshing home page data for sync");
        loadFamilyMembersData();
        loadRecentAdventures();
        loadRealStats();
      }
    };

    const handleFocus = () => {
      console.log("🔄 Window focused - refreshing home page data for sync");
      loadFamilyMembersData();
      loadRecentAdventures();
      loadRealStats();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Subscribe to cross-device sync events
  useEffect(() => {
    const unsubscribeFamilySync = subscribe("family_members", (event) => {
      console.log(
        "🔄 Cross-device family sync:",
        event.eventType,
        event.new?.name,
      );

      if (event.new?._refresh) {
        loadFamilyMembersData();
        return;
      }

      switch (event.eventType) {
        case "INSERT":
          if (event.new) {
            setFamilyMembers((prev) => {
              const exists = prev.find((member) => member.id === event.new.id);
              if (!exists) {
                return [...prev, event.new];
              }
              return prev;
            });
          }
          break;
        case "UPDATE":
          if (event.new) {
            setFamilyMembers((prev) =>
              prev.map((member) =>
                member.id === event.new.id
                  ? { ...member, ...event.new }
                  : member,
              ),
            );
          }
          break;
        case "DELETE":
          if (event.old) {
            setFamilyMembers((prev) =>
              prev.filter((member) => member.id !== event.old.id),
            );
          }
          break;
      }
    });

    // Subscribe to journal entries changes to refresh recent adventures
    const unsubscribeJournalSync = subscribe("journal_entries", (event) => {
      console.log(
        "🔄 Journal sync on home page:",
        event.eventType,
        event.new?.title || event.old?.title,
      );

      // Refresh recent adventures whenever journal entries change
      loadRecentAdventures();
    });

    return () => {
      unsubscribeFamilySync();
      unsubscribeJournalSync();
    };
  }, [subscribe]);

  // Subscribe to comprehensive home page sync
  useEffect(() => {
    console.log("🔄 Setting up comprehensive home page sync...");

    const unsubscribeHomeSync = subscribeToHomePageSync((data) => {
      console.log("🔄 Home page data synced:", data);

      if (data.stats) {
        console.log("📊 Stats updated from sync:", data.stats);
        // You can add state updates here if you want to show live stats
      }

      if (data.family_members) {
        console.log("👨‍���‍👧‍👦 Family members updated from sync");
        setFamilyMembers(data.family_members);
      }

      if (data.recent_adventures) {
        console.log("📖 Recent adventures updated from sync");
        setRecentAdventures(data.recent_adventures);
      }

      if (data.milestones) {
        console.log("🎯 Milestones updated from sync");
        setMilestones(data.milestones);
      }
    });

    return unsubscribeHomeSync;
  }, []);

  // Adventure Discovery helper functions
  const getRandomAdventure = () => {
    const adventures = [
      {
        title: "Explore Dunnottar Castle",
        description:
          "Perched dramatically on clifftops near Stonehaven, this medieval fortress offers breathtaking coastal views and rich Scottish history. Walk the ancient halls where Mary Queen of Scots once sheltered.",
        tips: [
          "Visit during golden hour for stunning photos",
          "Wear sturdy shoes for the clifftop walk",
          "Check tide times for the best experience",
          "Allow 2-3 hours for full exploration",
        ],
        emoji: "🏰",
      },
      {
        title: "Discover Glen Coe's Hidden Waterfall",
        description:
          "Venture beyond the main valley to find Steall Falls, Scotland's second-highest waterfall. A magical hike through the 'Valley of Weeping' leads to this spectacular 120-meter cascade.",
        tips: [
          "Start early to avoid crowds",
          "Bring waterproof clothing",
          "The wire bridge is optional but thrilling",
          "Perfect for family photos",
        ],
        emoji: "💧",
      },
      {
        title: "Visit Eilean Donan Castle",
        description:
          "Scotland's most photographed castle sits on a small tidal island where three sea lochs meet. This iconic fortress has appeared in countless films and offers magical Highland views.",
        tips: [
          "Best photos at sunrise or sunset",
          "Check opening times seasonally",
          "Explore the gift shop for clan history",
          "Great starting point for Isle of Skye",
        ],
        emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      },
      {
        title: "Explore the Trossachs National Park",
        description:
          "Known as 'Scotland in Miniature', this stunning area offers lochs, mountains, and forests perfect for family adventures. Rob Roy country with endless hiking possibilities.",
        tips: [
          "Visit Loch Katrine by steamship",
          "Try the family-friendly forest trails",
          "Great for wildlife spotting",
          "Perfect for scenic drives",
        ],
        emoji: "🌲",
      },
      {
        title: "Discover Skye's Fairy Pools",
        description:
          "Crystal-clear blue pools and waterfalls create a magical landscape at the foot of the Black Cuillin mountains. A relatively easy walk with extraordinary rewards.",
        tips: [
          "Early morning visits are less crowded",
          "Bring swimming gear for brave souls",
          "Wear good hiking boots",
          "Weather can change quickly",
        ],
        emoji: "🧚‍♀️",
      },
      {
        title: "Explore Ancient Callanish Stones",
        description:
          "On the Isle of Lewis, these mysterious stone circles predate Stonehenge. Standing for over 4,000 years, they offer a mystical connection to Scotland's ancient past.",
        tips: [
          "Visit during different light conditions",
          "Learn about ancient astronomy",
          "Combine with other Lewis attractions",
          "Respect the ancient site",
        ],
        emoji: "🗿",
      },
    ];
    return adventures[Math.floor(Math.random() * adventures.length)];
  };

  const getAdventureType = () => {
    const types = [
      {
        type: "Castle Adventure",
        description:
          "Scotland has over 1,500 castles, each with unique stories and stunning architecture. From royal residences to romantic ruins, castles offer glimpses into Scotland's turbulent and fascinating history.",
        suggestions: [
          "Edinburgh Castle",
          "Stirling Castle",
          "Urquhart Castle",
          "Caerlaverock Castle",
        ],
        tips: [
          "Many offer family-friendly activities",
          "Audio guides bring history to life",
          "Check for special events and reenactments",
          "Photography is usually allowed",
        ],
        emoji: "🏰",
      },
      {
        type: "Mountain Hiking",
        description:
          "With 282 Munros (mountains over 3,000ft) and countless smaller peaks, Scotland is a hiker's paradise. From gentle family walks to challenging climbs, there's something for every fitness level.",
        suggestions: [
          "Ben Nevis",
          "Ben Lomond",
          "Arthur's Seat",
          "The Cobbler",
        ],
        tips: [
          "Check weather conditions before setting out",
          "Tell someone your route",
          "Pack layers and waterproofs",
          "Start with easier peaks",
        ],
        emoji: "🏔️",
      },
      {
        type: "Coastal Exploration",
        description:
          "Scotland's coastline stretches for over 6,000 miles, featuring dramatic cliffs, pristine beaches, hidden coves, and charming fishing villages. Perfect for rock pooling, wildlife watching, and seaside adventures.",
        suggestions: ["Isle of Skye", "St. Andrews", "Oban", "John o' Groats"],
        tips: [
          "Check tide times for rock pooling",
          "Bring binoculars for wildlife",
          "Respect marine environments",
          "Beach safety is important",
        ],
        emoji: "🌊",
      },
      {
        type: "Scenic Drive",
        description:
          "Scotland's scenic routes offer breathtaking landscapes from the comfort of your car. Perfect for families who want to see multiple locations in one trip while enjoying spectacular Highland scenery.",
        suggestions: [
          "North Coast 500",
          "Trossachs Loop",
          "Borders Historic Route",
          "Argyll Coastal Route",
        ],
        tips: [
          "Plan regular stops for photos",
          "Book accommodation in advance",
          "Keep fuel tank topped up",
          "Check road conditions in winter",
        ],
        emoji: "🚗",
      },
      {
        type: "Wildlife Spotting",
        description:
          "Scotland's diverse landscapes support incredible wildlife. From red deer in the Highlands to puffins on coastal islands, seals, dolphins, and golden eagles await patient observers.",
        suggestions: [
          "Isle of Mull",
          "Cairngorms National Park",
          "Loch Ness",
          "Shetland Islands",
        ],
        tips: [
          "Early morning and evening are best",
          "Bring binoculars and camera",
          "Move quietly and be patient",
          "Respect wildlife habitats",
        ],
        emoji: "🦌",
      },
      {
        type: "Historical Site",
        description:
          "From ancient stone circles to battlefields, Scotland's history spans thousands of years. These sites offer fascinating insights into Celtic culture, Roman occupation, medieval times, and clan warfare.",
        suggestions: [
          "Culloden Battlefield",
          "Skara Brae",
          "Iona Abbey",
          "Melrose Abbey",
        ],
        tips: [
          "Visitor centers provide great context",
          "Many sites have family activities",
          "Guided tours offer deeper insights",
          "Combine multiple sites in one area",
        ],
        emoji: "🏛️",
      },
    ];
    return types[Math.floor(Math.random() * types.length)];
  };

  const getHiddenGem = () => {
    const gems = [
      {
        title: "The Hermitage Forest Walk",
        description:
          "Near Dunkeld, this enchanting woodland walk leads to the dramatic Black Linn Falls. Victorian follies and towering Douglas firs create a fairy-tale atmosphere that inspired Beatrix Potter.",
        tips: [
          "Free to visit year-round",
          "Wheelchair accessible paths available",
          "Beautiful in all seasons",
          "Combine with Dunkeld Cathedral visit",
        ],
        emoji: "💎",
      },
      {
        title: "Fingal's Cave, Staffa",
        description:
          "This natural sea cave formed by volcanic activity inspired Mendelssohn's Hebrides Overture. The hexagonal basalt columns create a natural cathedral with incredible acoustics.",
        tips: [
          "Boat trips from Mull or Iona",
          "Weather dependent access",
          "Bring seasickness remedies",
          "Absolutely magical experience",
        ],
        emoji: "🕳️",
      },
      {
        title: "The Kelpies",
        description:
          "These massive 30-meter horse head sculptures near Falkirk honor Scotland's industrial heritage and mythical water spirits. Illuminated at night, they're truly spectacular.",
        tips: [
          "Free to view externally",
          "Interior tours available",
          "Great for night photography",
          "Easy parking and facilities",
        ],
        emoji: "🐴",
      },
      {
        title: "Glenfinnan Viaduct",
        description:
          "Famous from Harry Potter films, this curved railway bridge offers stunning views over Loch Shiel. Watch the Jacobite Steam Train cross this engineering marvel.",
        tips: [
          "Train times vary seasonally",
          "Hiking trail to best viewpoint",
          "Visit the monument nearby",
          "Magical Highland scenery",
        ],
        emoji: "🚂",
      },
      {
        title: "Duncansby Stacks",
        description:
          "Just beyond John o' Groats, these dramatic sea stacks and cliffs offer some of Scotland's most spectacular coastal scenery without the crowds of more famous spots.",
        tips: [
          "Short walk from car park",
          "Stay away from cliff edges",
          "Incredible bird watching",
          "Often overlooked by tourists",
        ],
        emoji: "⛰️",
      },
      {
        title: "The Falkirk Wheel",
        description:
          "The world's only rotating boat lift connects two canals in an incredible feat of engineering. Watch boats being lifted 24 meters in this modern Scottish marvel.",
        tips: [
          "Boat trips available",
          "Visitor center with exhibits",
          "Great for engineering enthusiasts",
          "Family-friendly attraction",
        ],
        emoji: "⚙️",
      },
    ];
    return gems[Math.floor(Math.random() * gems.length)];
  };

  const getFamilyVote = () => {
    const votes = [
      {
        title: "Castle Showdown",
        option1: {
          name: "Edinburgh Castle",
          description:
            "Scotland's most famous fortress, perched high above the capital city",
        },
        option2: {
          name: "Stirling Castle",
          description:
            "Renaissance palace with stunning views and rich royal history",
        },
        question: "Which royal residence calls to your family?",
        emoji: "🏰",
      },
      {
        title: "Mountain Challenge",
        option1: {
          name: "Ben Nevis",
          description:
            "Scotland's highest peak - the ultimate hiking challenge",
        },
        option2: {
          name: "Ben Lomond",
          description: "More accessible Munro with spectacular loch views",
        },
        question: "Which peak will you conquer together?",
        emoji: "⛰️",
      },
      {
        title: "Island Adventure",
        option1: {
          name: "Isle of Skye",
          description: "Dramatic landscapes, fairy pools, and ancient castles",
        },
        option2: {
          name: "Isle of Arran",
          description:
            "Scotland in miniature with whisky, wildlife, and beaches",
        },
        question: "Which island paradise beckons?",
        emoji: "🏝️",
      },
      {
        title: "Loch Legends",
        option1: {
          name: "Loch Ness",
          description: "Hunt for Nessie in Scotland's most mysterious waters",
        },
        option2: {
          name: "Loch Katrine",
          description: "Pristine beauty in the heart of the Trossachs",
        },
        question: "Which legendary loch wins your hearts?",
        emoji: "🌊",
      },
      {
        title: "Highland Valleys",
        option1: {
          name: "Glen Coe",
          description: "The Valley of Weeping with dramatic mountain scenery",
        },
        option2: {
          name: "Cairngorms",
          description: "Ancient mountains with abundant wildlife and forests",
        },
        question: "Which Highland valley calls for exploration?",
        emoji: "🏔️",
      },
      {
        title: "Coastal Cities",
        option1: {
          name: "Aberdeen",
          description:
            "The Granite City with beautiful beaches and maritime heritage",
        },
        option2: {
          name: "Dundee",
          description:
            "City of Discovery with the new V&A museum and RRS Discovery ship",
        },
        question: "Which coastal city captures your imagination?",
        emoji: "🏙️",
      },
    ];
    return votes[Math.floor(Math.random() * votes.length)];
  };

  const showDiscoveryModal = (type: string) => {
    let modalData;

    switch (type) {
      case "random":
        const adventure = getRandomAdventure();
        modalData = {
          isOpen: true,
          type: "Random Adventure",
          title: adventure.title,
          suggestion: adventure.title,
          description: adventure.description,
          tips: adventure.tips,
          emoji: adventure.emoji,
        };
        break;
      case "roulette":
        const adventureType = getAdventureType();
        modalData = {
          isOpen: true,
          type: "Adventure Type",
          title: adventureType.type,
          suggestion: `Explore ${adventureType.type} options: ${adventureType.suggestions.join(", ")}`,
          description: adventureType.description,
          tips: adventureType.tips,
          emoji: adventureType.emoji,
        };
        break;
      case "gems":
        const gem = getHiddenGem();
        modalData = {
          isOpen: true,
          type: "Hidden Gem",
          title: gem.title,
          suggestion: gem.title,
          description: gem.description,
          tips: gem.tips,
          emoji: gem.emoji,
        };
        break;
      case "vote":
        const vote = getFamilyVote();
        modalData = {
          isOpen: true,
          type: "Family Vote",
          title: vote.title,
          suggestion: `${vote.option1.name} vs ${vote.option2.name}`,
          description: `Option 1: ${vote.option1.name} - ${vote.option1.description}\n\nOption 2: ${vote.option2.name} - ${vote.option2.description}\n\n${vote.question}`,
          tips: [
            "Discuss as a family",
            "Consider everyone's interests",
            "Maybe visit both eventually!",
            "Make it a fun family decision",
          ],
          emoji: vote.emoji,
        };
        break;
      default:
        return;
    }

    setDiscoveryModal(modalData);
  };

  const loadFamilyMembersData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Loading family members from database...");
      const members = await getFamilyMembers();

      setFamilyMembers(members);
      setSyncStatus("connected");
      setError(null);

      console.log(`✅ Loaded ${members.length} family members successfully`);
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
        errorMessage.includes("Could not find the table")
      ) {
        setError(
          "🎯 Database Setup Required: Please run family-members-schema.sql in Supabase SQL Editor - using local data",
        );
      } else {
        setSyncStatus("disconnected");
        setError(
          `⚠️ Database Error: Using local data (${errorMessage.substring(0, 50)}...)`,
        );
      }

      // Fallback to hardcoded data
      setFamilyMembers([
        {
          id: "1",
          name: "Max Dorman",
          role: "DAD",
          bio: "Adventure enthusiast and family trip organizer. Loves planning routes, discovering hidden gems, and capturing the perfect Highland sunset photos.",
          position_index: 0,
          display_avatar: "/placeholder.svg",
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
          display_avatar: "/placeholder.svg",
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
          display_avatar: "/placeholder.svg",
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
          display_avatar: "/placeholder.svg",
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
          display_avatar: "/placeholder.svg",
          colors: {
            bg: "bg-gradient-to-br from-amber-50 to-yellow-100",
            border: "border-amber-200/60",
            accent: "from-amber-500 to-yellow-500",
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoEdit = (memberId: string) => {
    // Only allow photo edit if authenticated
    if (!isAuthenticated) {
      return;
    }

    setEditingMember(memberId);
    fileInputRef.current?.click();
  };

  const handlePhotoRemove = async (memberId: string) => {
    // Only allow photo removal if authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      console.log(`🗑️ Removing photo for member: ${memberId}`);
      await removeFamilyMemberAvatar(memberId);
      await loadFamilyMembersData();
      console.log("✅ Photo removed successfully");
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Failed to remove photo. Please try again.");
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || editingMember === null) return;

    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      alert(`Invalid file: ${validation.error}`);
      return;
    }

    setIsUploading(true);
    try {
      console.log(
        `📸 Processing and uploading photo for member: ${editingMember}`,
      );
      console.log(`📋 Current error state: ${error}`);
      console.log(`📋 Sync status: ${syncStatus}`);

      // Process the photo
      console.log(`🔄 Processing photo: ${file.name}`);
      const processedPhoto = await processPhoto(file);
      console.log(`✅ Photo processed successfully:`, {
        id: processedPhoto.id,
        preview: processedPhoto.preview?.substring(0, 50) + "...",
        hasFile: !!processedPhoto.file,
        fileSize: processedPhoto.file?.size,
      });

      if (error && error.includes("Database Setup Required")) {
        // If database isn't set up, use local state only
        console.log("📦 Using local state for avatar (database not available)");
        setFamilyMembers((prev) =>
          prev.map((member) =>
            member.id === editingMember
              ? {
                  ...member,
                  display_avatar: processedPhoto.preview,
                  has_custom_avatar: true,
                }
              : member,
          ),
        );
      } else {
        // Upload to Cloudflare and update database
        console.log(`☁️ Starting Cloudflare upload and database update...`);
        const updatedMember = await uploadFamilyMemberAvatar(
          editingMember,
          processedPhoto,
          (progress) => {
            console.log(`��� Upload progress: ${progress}%`);
          },
        );
        console.log(`✅ Upload completed, updated member:`, {
          id: updatedMember.id,
          name: updatedMember.name,
          avatar_url: updatedMember.avatar_url,
          display_avatar: updatedMember.display_avatar,
        });

        // Reload data to get updated state
        console.log(`🔄 Reloading family members data...`);
        await loadFamilyMembersData();
      }

      setEditingMember(null);
      console.log(`✅ Profile photo updated successfully`);
    } catch (dbError) {
      console.error("❌ Error uploading avatar:", dbError);
      console.error("❌ Error details:", {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        editingMember,
        fileName: file.name,
      });

      // Test connectivity if it's a network error
      if (
        dbError instanceof Error &&
        dbError.message.includes("Network connection failed")
      ) {
        console.log("🔍 Network error detected, testing connectivity...");
        // Auto-test connectivity and provide helpful message
        alert(
          `Network connection failed while uploading photo. Please check your internet connection and try again.\n\nThe photo may have been processed but not saved to the database.`,
        );
      } else {
        alert(
          `Failed to upload photo: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    event.target.value = "";
  };

  const removePhoto = async (memberId: string) => {
    // Only allow photo removal if authenticated
    if (!isAuthenticated) {
      console.log("❌ Photo removal denied - user not authenticated");
      return;
    }

    try {
      if (error && error.includes("Database Setup Required")) {
        // Local only
        setFamilyMembers((prev) =>
          prev.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  display_avatar: "/placeholder.svg",
                  has_custom_avatar: false,
                  avatar_url: undefined,
                }
              : member,
          ),
        );
      } else {
        await removeFamilyMemberAvatar(memberId);
        await loadFamilyMembersData();
      }
    } catch (dbError) {
      console.error("Database error, using local state:", dbError);

      // Check if it's a network error and show user-friendly message
      if (
        dbError instanceof Error &&
        dbError.message.includes("Network connection failed")
      ) {
        alert(
          "Network connection failed. The photo will be removed locally, but you may need to try again when online.",
        );
      } else {
        console.log("Using local state fallback due to database error");
      }

      // Always update local state as fallback
      setFamilyMembers((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? {
                ...member,
                display_avatar: "/placeholder.svg",
                has_custom_avatar: false,
              }
            : member,
        ),
      );
    }
  };

  const testConnection = async () => {
    try {
      setSyncStatus("connecting");
      setError("🔍 Testing database connection and checking tables...");

      // Import the debug function
      const { debugAvailableTables } = await import(
        "@/lib/familyMembersService"
      );

      // First check what tables are available
      console.log("🔍 Debugging available tables...");
      const availableTables = await debugAvailableTables();
      console.log("📋 Found tables:", availableTables);

      const result = await testFamilyMembersConnection();

      if (result.success) {
        setSyncStatus("connected");
        setError(`��� ${result.message}`);

        // Reload data after successful connection
        await loadFamilyMembersData();
      } else {
        setSyncStatus("disconnected");
        let debugInfo = "";
        if (availableTables.length > 0) {
          debugInfo = ` (Found tables: ${availableTables.join(", ")})`;
        } else {
          debugInfo = ` (No accessible tables found)`;
        }
        setError(
          `❌ ${result.message}${result.error ? ": " + result.error : ""}${debugInfo}`,
        );
      }
    } catch (error) {
      setSyncStatus("disconnected");
      setError(
        `❌ Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Loading Family Crew
          </h3>
          <p className="text-slate-600">Getting your adventure team ready...</p>
        </div>
      </div>
    );
  }

  // Helper functions to get real or fallback stat values
  const getStatValue = (statType: string, fallback: number): number => {
    if (realStats && realStats[statType]) {
      return realStats[statType].value;
    }
    return fallback;
  };

  const getStatDescription = (statType: string, fallback: string): string => {
    if (realStats && realStats[statType]) {
      return realStats[statType].description;
    }
    return fallback;
  };

  const hardcodedMembers = [
    {
      name: "Max Dorman",
      role: "DAD",
      avatar: "/placeholder.svg",
      bio: "Adventure enthusiast and family trip organizer. Loves planning routes, discovering hidden gems, and capturing the perfect Highland sunset photos.",
      colors: {
        bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
        border: "border-blue-200/60",
        accent: "from-blue-500 to-indigo-500",
      },
    },
    {
      name: "Charlotte Foster",
      role: "MUM",
      avatar: "/placeholder.svg",
      bio: "Nature lover and family historian. Documents our adventures and ensures everyone stays safe while exploring Scotland's wild landscapes.",
      colors: {
        bg: "bg-gradient-to-br from-rose-50 to-pink-100",
        border: "border-rose-200/60",
        accent: "from-rose-500 to-pink-500",
      },
    },
    {
      name: "Oscar",
      role: "SON",
      avatar: "/placeholder.svg",
      bio: "Young explorer with boundless energy. Always the first to spot wildlife and loves climbing rocks and splashing in Highland streams.",
      colors: {
        bg: "bg-gradient-to-br from-green-50 to-emerald-100",
        border: "border-green-200/60",
        accent: "from-green-500 to-emerald-500",
      },
    },
    {
      name: "Rose",
      role: "DAUGHTER",
      avatar: "/placeholder.svg",
      bio: "Curious adventurer who collects interesting stones and leaves. Has an amazing memory for the stories behind each place we visit.",
      colors: {
        bg: "bg-gradient-to-br from-purple-50 to-violet-100",
        border: "border-purple-200/60",
        accent: "from-purple-500 to-violet-500",
      },
    },
    {
      name: "Lola",
      role: "DAUGHTER",
      avatar: "/placeholder.svg",
      bio: "Our youngest adventurer with the biggest smile. Brings joy to every journey and reminds us to appreciate the simple moments.",
      colors: {
        bg: "bg-gradient-to-br from-amber-50 to-yellow-100",
        border: "border-amber-200/60",
        accent: "from-amber-500 to-yellow-500",
      },
    },
  ];

  // Real recent adventures are loaded via useEffect and stored in state

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sync Status Indicator */}
      <div className="flex justify-end mb-4">
        <HomePageSyncIndicator />
      </div>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-vibrant-blue via-scotland-loch to-vibrant-teal bg-clip-text text-transparent">
            Welcome to Our
          </span>
          <br />
          <span className="bg-gradient-to-r from-scotland-thistle via-vibrant-pink to-scotland-heather bg-clip-text text-transparent">
            Scottish Adventure
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Follow our family as we explore the breathtaking landscapes, rich
          history, and hidden gems of Scotland. Every adventure is a memory
          waiting to be made.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-vibrant-blue to-scotland-loch hover:from-vibrant-blue/90 hover:to-scotland-loch/90"
          >
            <Link to="/journal">
              <Calendar className="mr-2 h-5 w-5" />
              View Our Journey
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/gallery">
              <Camera className="mr-2 h-5 w-5" />
              Photo Gallery
            </Link>
          </Button>
        </div>
      </div>

      {/* Family Members */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-vibrant-blue to-scotland-loch bg-clip-text text-transparent">
            Meet the Adventure Crew
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {familyMembers
            .filter((member) => member.position_index <= 4) // Immediate family (positions 0-4)
            .map((member) => (
              <Card
                key={member.id}
                className={`text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${member.colors.bg} backdrop-blur-sm border-2 ${member.colors.border}`}
              >
                <CardContent className="p-6">
                  <div className="relative group w-24 h-24 sm:w-28 sm:h-28 lg:w-34 lg:h-34 mx-auto mb-4">
                    <div
                      className={`w-full h-full rounded-full overflow-hidden border-3 bg-gradient-to-r ${member.colors.accent} p-0.5 shadow-lg`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img
                          src={
                            member.display_avatar ||
                            member.avatar_url ||
                            "/placeholder.svg"
                          }
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Edit overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-1">
                        {isAuthenticated && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
                            onClick={() => handlePhotoEdit(member.id)}
                            disabled={isUploading}
                          >
                            {isUploading && editingMember === member.id ? (
                              <Upload className="h-3 w-3 animate-pulse" />
                            ) : (
                              <Edit className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        {member.has_custom_avatar && isAuthenticated && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 w-7 p-0"
                            onClick={() => removePhoto(member.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Hidden file input for photo editing */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Sync Status & Instructions */}
        <div className="mt-6 space-y-4">
          {/* Sync Status Indicator */}
          <div className="flex items-center justify-center gap-2">
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
                ? "🌐 Profile photos sync across devices"
                : syncStatus === "connecting"
                  ? "��� Connecting..."
                  : syncStatus === "local"
                    ? "📱 Local mode only"
                    : "❌ Sync disconnected"}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className={`max-w-md mx-auto border-2 rounded-xl p-3 text-center ${
                error.startsWith("✅")
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800"
              }`}
            >
              <p className="text-xs leading-relaxed mb-2">{error}</p>

              {error.includes("Database Setup Required") && (
                <div className="bg-white/50 rounded-lg p-2 mb-2 text-xs">
                  <div className="font-semibold mb-1">
                    📋 Setup Instructions:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700 text-xs">
                    <li>Go to Supabase Dashboard → SQL Editor</li>
                    <li>Paste contents of family-members-schema.sql</li>
                    <li>Run the schema to create tables</li>
                    <li>Click "Test" button below to verify</li>
                  </ol>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={syncStatus === "connecting"}
                  className="text-xs px-2 py-1"
                >
                  {syncStatus === "connecting" ? (
                    <>
                      <Upload className="h-3 w-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Edit instructions */}
          {!error || error.startsWith("✅") ? (
            <div className="text-center">
              <p className="text-sm text-slate-500">
                💡 Hover over any family member's photo and click the edit
                button to upload a custom picture!
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Our Furry Family Member */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
            Our Furry Adventure Companion
          </span>
        </h2>
        <div className="flex justify-center">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-amber-50 to-orange-100 backdrop-blur-sm border-2 border-amber-200/60 max-w-4xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Text Content - Left Side */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold text-amber-800 mb-3">
                    Charlie
                  </h3>
                  <p className="text-base sm:text-lg font-medium text-amber-600 mb-4 sm:mb-6">
                    ADVENTURE DOG
                  </p>
                  <p className="text-sm sm:text-base text-amber-700 leading-relaxed mb-4 sm:mb-6">
                    Our loyal four-legged family member who never misses an
                    adventure! Charlie is the ultimate Scottish explorer, always
                    ready to hike through the Highlands, chase waves on Scottish
                    beaches, and provide endless entertainment around the
                    campfire. With boundless energy and an adventurous spirit,
                    Charlie reminds us to stay curious, live in the moment, and
                    find joy in every trail we explore together. 🐕
                  </p>

                  {/* Paw print decorations */}
                  <div className="flex gap-2 opacity-40">
                    <span className="text-amber-600">🐾</span>
                    <span className="text-orange-600">���</span>
                    <span className="text-amber-600">🐾</span>
                  </div>
                </div>

                {/* Photo - Right Side */}
                <div className="relative group w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0">
                  <div className="w-full h-full rounded-xl overflow-hidden border-4 bg-gradient-to-r from-amber-500 to-orange-600 p-1 shadow-xl">
                    <div className="w-full h-full rounded-lg overflow-hidden bg-white">
                      <img
                        src={
                          familyMembers.find((m) => m.name === "Charlie")
                            ?.display_avatar ||
                          familyMembers.find((m) => m.name === "Charlie")
                            ?.avatar_url ||
                          "/placeholder.svg"
                        }
                        alt="Charlie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Edit overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10 w-10 p-0 bg-white/90 hover:bg-white"
                        onClick={() => {
                          const charlieMember = familyMembers.find(
                            (m) => m.name === "Charlie",
                          );
                          if (charlieMember) handlePhotoEdit(charlieMember.id);
                        }}
                        disabled={isUploading}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      {(() => {
                        const charlieMember = familyMembers.find(
                          (m) => m.name === "Charlie",
                        );
                        return (
                          charlieMember?.avatar_url &&
                          charlieMember.avatar_url !== "/placeholder.svg" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (isAuthenticated) {
                                  handlePhotoRemove(charlieMember.id);
                                }
                              }}
                              disabled={isUploading}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          )
                        );
                      })()}
                    </div>
                  </div>

                  {/* Upload indicator */}
                  {isUploading &&
                    editingMember ===
                      familyMembers.find((m) => m.name === "Charlie")?.id && (
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-amber-600">
            🐕 Our trusted adventure companion, making every Scottish journey
            more memorable!
          </p>
        </div>
      </section>

      {/* Extended Family */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-emerald-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Our Extended Adventure Family
          </span>
        </h2>

        {/* All Extended Family Members on One Line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {familyMembers
            .filter(
              (member) =>
                (member.name === "John Dorman" ||
                  member.name === "Rachel Dorman" ||
                  member.name === "Lewis" ||
                  member.name === "Zara" ||
                  member.name === "Kira" ||
                  member.name === "Frankie" ||
                  member.name === "Iris") &&
                member.position_index > 4,
                // Removed Charlie and Fern filtering
            )
            .sort((a, b) => {
              // Sort to put parents first, then children
              const order = [
                "John Dorman",
                "Rachel Dorman",
                "Lewis",
                "Zara",
                "Kira",
                "Frankie",
                "Iris",
              ];
              return order.indexOf(a.name) - order.indexOf(b.name);
            })
            .map((member) => (
              <Card
                key={member.id}
                className={`text-center hover:shadow-lg transition-all duration-300 hover:scale-105 ${member.colors.bg} backdrop-blur-sm border-2 ${member.colors.border}`}
              >
                <CardContent className="p-4">
                  <div className="relative group w-20 h-20 sm:w-24 sm:h-24 lg:w-30 lg:h-30 mx-auto mb-3">
                    <div
                      className={`w-full h-full rounded-full overflow-hidden border-2 bg-gradient-to-r ${member.colors.accent} p-0.5 shadow-md`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img
                          src={
                            member.display_avatar ||
                            member.avatar_url ||
                            "/placeholder.svg"
                          }
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Edit overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0 bg-white/90 hover:bg-white"
                          onClick={() => handlePhotoEdit(member.id)}
                          disabled={isUploading}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {member.avatar_url &&
                          member.avatar_url !== "/placeholder.svg" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0 bg-red-500/90 hover:bg-red-600"
                              onClick={() => {
                                if (isAuthenticated) {
                                  handlePhotoRemove(member.id);
                                }
                              }}
                              disabled={isUploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-base text-gray-800 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            🏴󠁧󠁢󠁳󠁣󠁴󠁿 Our big Scottish family makes every adventure more memorable
            together!
          </p>
        </div>
      </section>

      {/* Our Other Furry Family Member */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Meet Fern
          </span>
        </h2>
        <div className="flex justify-center">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-100 backdrop-blur-sm border-2 border-green-200/60 max-w-4xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Photo - Left Side */}
                <div className="relative group w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0">
                  <div className="w-full h-full rounded-xl overflow-hidden border-4 bg-gradient-to-r from-green-500 to-emerald-600 p-1 shadow-xl">
                    <div className="w-full h-full rounded-lg overflow-hidden bg-white">
                      <img
                        src={
                          familyMembers.find((m) => m.name === "Fern")
                            ?.display_avatar ||
                          familyMembers.find((m) => m.name === "Fern")
                            ?.avatar_url ||
                          "/placeholder.svg"
                        }
                        alt="Fern"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Edit overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10 w-10 p-0 bg-white/90 hover:bg-white"
                        onClick={() => {
                          const fernMember = familyMembers.find(
                            (m) => m.name === "Fern",
                          );
                          if (fernMember) handlePhotoEdit(fernMember.id);
                        }}
                        disabled={isUploading}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      {(() => {
                        const fernMember = familyMembers.find(
                          (m) => m.name === "Fern",
                        );
                        return (
                          fernMember?.avatar_url &&
                          fernMember.avatar_url !== "/placeholder.svg" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (isAuthenticated) {
                                  handlePhotoRemove(fernMember.id);
                                }
                              }}
                              disabled={isUploading}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          )
                        );
                      })()}
                    </div>
                  </div>

                  {/* Upload indicator */}
                  {isUploading &&
                    editingMember ===
                      familyMembers.find((m) => m.name === "Fern")?.id && (
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                </div>

                {/* Text Content - Right Side */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold text-green-800 mb-3">
                    Fern
                  </h3>
                  <p className="text-base sm:text-lg font-medium text-green-600 mb-4 sm:mb-6">
                    ADVENTURE DOG
                  </p>
                  <p className="text-sm sm:text-base text-green-700 leading-relaxed mb-4 sm:mb-6">
                    Our spirited second furry explorer who brings her own unique
                    energy to every Scottish adventure! Fern is the perfect
                    adventure buddy - curious about every new trail, fearless
                    when exploring rocky highlands, and always ready to splash
                    through Highland streams. With her playful nature and
                    boundless enthusiasm, Fern adds joy and laughter to our
                    family expeditions, reminding us that the best adventures
                    are shared with those who love the journey as much as the
                    destination. 🌿
                  </p>

                  {/* Leaf decorations */}
                  <div className="flex gap-2 opacity-40">
                    <span className="text-green-600">🌿</span>
                    <span className="text-emerald-600">🍃</span>
                    <span className="text-green-600">🌿</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-green-600">
            🌿 Our second adventure companion, doubling the fun on every
            Scottish journey!
          </p>
        </div>
      </section>

      {/* Adventure Milestones */}
      <section className="mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Dynamic Milestone Achievement Banner */}
          <div
            className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 rounded-2xl border-2 border-emerald-200/60 p-6 mb-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
            onClick={() => (window.location.href = "/milestones")}
          >
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                {milestonesLoading ? (
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-300 animate-pulse rounded mx-auto w-80"></div>
                    <div className="h-4 bg-gray-300 animate-pulse rounded mx-auto w-60"></div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-emerald-800 mb-1">
                      {milestoneStats.completed_count > 0
                        ? `🏆 ${milestoneStats.completed_count} Milestones Completed • ${milestoneStats.total_xp} XP Earned!`
                        : "🏴󠁧󠁢󠁳󠁣���󠁿 Start Your Scottish Adventure Journey!"}
                    </h3>
                    <p className="text-sm text-emerald-600">
                      {milestoneStats.completed_count > 0
                        ? `🎉 Amazing progress! ${Math.round(milestoneStats.completion_percentage)}% complete • Click to view all milestones →`
                        : "🌟 Begin exploring Scotland and unlock exciting milestones along the way • Click to view all achievements →"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Milestone Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestonesLoading
              ? // Loading skeleton
                Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <Card
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200/60"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-gray-300 animate-pulse rounded-full mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-300 animate-pulse rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 animate-pulse rounded mb-3"></div>
                        <div className="h-6 bg-gray-300 animate-pulse rounded-full w-20 mx-auto"></div>
                      </CardContent>
                    </Card>
                  ))
              : // Show top 3 milestones (mix of completed and next available)
                milestones.slice(0, 3).map((milestone) => {
                  const isCompleted =
                    milestone.progress?.status === "completed";
                  const isInProgress =
                    milestone.progress?.status === "in_progress";
                  const progressPercentage = milestone.progressPercentage || 0;

                  // Icon mapping
                  const iconMap: { [key: string]: any } = {
                    MapPin,
                    Camera,
                    Heart,
                    Calendar,
                    Users,
                  };
                  const Icon = iconMap[milestone.icon] || MapPin;

                  return (
                    <Card
                      key={milestone.id}
                      className={`bg-gradient-to-br ${milestone.color_scheme.bgColor} border-2 ${milestone.color_scheme.borderColor} hover:shadow-lg transition-all duration-300 ${!isCompleted && !isInProgress ? "opacity-75" : ""}`}
                    >
                      <CardContent className="p-6 text-center">
                        <div
                          className={`w-16 h-16 bg-gradient-to-r ${milestone.color_scheme.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${!isCompleted && !isInProgress ? "opacity-50" : ""}`}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h4
                          className={`font-bold mb-2 ${isCompleted ? "text-emerald-800" : isInProgress ? "text-amber-800" : "text-gray-600"}`}
                        >
                          {milestone.title}
                        </h4>
                        <p
                          className={`text-sm mb-3 ${isCompleted ? "text-emerald-600" : isInProgress ? "text-amber-600" : "text-gray-500"}`}
                        >
                          {milestone.description}
                        </p>

                        {isCompleted && (
                          <div className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full inline-block">
                            ✅ Completed
                          </div>
                        )}

                        {isInProgress && (
                          <div className="space-y-2">
                            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`bg-gradient-to-r ${milestone.color_scheme.color} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <div className="bg-amber-500 text-white text-xs px-3 py-1 rounded-full inline-block">
                              🚀 In Progress
                            </div>
                          </div>
                        )}

                        {!isCompleted && !isInProgress && (
                          <div className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full inline-block">
                            �� Locked
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
          </div>

          {/* Next Milestone Preview */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200/60 p-4 mb-6">
              <h4 className="font-semibold text-amber-800 mb-2">
                🎯 Next Milestone: Highland Explorer
              </h4>
              <p className="text-sm text-amber-600 mb-3">
                Visit 5 different Scottish locations to unlock this achievement!
              </p>
              <div className="bg-amber-100 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-500"
                  style={{ width: "20%" }}
                ></div>
              </div>
              <p className="text-xs text-amber-600">1 of 5 locations visited</p>
            </div>

            <Button
              onClick={() => (window.location.href = "/milestones")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Calendar className="mr-2 h-5 w-5" />
              View All Milestones
            </Button>
          </div>
        </div>
      </section>

      {/* Adventure Stats */}
      <section className="mb-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Our Adventure Journey
            </span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Every adventure tells a story, every place holds a memory, and every
            moment becomes a treasured part of our Scottish family legacy.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Journal Entries */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">📖</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("journal_entries", 6)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Journal Entries
                </div>
                <div className="text-sm text-slate-500">
                  {getStatDescription(
                    "journal_entries",
                    "Stories captured & memories preserved",
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Places Visited */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">🗺️</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("places_explored", 6)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Places Explored
                </div>
                <div className="text-sm text-slate-500">
                  {getStatDescription(
                    "places_explored",
                    "Across Scotland's breathtaking landscapes",
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Memory Tags */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">💝</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("memory_tags", 19)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Memory Tags
                </div>
                <div className="text-sm text-slate-500">
                  {getStatDescription(
                    "memory_tags",
                    "Special moments & magical experiences",
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Photos Captured */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">📸</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("photos_captured", 127)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Photos Captured
                </div>
                <div className="text-sm text-slate-500">
                  {getStatDescription(
                    "photos_captured",
                    "Beautiful moments frozen in time",
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Miles Traveled - Hidden by default */}
          <div
            className={`group relative transition-all duration-500 ${isStatsExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">⚡</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("miles_traveled", 342)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Miles Traveled
                </div>
                <div className="text-sm text-slate-500">
                  Across Scotland's stunning terrain
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Munros Climbed - Hidden by default */}
          <div
            className={`group relative transition-all duration-500 ${isStatsExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-lime-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-lime-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-lime-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3l7 7-7 7M19 3l-7 7 7 7"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">⛰️</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-lime-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("munros_climbed", 3)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Munros Climbed
                </div>
                <div className="text-sm text-slate-500">
                  Scottish peaks conquered together
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adventures This Year - Hidden by default */}
          <div
            className={`group relative transition-all duration-500 ${isStatsExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">����️</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  {statsLoading
                    ? "..."
                    : getStatValue("adventures_this_year", 12)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Adventures This Year
                </div>
                <div className="text-sm text-slate-500">
                  Family expeditions & discoveries
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wildlife Spotted - Hidden by default */}
          <div
            className={`group relative transition-all duration-500 ${isStatsExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">🦌</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("wildlife_spotted", 23)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Wildlife Spotted
                </div>
                <div className="text-sm text-slate-500">
                  Amazing creatures encountered
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Castles Visited - Hidden by default */}
          <div
            className={`group relative transition-all duration-500 ${isStatsExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 21v-4m0 0V9a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">🏰</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("castles_explored", 4)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Castles Explored
                </div>
                <div className="text-sm text-slate-500">
                  Historic fortresses & legends
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Days - Hidden by default */}
          <div
            className={`group relative transition-all duration-500 ${isStatsExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <Card className="relative text-center bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              <CardContent className="p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">☁️</span>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  {statsLoading ? "..." : getStatValue("weather_adventures", 8)}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">
                  Weather Adventures
                </div>
                <div className="text-sm text-slate-500">
                  Sunshine, rain & Scottish mists
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="group px-6 py-3 border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 rounded-full"
          >
            <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700 mr-2">
              {isStatsExpanded ? "Show Less" : "View All Adventure Stats"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 group-hover:text-purple-600 transition-transform duration-300 ${
                isStatsExpanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </div>
      </section>

      {/* Adventure Discovery */}
      <section className="mb-20">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-purple-200/50 shadow-lg">
              <span className="text-2xl">🎲</span>
              <span className="text-sm font-medium text-purple-700">
                Adventure Discovery
              </span>
              <span className="text-2xl">🗺️</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Discover Your Next Adventure
              </span>
            </h2>

            <p className="text-slate-600 max-w-2xl mx-auto mb-8">
              Let us inspire your next Scottish family adventure! Discover
              hidden gems, try new experiences, and create more magical memories
              across Scotland.
            </p>
          </div>

          {/* Discovery Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Random Adventure Generator */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-200/60 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-3xl">🎲</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-purple-800">
                  Surprise Me!
                </h3>
                <p className="text-sm text-purple-600 mb-4">
                  Get a random Scottish adventure suggestion near you
                </p>
                <Button
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={() => showDiscoveryModal("random")}
                >
                  Roll the Dice!
                </Button>
              </CardContent>
            </Card>

            {/* Adventure Roulette */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-pink-50 to-rose-100 border-2 border-pink-200/60 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-3xl">🎪</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-pink-800">
                  Adventure Roulette
                </h3>
                <p className="text-sm text-pink-600 mb-4">
                  Spin the wheel for your next adventure type
                </p>
                <Button
                  size="sm"
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={() => setIsSpinningWheelOpen(true)}
                >
                  Spin the Wheel
                </Button>
              </CardContent>
            </Card>

            {/* Hidden Gems Finder */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200/60 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-3xl">💎</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-emerald-800">
                  Hidden Gems
                </h3>
                <p className="text-sm text-emerald-600 mb-4">
                  Find lesser-known Scottish treasures off the beaten path
                </p>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => showDiscoveryModal("gems")}
                >
                  Find Gems
                </Button>
              </CardContent>
            </Card>

            {/* Family Vote */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200/60 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-3xl">🗳️</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-orange-800">
                  Family Vote
                </h3>
                <p className="text-sm text-orange-600 mb-4">
                  Let the family choose between adventure options
                </p>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => showDiscoveryModal("vote")}
                >
                  Start Vote
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Fun Discovery Stats */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-indigo-50/50 rounded-2xl p-6 border border-purple-200/30">
              <h4 className="font-semibold text-purple-800 mb-3">
                🧭 Adventure Discovery Stats
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/60 rounded-xl p-4">
                  <span className="text-2xl mb-2 block">🎯</span>
                  <div className="font-bold text-purple-700">152</div>
                  <div className="text-purple-600">
                    Scottish castles to explore
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <span className="text-2xl mb-2 block">⛰️</span>
                  <div className="font-bold text-purple-700">282</div>
                  <div className="text-purple-600">Munros waiting for you</div>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <span className="text-2xl mb-2 block">🌊</span>
                  <div className="font-bold text-purple-700">31,000+</div>
                  <div className="text-purple-600">Lochs across Scotland</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Adventures */}
      <section className="mb-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-emerald-200/50 shadow-lg">
            <Calendar className="h-6 w-6 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Latest Family Adventures
            </span>
            <MapPin className="h-6 w-6 text-emerald-600" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Recent Adventures
            </span>
          </h2>

          <p className="text-slate-600 max-w-2xl mx-auto mb-8">
            Our latest Scottish explorations, from mountain peaks to castle
            visits. Each adventure adds to our family's growing collection of
            memories.
          </p>

          <Button
            asChild
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link to="/journal">
              <Calendar className="mr-2 h-4 w-4" />
              View All Adventures
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Adventures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentAdventures.map((adventure, index) => (
            <div key={index} className="group relative">
              {/* Glow Effect */}
              <div
                className={`absolute inset-0 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity ${
                  index === 0
                    ? "bg-gradient-to-r from-emerald-400 to-blue-500"
                    : index === 1
                      ? "bg-gradient-to-r from-blue-400 to-purple-500"
                      : "bg-gradient-to-r from-purple-400 to-pink-500"
                }`}
              ></div>

              <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden">
                {/* Top Border */}
                <div
                  className={`absolute top-0 left-0 w-full h-1 ${
                    index === 0
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                      : index === 1
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}
                ></div>

                <CardContent className="p-0">
                  {/* Image Section */}
                  <div className="relative">
                    <img
                      src={adventure.featured_image}
                      alt={adventure.title}
                      className="w-full h-56 object-cover"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Adventure Badge */}
                    <div className="absolute top-4 right-4">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${
                          index === 0
                            ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                            : index === 1
                              ? "bg-gradient-to-r from-blue-500 to-purple-500"
                              : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                      >
                        Adventure #{recentAdventures.length - index}
                      </div>
                    </div>

                    {/* Title & Location Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-bold text-xl text-white mb-2 group-hover:text-emerald-200 transition-colors">
                        {adventure.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{adventure.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    {/* Date */}
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">
                        {adventure.formatted_date}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {adventure.tags &&
                        adventure.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className={`px-3 py-1 text-xs font-medium rounded-full border-2 ${
                              index === 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : index === 1
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      {/* Show adventure type badge */}
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border-2 ${
                          index === 0
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : index === 1
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-purple-100 text-purple-800 border-purple-300"
                        }`}
                      >
                        {adventure.adventure_type}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={`w-full border-2 transition-all duration-300 ${
                        index === 0
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          : index === 1
                            ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                            : "border-purple-300 text-purple-700 hover:bg-purple-50"
                      }`}
                    >
                      <Link to="/journal" className="flex items-center gap-2">
                        <span>Read Full Story</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Call to Add New Adventure */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-50 to-emerald-50 border-2 border-slate-200/50 rounded-full shadow-lg">
            <Heart className="h-5 w-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              Ready for your next Scottish adventure? Start planning today!
            </span>
          </div>
        </div>
      </section>

      {/* Contact & YouTube Section */}
      <section className="mt-20 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Us - Left Side */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-emerald-50 rounded-2xl p-8 border-2 border-slate-200/60 shadow-lg h-full">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Get in Touch
                </span>
              </h2>

              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Have a question about our Scottish adventures or want to share
                your own family travel stories? We'd love to hear from you!
              </p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Email us at
                  </p>
                  <a
                    href="mailto:contact@aweeadventure.co.uk"
                    className="text-xl font-bold text-blue-600 hover:text-emerald-600 transition-colors duration-300"
                  >
                    contact@aweeadventure.co.uk
                  </a>
                </div>
              </div>

              <div className="flex justify-center gap-2 opacity-60">
                <span className="text-blue-600">🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
                <span className="text-emerald-600">💌</span>
                <span className="text-blue-600">🏔️</span>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                We'll get back to you faster than a Highland wind! 🌬️
              </p>
            </div>
          </div>

          {/* YouTube Section - Right Side */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 rounded-2xl p-8 border-2 border-red-200/60 shadow-lg h-full">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Watch Our Adventures
                </span>
              </h2>

              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Join us on YouTube as we explore Scotland's breathtaking
                landscapes, share travel tips, and capture unforgettable family
                moments!
              </p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Follow us on
                  </p>
                  <a
                    href="https://www.youtube.com/@AWeeAdventures"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold text-red-600 hover:text-pink-600 transition-colors duration-300"
                  >
                    A Wee Adventures
                  </a>
                </div>
              </div>

              <div className="flex justify-center gap-2 opacity-60">
                <span className="text-red-600">📺</span>
                <span className="text-pink-600">🎥</span>
                <span className="text-red-600">🏴󠁧󠁢���󠁣����󠁿</span>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                Subscribe for weekly Scottish adventure vlogs! ����
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Adventure Discovery Modal */}
      <Dialog
        open={discoveryModal.isOpen}
        onOpenChange={(open) =>
          setDiscoveryModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4">
              <span className="text-4xl mr-3">{discoveryModal.emoji}</span>
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                {discoveryModal.title}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Main Suggestion */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200/50">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  {discoveryModal.type} Suggestion
                </h3>
                <p className="text-purple-700 font-medium">
                  {discoveryModal.suggestion}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <span className="text-xl mr-2">📖</span>
                About This Adventure
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {discoveryModal.description}
              </p>
            </div>

            {/* Tips */}
            {discoveryModal.tips.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-4 flex items-center">
                  <span className="text-xl mr-2">💡</span>
                  Helpful Tips for Your Adventure
                </h4>
                <ul className="space-y-2">
                  {discoveryModal.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-emerald-700"
                    >
                      <span className="text-emerald-500 font-bold mt-0.5">
                        •
                      </span>
                      <span className="text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setDiscoveryModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => {
                  setDiscoveryModal((prev) => ({ ...prev, isOpen: false }));
                  // You could add navigation to journal here in the future
                  window.location.href = "/journal";
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Plan This Adventure
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spinning Wheel Modal */}
      <SpinningWheel
        isOpen={isSpinningWheelOpen}
        onClose={() => setIsSpinningWheelOpen(false)}
        onResult={(adventure) => {
          // Show discovery modal with the wheel result
          setDiscoveryModal({
            isOpen: true,
            type: "Adventure Type",
            title: adventure.type,
            suggestion: `Explore ${adventure.type} options: ${adventure.suggestions.join(", ")}`,
            description: adventure.description,
            tips: adventure.tips,
            emoji: adventure.emoji,
          });
        }}
      />
    </div>
  );
}
