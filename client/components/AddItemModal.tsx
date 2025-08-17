import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Castle, Waves, Gem } from "lucide-react";
import {
  createCustomCastle,
  createCustomLoch,
  createCustomHiddenGem,
  type CastleData,
  type LochData,
  type HiddenGemData,
} from "@/lib/castlesLochsService";

interface AddItemModalProps {
  type: "castle" | "loch" | "gem";
  onItemCreated: () => void;
}

export default function AddItemModal({
  type,
  onItemCreated,
}: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const resetForm = () => {
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === "castle") {
        await createCustomCastle({
          name: formData.name || "",
          region: formData.region || "",
          type: formData.type || "Historic Fortress",
          built_century: formData.built_century || "Unknown",
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
          description: formData.description || "",
          visiting_info: formData.visiting_info || "",
          best_seasons: formData.best_seasons
            ?.split(",")
            .map((s: string) => s.trim()) || ["All year"],
          admission_fee: formData.admission_fee || "Free",
          managed_by: formData.managed_by || "Private",
          accessibility: formData.accessibility || "Unknown",
          rank: 999, // Custom items get high rank numbers
        });
      } else if (type === "loch") {
        await createCustomLoch({
          name: formData.name || "",
          region: formData.region || "",
          type: formData.type || "Freshwater Loch",
          length_km: parseFloat(formData.length_km) || 0,
          max_depth_m: parseFloat(formData.max_depth_m) || 0,
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
          description: formData.description || "",
          activities: formData.activities
            ?.split(",")
            .map((s: string) => s.trim()) || ["Photography"],
          best_seasons: formData.best_seasons
            ?.split(",")
            .map((s: string) => s.trim()) || ["All year"],
          famous_for: formData.famous_for || "",
          nearest_town: formData.nearest_town || "",
          rank: 999,
        });
      } else {
        await createCustomHiddenGem({
          name: formData.name || "",
          region: formData.region || "",
          type: formData.type || "Natural Wonder",
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
          description: formData.description || "",
          how_to_find: formData.how_to_find || "",
          best_seasons: formData.best_seasons
            ?.split(",")
            .map((s: string) => s.trim()) || ["All year"],
          difficulty_level: formData.difficulty_level || "Easy",
          requires_hiking: formData.requires_hiking === "true",
          nearest_town: formData.nearest_town || "",
          special_features: formData.special_features || "",
          photography_tips: formData.photography_tips || "",
          rank: 999,
        });
      }

      setIsOpen(false);
      resetForm();
      onItemCreated();
    } catch (error) {
      console.error(`Failed to create ${type}:`, error);
      alert(`Failed to create ${type}. Please try again.`);
    }

    setIsLoading(false);
  };

  const getIcon = () => {
    switch (type) {
      case "castle":
        return <Castle className="h-4 w-4" />;
      case "loch":
        return <Waves className="h-4 w-4" />;
      case "gem":
        return <Gem className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "castle":
        return "Add Custom Castle";
      case "loch":
        return "Add Custom Loch";
      case "gem":
        return "Add Custom Hidden Gem";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
        >
          <Plus className="h-4 w-4" />
          {getIcon()}
          Add {type === "gem" ? "Hidden Gem" : type}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Add your own custom {type === "gem" ? "hidden gem" : type} to the
            collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                required
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={`${type === "gem" ? "Hidden gem" : type} name`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Region *</label>
              <Input
                required
                value={formData.region || ""}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="e.g., Highland, Edinburgh"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {type === "castle" && (
                    <>
                      <SelectItem value="Royal Castle">Royal Castle</SelectItem>
                      <SelectItem value="Historic Fortress">
                        Historic Fortress
                      </SelectItem>
                      <SelectItem value="Clan Castle">Clan Castle</SelectItem>
                      <SelectItem value="Ruin">Ruin</SelectItem>
                      <SelectItem value="Palace">Palace</SelectItem>
                    </>
                  )}
                  {type === "loch" && (
                    <>
                      <SelectItem value="Freshwater Loch">
                        Freshwater Loch
                      </SelectItem>
                      <SelectItem value="Sea Loch">Sea Loch</SelectItem>
                      <SelectItem value="Tidal Loch">Tidal Loch</SelectItem>
                    </>
                  )}
                  {type === "gem" && (
                    <>
                      <SelectItem value="Secret Beach">Secret Beach</SelectItem>
                      <SelectItem value="Hidden Waterfall">
                        Hidden Waterfall
                      </SelectItem>
                      <SelectItem value="Ancient Site">Ancient Site</SelectItem>
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
                      <SelectItem value="Forest Grove">Forest Grove</SelectItem>
                      <SelectItem value="Cave System">Cave System</SelectItem>
                      <SelectItem value="Coastal Feature">
                        Coastal Feature
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Nearest Town
              </label>
              <Input
                value={formData.nearest_town || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nearest_town: e.target.value })
                }
                placeholder="Nearest town or city"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude || ""}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                placeholder="57.1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Longitude
              </label>
              <Input
                type="number"
                step="any"
                value={formData.longitude || ""}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                placeholder="-4.5678"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {type === "castle" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Built Century
              </label>
              <Input
                value={formData.built_century || ""}
                onChange={(e) =>
                  setFormData({ ...formData, built_century: e.target.value })
                }
                placeholder="e.g., 12th Century"
              />
            </div>
          )}

          {type === "loch" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Length (km)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.length_km || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, length_km: e.target.value })
                  }
                  placeholder="25.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Depth (m)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.max_depth_m || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, max_depth_m: e.target.value })
                  }
                  placeholder="230"
                />
              </div>
            </div>
          )}

          {type === "gem" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty Level
                </label>
                <Select
                  value={formData.difficulty_level || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, difficulty_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Challenging">Challenging</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Requires Hiking
                </label>
                <Select
                  value={formData.requires_hiking || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, requires_hiking: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <Textarea
              required
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe this amazing place..."
              rows={3}
            />
          </div>

          {type === "gem" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  How to Find
                </label>
                <Textarea
                  value={formData.how_to_find || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, how_to_find: e.target.value })
                  }
                  placeholder="Directions and access information..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Special Features
                </label>
                <Input
                  value={formData.special_features || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      special_features: e.target.value,
                    })
                  }
                  placeholder="What makes this place special?"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Best Seasons
            </label>
            <Input
              value={formData.best_seasons || ""}
              onChange={(e) =>
                setFormData({ ...formData, best_seasons: e.target.value })
              }
              placeholder="April, May, June, July, August, September"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Creating..."
                : `Create ${type === "gem" ? "Hidden Gem" : type}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
