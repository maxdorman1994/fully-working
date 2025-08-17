import { useState } from "react";
import {
  Mountain,
  Camera,
  Backpack,
  CloudRain,
  Heart,
  Car,
  Dog,
  Baby,
  MapPin,
  Compass,
  Star,
  Lightbulb,
  Shield,
  Wallet,
  Home,
  Utensils,
  Coffee,
  AlertTriangle,
  CheckCircle,
  Info,
  BookOpen,
  Navigation,
  Sun,
  Snowflake,
  Wind,
  Umbrella,
  Waves,
  Anchor,
  Ship,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HintsTips() {
  const [activeCategory, setActiveCategory] = useState("safety");

  const categories = [
    {
      id: "safety",
      label: "Safety & Planning",
      icon: Shield,
      color: "from-red-500 to-orange-500",
    },
    {
      id: "packing",
      label: "Packing Essentials",
      icon: Backpack,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "weather",
      label: "Weather & Seasons",
      icon: CloudRain,
      color: "from-slate-500 to-blue-500",
    },
    {
      id: "tides",
      label: "Tides & Coast",
      icon: Waves,
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "family",
      label: "Family Tips",
      icon: Heart,
      color: "from-pink-500 to-purple-500",
    },
    {
      id: "accommodation",
      label: "Places to Stay",
      icon: Home,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "photography",
      label: "Photography",
      icon: Camera,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "budget",
      label: "Budget Tips",
      icon: Wallet,
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "local",
      label: "Local Secrets",
      icon: MapPin,
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const tips = {
    safety: [
      {
        title: "Essential Safety Gear",
        icon: Shield,
        level: "Critical",
        content: [
          "Always carry a first aid kit with blister plasters and pain relief",
          "Pack emergency whistle - 6 sharp blasts is the international distress signal",
          "Bring head torch with spare batteries, even for day walks",
          "Carry emergency shelter or space blanket",
          "Download offline maps on your phone as backup to paper maps",
        ],
      },
      {
        title: "Weather Awareness",
        icon: AlertTriangle,
        level: "Important",
        content: [
          "Check mountain weather forecast at mwis.org.uk before setting out",
          "Turn back if conditions deteriorate - mountains will still be there tomorrow",
          "Learn to recognize signs of hypothermia and heat exhaustion",
          "Allow extra time in winter - daylight hours are severely limited",
          "Inform someone of your planned route and expected return time",
        ],
      },
      {
        title: "Navigation Essentials",
        icon: Compass,
        level: "Critical",
        content: [
          "Always carry map and compass, and know how to use them",
          "Practice navigation skills in good weather before challenging conditions",
          "Use handrails like rivers and ridges to guide your route",
          "Count paces to estimate distance traveled",
          "Consider GPS watch or device as backup, not primary navigation",
        ],
      },
    ],
    packing: [
      {
        title: "Layer System Clothing",
        icon: Backpack,
        level: "Essential",
        content: [
          "Base layer: Merino wool or synthetic materials (avoid cotton)",
          "Insulating layer: Fleece or down jacket for warmth",
          "Shell layer: Waterproof and breathable jacket and trousers",
          "Pack spare warm layer and extra socks in waterproof bag",
          "Gaiters prevent stones entering boots and keep legs dry",
        ],
      },
      {
        title: "Footwear & Comfort",
        icon: Mountain,
        level: "Critical",
        content: [
          "Waterproof hiking boots with good ankle support",
          "Break in new boots gradually before your trip",
          "Merino wool socks with liner socks to prevent blisters",
          "Consider microspikes or crampons for winter conditions",
          "Pack blister plasters and spare socks",
        ],
      },
      {
        title: "Food & Hydration",
        icon: Utensils,
        level: "Important",
        content: [
          "Carry more water than you think you need (2-3 liters per person)",
          "Pack high-energy snacks: nuts, dried fruit, energy bars",
          "Hot drink in thermos flask for morale in cold conditions",
          "Emergency food: chocolate or energy gel that won't freeze",
          "Water purification tablets if refilling from streams",
        ],
      },
    ],
    weather: [
      {
        title: "Scottish Weather Patterns",
        icon: CloudRain,
        level: "Knowledge",
        content: [
          "Weather can change dramatically within hours, especially in mountains",
          "West coast generally wetter, east coast often clearer but windier",
          "Midges are worst in still, warm, humid conditions (May-September)",
          '"Four seasons in one day" is not a cliché - it\'s reality',
          "Even summer days can be cold and wet - always pack warm layers",
        ],
      },
      {
        title: "Best Times to Visit",
        icon: Sun,
        level: "Planning",
        content: [
          "May-September: Warmest weather, but busiest and midge season",
          "April & October: Fewer crowds, changeable weather, shorter days",
          "November-March: Winter conditions, short days, but stunning snow scenes",
          "December-February: Very short daylight (8 hours max), winter gear essential",
          "Check sunrise/sunset times and plan accordingly",
        ],
      },
      {
        title: "Seasonal Considerations",
        icon: Snowflake,
        level: "Planning",
        content: [
          "Spring: Wildflowers bloom, waterfalls at full flow, unstable weather",
          "Summer: Long days (19+ hours daylight), warmest temperatures",
          "Autumn: Beautiful colors, clearer air, first snow on peaks",
          "Winter: Snow and ice, specialist equipment needed, magical landscapes",
          "Shoulder seasons offer best value accommodation and fewer crowds",
        ],
      },
    ],
    family: [
      {
        title: "Hiking with Children",
        icon: Baby,
        level: "Family",
        content: [
          "Start with shorter, easier walks and build up gradually",
          "Bring plenty of snacks and water - more than for adults",
          "Make it fun: nature treasure hunts, geocaching, wildlife spotting",
          "Pack extra warm clothes and waterproofs for children",
          "Allow twice as much time as you would for adults-only walks",
        ],
      },
      {
        title: "Pet-Friendly Adventures",
        icon: Dog,
        level: "Pets",
        content: [
          "Check access restrictions - some areas prohibit dogs during lambing",
          "Bring collapsible water bowl and extra water for your dog",
          "Paw protectors for rough terrain or hot surfaces",
          "Keep dogs on leads near livestock and wildlife",
          "Check for dog-friendly accommodation well in advance",
        ],
      },
      {
        title: "Entertainment & Motivation",
        icon: Star,
        level: "Fun",
        content: [
          "Download nature apps for plant and bird identification",
          "Pack a magnifying glass for examining interesting finds",
          "Bring small rewards: favorite snacks or small toys",
          "Take breaks at interesting features: waterfalls, viewpoints, ruins",
          "Let children lead sometimes - follow their curiosity",
        ],
      },
    ],
    accommodation: [
      {
        title: "Family-Friendly Options",
        icon: Home,
        level: "Planning",
        content: [
          "Self-catering cottages: More space, kitchen facilities, cost-effective",
          "Youth hostels: Budget-friendly, often in stunning locations",
          "B&Bs: Personal touch, local knowledge, hearty breakfasts",
          "Glamping: Outdoor experience with creature comforts",
          "Book early for school holidays and peak summer months",
        ],
      },
      {
        title: "What to Look For",
        icon: CheckCircle,
        level: "Checklist",
        content: [
          "Drying facilities for wet weather gear",
          "Secure storage for bikes and outdoor equipment",
          "Family rooms or interconnecting rooms",
          "Pet-friendly policies if traveling with animals",
          "Proximity to shops, restaurants, and attractions",
        ],
      },
      {
        title: "Hidden Gems",
        icon: MapPin,
        level: "Local",
        content: [
          "Bothy accommodation: Free mountain shelters for experienced hikers",
          "Farm stays: Great for children, often include activities",
          "University accommodation in summer: Budget option in cities",
          "National Trust and Historic Scotland properties often have unique stays",
          "Wild camping is legal in Scotland with right to roam",
        ],
      },
    ],
    photography: [
      {
        title: "Landscape Photography",
        icon: Camera,
        level: "Creative",
        content: [
          "Golden hour: 1 hour after sunrise and before sunset for best light",
          "Use foreground elements to add depth to your compositions",
          "Polarizing filter reduces reflections and enhances sky contrast",
          "Protect your camera from Scottish weather with rain covers",
          "Tripod essential for low light and long exposure shots",
        ],
      },
      {
        title: "Family Photos Tips",
        icon: Heart,
        level: "Memories",
        content: [
          "Capture candid moments, not just posed shots",
          "Include scale - people in landscape shots show mountain size",
          "Take photos throughout the day, not just at the summit",
          "Group shots at iconic locations for future memories",
          "Don't forget to be in some photos yourself!",
        ],
      },
      {
        title: "Technical Tips",
        icon: Info,
        level: "Skills",
        content: [
          "Shoot in RAW format for better post-processing flexibility",
          "Bring extra batteries - cold weather drains them quickly",
          "Lens cloth for cleaning water droplets from lens",
          "Consider smartphone with good camera as backup",
          "Learn basic composition rules: rule of thirds, leading lines",
        ],
      },
    ],
    budget: [
      {
        title: "Money-Saving Tips",
        icon: Wallet,
        level: "Budget",
        content: [
          "Shop at local supermarkets rather than tourist shops",
          "Many of Scotland's best attractions (mountains, beaches) are free",
          "National Trust and Historic Scotland memberships pay for themselves",
          "Travel in shoulder seasons for lower accommodation costs",
          "Pack lunches for day trips instead of buying expensive mountain café food",
        ],
      },
      {
        title: "Free Activities",
        icon: Star,
        level: "Free",
        content: [
          "Beach combing and rock pooling on Scotland's incredible coastline",
          "Forest walks in Forestry Commission lands",
          "Free museums and galleries in major cities",
          "Wildlife watching: seals, dolphins, eagles, deer",
          "Photography walks in picturesque villages",
        ],
      },
      {
        title: "Transport Savings",
        icon: Car,
        level: "Travel",
        content: [
          "Fuel up before remote areas where petrol is more expensive",
          "Consider train travel for longer distances - scenic and relaxing",
          "Book ferries in advance for better prices",
          "Carpool with other families if traveling together",
          "Some attractions offer discounts for public transport users",
        ],
      },
    ],
    tides: [
      {
        title: "Understanding Scottish Tides",
        icon: Waves,
        level: "Essential",
        content: [
          "Scottish tides range from 1-6 meters - always check before coastal activities",
          "Spring tides (new/full moon) have larger ranges, neap tides are smaller",
          "High tide times shift by roughly 50 minutes each day",
          "West coast tides are generally 1-2 hours later than east coast",
          "Tidal bores can occur in sea lochs - water rushes in rapidly",
        ],
      },
      {
        title: "Tidal Resources & Apps",
        icon: Anchor,
        level: "Planning",
        content: [
          "BBC Weather app includes tidal times for major Scottish ports",
          "Tides4Fishing.com - detailed tidal charts for specific locations",
          "UK Hydrographic Office app - official Admiralty tide data",
          "Local harbour masters provide printed tide tables",
          "Many coastal cafés and shops display daily tide times",
        ],
      },
      {
        title: "Coastal Safety & Activities",
        icon: Ship,
        level: "Safety",
        content: [
          "Never turn your back on the sea - waves can be unpredictable",
          "Check tide times before rock pooling, beach walks, or coastal hikes",
          "Low tide is best for exploring rock pools and sea caves",
          "Plan ferry crossings around tidal schedules for shorter journeys",
          "Some beaches and causeways are only accessible at low tide",
        ],
      },
      {
        title: "Island & Ferry Planning",
        icon: Navigation,
        level: "Travel",
        content: [
          "CalMac ferries: book vehicles in advance, especially summer weekends",
          "Some smaller islands have tide-dependent landing schedules",
          "St. Kilda and other remote islands require calm seas for landing",
          "Orkney and Shetland ferries can be affected by high winds and tides",
          "Check weather and sea conditions before island day trips",
        ],
      },
      {
        title: "Best Coastal Times",
        icon: Sun,
        level: "Timing",
        content: [
          "Two hours either side of low tide: best for rock pooling and exploring",
          "High tide + 1 hour: dramatic waves and coastal photography",
          "Early morning low tides: fewer crowds, better wildlife spotting",
          "Spring low tides expose areas usually underwater - great for exploration",
          "Sunset at high tide: spectacular views from coastal paths",
        ],
      },
    ],
    local: [
      {
        title: "Insider Knowledge",
        icon: Lightbulb,
        level: "Secret",
        content: [
          "Visit Tourist Information Centres for local walking route leaflets",
          "Chat to locals in pubs and cafés for hidden gem recommendations",
          "Follow local Facebook groups and hiking forums",
          "Ordnance Survey maps show details Google Maps misses",
          "Local weather can be very different from national forecasts",
        ],
      },
      {
        title: "Cultural Tips",
        icon: BookOpen,
        level: "Culture",
        content: [
          "Learn a few words of Gaelic - locals appreciate the effort",
          "Understand right to roam laws - access with responsibility",
          "Support local businesses, especially in remote communities",
          "Respect wildlife and farming activities",
          "Always close gates and follow the Scottish Outdoor Access Code",
        ],
      },
      {
        title: "Seasonal Local Events",
        icon: Coffee,
        level: "Events",
        content: [
          "Highland Games throughout summer - authentic Scottish culture",
          "Farmers markets for local produce and crafts",
          "Music festivals and ceilidhs for traditional entertainment",
          "Whisky festivals for adults (many distilleries offer tours)",
          "Christmas markets and winter festivals in cities",
        ],
      },
    ],
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "Essential":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Important":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Planning":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Knowledge":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Family":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "Pets":
        return "bg-green-100 text-green-800 border-green-200";
      case "Fun":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Creative":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "Memories":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Skills":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Budget":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Free":
        return "bg-lime-100 text-lime-800 border-lime-200";
      case "Travel":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "Secret":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Culture":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "Events":
        return "bg-stone-100 text-stone-800 border-stone-200";
      case "Timing":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Checklist":
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
      case "Local":
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-green-200/50 shadow-lg">
            <Lightbulb className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Scottish Adventure Wisdom
            </span>
            <Mountain className="h-6 w-6 text-green-600" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              Hints & Tips
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Our collected wisdom from exploring Scotland with family - practical
            advice for your own adventures
          </p>
        </div>

        {/* Category Navigation */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveCategory(category.id)}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    isActive
                      ? `bg-gradient-to-br ${category.color} text-white border-0 shadow-lg`
                      : "bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {category.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tips Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {tips[activeCategory].map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Card
                key={index}
                className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/95 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-800 mb-2">
                        {tip.title}
                      </CardTitle>
                      <Badge
                        className={`text-xs border-2 ${getLevelColor(tip.level)}`}
                      >
                        {tip.level}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tip.content.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Emergency Information */}
        <Card className="mt-16 border-0 shadow-xl bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Emergency Information
                </h2>
                <p className="text-slate-600">
                  Important numbers and procedures for Scottish adventures
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 rounded-xl p-4">
                <h3 className="font-bold text-red-600 mb-2">
                  Emergency Services
                </h3>
                <p className="text-2xl font-bold mb-2">999 or 112</p>
                <p className="text-sm text-slate-600">
                  Police, Fire, Ambulance, Coast Guard, Mountain Rescue
                </p>
              </div>

              <div className="bg-white/80 rounded-xl p-4">
                <h3 className="font-bold text-orange-600 mb-2">
                  Mountain Rescue
                </h3>
                <p className="text-lg font-bold mb-2">
                  Ask for "Police" then "Mountain Rescue"
                </p>
                <p className="text-sm text-slate-600">
                  They coordinate all mountain rescues in Scotland
                </p>
              </div>

              <div className="bg-white/80 rounded-xl p-4">
                <h3 className="font-bold text-yellow-600 mb-2">What3Words</h3>
                <p className="text-lg font-bold mb-2">Download the app</p>
                <p className="text-sm text-slate-600">
                  Gives emergency services precise location anywhere
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card className="mt-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Quick Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-2">
                  Weather Resources
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>
                    •{" "}
                    <a
                      href="https://mwis.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      mwis.org.uk
                    </a>{" "}
                    - Mountain weather
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://metoffice.gov.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      metoffice.gov.uk
                    </a>{" "}
                    - General forecast
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://windy.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      windy.com
                    </a>{" "}
                    - Visual weather maps
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">Navigation</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>
                    •{" "}
                    <a
                      href="https://shop.ordnancesurvey.co.uk/apps/os-maps/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      OS Maps app
                    </a>{" "}
                    - Official mapping
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://www.viewranger.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      ViewRanger
                    </a>{" "}
                    - Offline maps
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://what3words.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      what3words
                    </a>{" "}
                    - Emergency location
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">Accommodation</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>
                    •{" "}
                    <a
                      href="https://booking.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      booking.com
                    </a>{" "}
                    - Hotels & B&Bs
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://syha.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      syha.org.uk
                    </a>{" "}
                    - Youth hostels
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://airbnb.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      airbnb.com
                    </a>{" "}
                    - Self-catering
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">
                  Travel & Tides
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>
                    •{" "}
                    <a
                      href="https://calmac.co.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      calmac.co.uk
                    </a>{" "}
                    - West coast ferries
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://tidetimes.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      tidetimes.org.uk
                    </a>{" "}
                    - UK tide times
                  </li>
                  <li>
                    •{" "}
                    <a
                      href="https://bbc.co.uk/weather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      bbc.co.uk/weather
                    </a>{" "}
                    - Includes tides
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
