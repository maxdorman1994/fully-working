import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, RotateCcw } from "lucide-react";

interface SpinningWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: AdventureType) => void;
}

interface AdventureType {
  type: string;
  description: string;
  suggestions: string[];
  tips: string[];
  emoji: string;
  color: string;
}

const adventureTypes: AdventureType[] = [
  {
    type: "Castle Adventure",
    description:
      "Scotland has over 1,500 castles, each with unique stories and stunning architecture.",
    suggestions: [
      "Edinburgh Castle",
      "Stirling Castle",
      "Urquhart Castle",
      "Caerlaverock Castle",
    ],
    tips: [
      "Audio guides bring history to life",
      "Check for special events",
      "Photography is usually allowed",
    ],
    emoji: "🏰",
    color: "#8B5CF6", // purple
  },
  {
    type: "Mountain Hiking",
    description:
      "With 282 Munros and countless smaller peaks, Scotland is a hiker's paradise.",
    suggestions: ["Ben Nevis", "Ben Lomond", "Arthur's Seat", "The Cobbler"],
    tips: [
      "Check weather conditions",
      "Pack layers and waterproofs",
      "Start with easier peaks",
    ],
    emoji: "🏔️",
    color: "#059669", // emerald
  },
  {
    type: "Coastal Exploration",
    description:
      "Scotland's coastline stretches for over 6,000 miles with dramatic cliffs and pristine beaches.",
    suggestions: ["Isle of Skye", "St. Andrews", "Oban", "John o' Groats"],
    tips: [
      "Check tide times",
      "Bring binoculars for wildlife",
      "Beach safety is important",
    ],
    emoji: "🌊",
    color: "#0EA5E9", // sky blue
  },
  {
    type: "Scenic Drive",
    description:
      "Scotland's scenic routes offer breathtaking landscapes from the comfort of your car.",
    suggestions: [
      "North Coast 500",
      "Trossachs Loop",
      "Borders Historic Route",
      "Argyll Coastal Route",
    ],
    tips: [
      "Plan regular stops",
      "Book accommodation in advance",
      "Keep fuel tank topped up",
    ],
    emoji: "🚗",
    color: "#F59E0B", // amber
  },
  {
    type: "Wildlife Spotting",
    description:
      "Scotland's diverse landscapes support incredible wildlife from red deer to puffins.",
    suggestions: [
      "Isle of Mull",
      "Cairngorms National Park",
      "Loch Ness",
      "Shetland Islands",
    ],
    tips: [
      "Early morning is best",
      "Move quietly and be patient",
      "Respect wildlife habitats",
    ],
    emoji: "🦌",
    color: "#DC2626", // red
  },
  {
    type: "Historical Site",
    description:
      "From ancient stone circles to battlefields, Scotland's history spans thousands of years.",
    suggestions: [
      "Culloden Battlefield",
      "Skara Brae",
      "Iona Abbey",
      "Melrose Abbey",
    ],
    tips: [
      "Visitor centers provide context",
      "Many sites have family activities",
      "Guided tours offer insights",
    ],
    emoji: "🏛️",
    color: "#7C3AED", // violet
  },
];

export default function SpinningWheel({
  isOpen,
  onClose,
  onResult,
}: SpinningWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedAdventure, setSelectedAdventure] =
    useState<AdventureType | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const sectorAngle = 360 / adventureTypes.length;

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedAdventure(null);

    // Generate random rotation (multiple full spins + random angle)
    const spins = 3 + Math.random() * 3; // 3-6 full rotations
    const finalAngle = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + finalAngle;

    setRotation(totalRotation);

    // Calculate which adventure type we landed on
    // Normalize the angle and account for the wheel starting position
    const normalizedAngle =
      (360 - (totalRotation % 360) + sectorAngle / 2) % 360;
    const sectorIndex = Math.floor(normalizedAngle / sectorAngle);
    const selectedType = adventureTypes[sectorIndex];

    // Show result after animation completes
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedAdventure(selectedType);
      onResult(selectedType);
    }, 3000);
  };

  const resetWheel = () => {
    setRotation(0);
    setSelectedAdventure(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              🎪 Adventure Roulette Wheel
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Spinning Wheel */}
          <div className="flex flex-col items-center">
            <div className="relative w-80 h-80 mx-auto">
              {/* Wheel Base */}
              <div className="absolute inset-0 rounded-full border-8 border-gray-300 shadow-2xl bg-white"></div>

              {/* Wheel Sectors */}
              <div
                ref={wheelRef}
                className="absolute inset-2 rounded-full overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? "transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    : "none",
                }}
              >
                {/* Create SVG sectors for better control */}
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {adventureTypes.map((adventure, index) => {
                    const startAngle =
                      (index * sectorAngle - 90) * (Math.PI / 180); // -90 to start from top
                    const endAngle =
                      ((index + 1) * sectorAngle - 90) * (Math.PI / 180);
                    const largeArcFlag = sectorAngle > 180 ? 1 : 0;

                    const x1 = 100 + 90 * Math.cos(startAngle);
                    const y1 = 100 + 90 * Math.sin(startAngle);
                    const x2 = 100 + 90 * Math.cos(endAngle);
                    const y2 = 100 + 90 * Math.sin(endAngle);

                    const pathData = [
                      `M 100 100`,
                      `L ${x1} ${y1}`,
                      `A 90 90 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      `Z`,
                    ].join(" ");

                    return (
                      <path
                        key={adventure.type}
                        d={pathData}
                        fill={adventure.color}
                        opacity="0.9"
                      />
                    );
                  })}
                </svg>

                {/* Text labels positioned over the sectors */}
                {adventureTypes.map((adventure, index) => {
                  const angle =
                    (index * sectorAngle + sectorAngle / 2 - 90) *
                    (Math.PI / 180);
                  const radius = 65; // Distance from center
                  const x = 50 + (radius / 100) * 50 * Math.cos(angle);
                  const y = 50 + (radius / 100) * 50 * Math.sin(angle);

                  return (
                    <div
                      key={`text-${adventure.type}`}
                      className="absolute text-white font-bold text-center flex flex-col items-center justify-center pointer-events-none"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%)`,
                        width: "50px",
                        height: "50px",
                      }}
                    >
                      <div className="text-xl mb-1 drop-shadow-lg">
                        {adventure.emoji}
                      </div>
                      <div className="text-xs font-bold leading-tight text-center drop-shadow-lg">
                        {adventure.type.split(" ").map((word, i) => (
                          <div key={i} className="leading-none">
                            {word}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pointer */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-red-600"></div>
              </div>

              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={spin}
                disabled={isSpinning}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-8 py-3 text-lg font-bold shadow-lg"
              >
                {isSpinning ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-xl">🎲</span>
                    Spin the Wheel!
                  </>
                )}
              </Button>

              <Button
                onClick={resetWheel}
                variant="outline"
                size="lg"
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Result Display */}
          {selectedAdventure && (
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200 animate-in fade-in-50 duration-500">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{selectedAdventure.emoji}</div>
                <h3 className="text-2xl font-bold text-pink-800 mb-2">
                  {selectedAdventure.type}
                </h3>
                <p className="text-pink-600 text-sm leading-relaxed">
                  {selectedAdventure.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-pink-700 mb-2">
                    Suggested Places:
                  </h4>
                  <ul className="text-sm text-pink-600 space-y-1">
                    {selectedAdventure.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mr-2">📍</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-pink-700 mb-2">
                    Adventure Tips:
                  </h4>
                  <ul className="text-sm text-pink-600 space-y-1">
                    {selectedAdventure.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 mt-0.5">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-center mt-4">
                <Button
                  onClick={spin}
                  variant="outline"
                  className="border-pink-300 text-pink-600 hover:bg-pink-100"
                >
                  Spin Again!
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
