import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactMapGL, { Marker, Popup, ViewState } from "react-map-gl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Trash2,
  Edit,
  Calendar,
  ExternalLink,
  Info,
  Wifi,
  WifiOff,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin as MapPinType,
  addMapPin,
  updateMapPin,
  deleteMapPin,
  subscribeToMapPins,
  getMapPinsStats,
} from "@/lib/mapPinsService";
import "mapbox-gl/dist/mapbox-gl.css";

const categoryColors = {
  adventure: "bg-emerald-500",
  photo: "bg-blue-500",
  memory: "bg-purple-500",
  wishlist: "bg-orange-500",
};

const categoryLabels = {
  adventure: "Adventure",
  photo: "Photo Spot",
  memory: "Memory",
  wishlist: "Wishlist",
};

// Your personal Mapbox token
const MAPBOX_TOKEN =
  "pk.eyJ1IjoibWF4ZG9ybWFuMTciLCJhIjoiY21keHpjOHJhMWNmbjJrcXczem9hNzBvdCJ9.BKW3-ffrkz1oPVI6lYEKtA";

export default function MapPage() {
  const [pins, setPins] = useState<MapPinType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {
      adventure: 0,
      photo: 0,
      memory: 0,
      wishlist: 0,
    },
  });

  const { isAuthenticated, sessionTimeRemaining, logout } = useAuth();

  const [viewState, setViewState] = useState<ViewState>({
    longitude: -4.2026,
    latitude: 56.4907,
    zoom: 6.5,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<MapPin | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  const [newPin, setNewPin] = useState({
    title: "",
    description: "",
    category: "adventure" as MapPinType["category"],
    date: "",
  });

  // Set up real-time sync and online status monitoring
  useEffect(() => {
    console.log("🗺️ Setting up map pins real-time sync...");
    setIsLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMapPins((updatedPins) => {
      console.log(`🗺️ Received ${updatedPins.length} pins from database`);
      setPins(updatedPins);

      // Update stats
      const newStats = {
        total: updatedPins.length,
        byCategory: {
          adventure: updatedPins.filter((p) => p.category === "adventure")
            .length,
          photo: updatedPins.filter((p) => p.category === "photo").length,
          memory: updatedPins.filter((p) => p.category === "memory").length,
          wishlist: updatedPins.filter((p) => p.category === "wishlist").length,
        },
      };
      setStats(newStats);
      setIsLoading(false);
    });

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup function
    return () => {
      console.log("����️ Cleaning up map pins subscriptions");
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const mapRef = useRef<any>();

  const handleMapClick = useCallback(
    (event: any) => {
      const { lng, lat } = event.lngLat;

      // Only allow pin creation if authenticated
      if (!isAuthenticated) {
        return;
      }

      setSelectedLocation({ latitude: lat, longitude: lng });
      setSelectedPin(null);
      setEditingPin(null);
      setNewPin({
        title: "",
        description: "",
        category: "adventure",
        date: new Date().toISOString().split("T")[0],
      });
      setIsDialogOpen(true);
    },
    [isAuthenticated],
  );

  const handleAddPin = async () => {
    if (!selectedLocation || !newPin.title.trim()) return;

    try {
      console.log("🗺️ Adding new pin:", newPin.title);
      const addedPin = await addMapPin({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        title: newPin.title,
        description: newPin.description,
        category: newPin.category,
        date: newPin.date,
      });

      // Immediately update local state for instant UI feedback
      setPins((currentPins) => {
        const newPins = [addedPin, ...currentPins];
        // Update stats immediately
        setStats({
          total: newPins.length,
          byCategory: {
            adventure: newPins.filter((p) => p.category === "adventure").length,
            photo: newPins.filter((p) => p.category === "photo").length,
            memory: newPins.filter((p) => p.category === "memory").length,
            wishlist: newPins.filter((p) => p.category === "wishlist").length,
          },
        });
        return newPins;
      });

      setIsDialogOpen(false);
      setSelectedLocation(null);
      console.log("✅ Pin added successfully and will sync across devices");
    } catch (error) {
      console.error("❌ Error adding pin:", error);
      alert(`Error adding pin: ${error.message || error}`);
    }
  };

  const handleEditPin = (pin: MapPinType) => {
    // Only allow edit if authenticated
    if (!isAuthenticated) {
      return;
    }

    setEditingPin(pin);
    setSelectedPin(null);
    setNewPin({
      title: pin.title,
      description: pin.description,
      category: pin.category,
      date: pin.date || "",
    });
    setIsDialogOpen(true);
  };

  const handleUpdatePin = async () => {
    if (!editingPin || !newPin.title.trim()) return;

    try {
      console.log("🗺️ Updating pin:", editingPin.title);
      const updatedPin = await updateMapPin(editingPin.id, {
        title: newPin.title,
        description: newPin.description,
        category: newPin.category,
        date: newPin.date,
      });

      // Immediately update local state for instant UI feedback
      setPins((currentPins) => {
        const newPins = currentPins.map((pin) =>
          pin.id === editingPin.id ? updatedPin : pin,
        );
        // Update stats immediately
        setStats({
          total: newPins.length,
          byCategory: {
            adventure: newPins.filter((p) => p.category === "adventure").length,
            photo: newPins.filter((p) => p.category === "photo").length,
            memory: newPins.filter((p) => p.category === "memory").length,
            wishlist: newPins.filter((p) => p.category === "wishlist").length,
          },
        });
        return newPins;
      });

      setIsDialogOpen(false);
      setEditingPin(null);
      console.log("✅ Pin updated successfully and will sync across devices");
    } catch (error) {
      console.error("❌ Error updating pin:", error);
      alert(`Error updating pin: ${error.message || error}`);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    // Only allow delete if authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      console.log("🗺️ Deleting pin:", pinId);
      console.log("🗺️ Current pins before delete:", pins.length);

      // Delete from database
      await deleteMapPin(pinId);

      // Immediately update local state for instant UI feedback
      setPins((currentPins) => {
        const newPins = currentPins.filter((pin) => pin.id !== pinId);
        // Update stats immediately
        setStats({
          total: newPins.length,
          byCategory: {
            adventure: newPins.filter((p) => p.category === "adventure").length,
            photo: newPins.filter((p) => p.category === "photo").length,
            memory: newPins.filter((p) => p.category === "memory").length,
            wishlist: newPins.filter((p) => p.category === "wishlist").length,
          },
        });
        return newPins;
      });
      setSelectedPin(null);

      console.log("✅ Pin deleted successfully and will sync across devices");
    } catch (error) {
      console.error("❌ Error deleting pin:", error);
      alert(`Error deleting pin: ${error.message || error}`);
    }
  };

  const flyToLocation = (latitude: number, longitude: number) => {
    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom: 12,
      duration: 2000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 px-4 sm:px-0">
          <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Our Adventure Map
          </span>
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          {isAuthenticated
            ? "Click anywhere on the map to add a new pin for your Scottish adventures!"
            : "Login in the footer to start adding pins for your Scottish adventures!"}
        </p>

        {/* Category Legend */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Badge
              key={key}
              className={`${categoryColors[key as keyof typeof categoryColors]} text-white`}
            >
              <MapPin className="w-3 h-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>

        {/* Info Banner */}
        <div className="flex justify-center mb-6 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-blue-700">
            <Info className="w-4 h-4" />
            <span>
              {isAuthenticated
                ? "Interactive map powered by Mapbox - Click to add pins, drag to explore Scotland!"
                : "Interactive map powered by Mapbox - Login in footer to add pins and edit adventures"}
            </span>
          </div>

          {/* Sync Status */}
          <div
            className={`rounded-lg px-4 py-2 flex items-center gap-2 text-sm ${
              isOnline
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span>
              {isLoading
                ? "Loading pins..."
                : isOnline
                  ? `${pins.length} pins synced`
                  : "Offline mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Adventure Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Pins */}
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Pins</div>
            </CardContent>
          </Card>

          {/* Adventure Pins */}
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex justify-center mb-2">
                <div
                  className={`w-6 h-6 rounded-full ${categoryColors.adventure} flex items-center justify-center`}
                >
                  <MapPin className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-500 mb-1">
                {stats.byCategory.adventure}
              </div>
              <div className="text-xs text-muted-foreground">Adventures</div>
            </CardContent>
          </Card>

          {/* Photo Pins */}
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex justify-center mb-2">
                <div
                  className={`w-6 h-6 rounded-full ${categoryColors.photo} flex items-center justify-center`}
                >
                  <MapPin className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {stats.byCategory.photo}
              </div>
              <div className="text-xs text-muted-foreground">Photo Spots</div>
            </CardContent>
          </Card>

          {/* Memory Pins */}
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex justify-center mb-2">
                <div
                  className={`w-6 h-6 rounded-full ${categoryColors.memory} flex items-center justify-center`}
                >
                  <MapPin className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-500 mb-1">
                {stats.byCategory.memory}
              </div>
              <div className="text-xs text-muted-foreground">Memories</div>
            </CardContent>
          </Card>

          {/* Wishlist Pins */}
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex justify-center mb-2">
                <div
                  className={`w-6 h-6 rounded-full ${categoryColors.wishlist} flex items-center justify-center`}
                >
                  <MapPin className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-500 mb-1">
                {stats.byCategory.wishlist}
              </div>
              <div className="text-xs text-muted-foreground">Wishlist</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {pins.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Recent Pin */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                  Most Recent Pin
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pins.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{pins[0].title}</div>
                      <div className="text-sm text-muted-foreground">
                        {pins[0].description && pins[0].description.length > 40
                          ? `${pins[0].description.substring(0, 40)}...`
                          : pins[0].description || "No description"}
                      </div>
                      {pins[0].date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(pins[0].date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={`${categoryColors[pins[0].category]} text-white`}
                    >
                      {categoryLabels[pins[0].category]}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]} mr-2`}
                        ></div>
                        <span className="text-sm">
                          {
                            categoryLabels[
                              category as keyof typeof categoryLabels
                            ]
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">
                          {count}
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`}
                            style={{
                              width:
                                stats.total > 0
                                  ? `${(count / stats.total) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Map */}
        <div className="lg:col-span-3 order-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full relative">
                <ReactMapGL
                  ref={mapRef}
                  {...viewState}
                  onMove={(evt) => setViewState(evt.viewState)}
                  onClick={handleMapClick}
                  mapStyle="mapbox://styles/mapbox/outdoors-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  doubleClickZoom={true}
                  scrollZoom={true}
                  dragPan={true}
                  dragRotate={false}
                  touchZoom={true}
                  touchRotate={false}
                  keyboard={true}
                  attributionControl={true}
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* Adventure Pins */}
                  {pins.map((pin) => (
                    <Marker
                      key={pin.id}
                      latitude={pin.latitude}
                      longitude={pin.longitude}
                      anchor="bottom"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedPin(pin);
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${categoryColors[pin.category]} border-3 border-white shadow-lg flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110`}
                      >
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </Marker>
                  ))}

                  {/* Pin Popup */}
                  {selectedPin && (
                    <Popup
                      latitude={selectedPin.latitude}
                      longitude={selectedPin.longitude}
                      anchor="top"
                      onClose={() => setSelectedPin(null)}
                      closeButton={true}
                      closeOnClick={false}
                    >
                      <div className="p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            className={`${categoryColors[selectedPin.category]} text-white text-xs`}
                          >
                            {categoryLabels[selectedPin.category]}
                          </Badge>
                          {isAuthenticated && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPin(selectedPin)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePin(selectedPin.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">
                          {selectedPin.title}
                        </h3>
                        {selectedPin.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {selectedPin.description}
                          </p>
                        )}
                        {selectedPin.date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(selectedPin.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </Popup>
                  )}
                </ReactMapGL>

                {/* Map Controls Overlay */}
                <div className="absolute top-4 right-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewState({
                        ...viewState,
                        longitude: -4.2026,
                        latitude: 56.4907,
                        zoom: 6.5,
                        bearing: 0,
                        pitch: 0,
                      });
                    }}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    Reset View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pin List Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="w-5 h-5 mr-2" />
                Adventure Pins ({pins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto">
                {pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => flyToLocation(pin.latitude, pin.longitude)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        className={`${categoryColors[pin.category]} text-white text-xs`}
                      >
                        {categoryLabels[pin.category]}
                      </Badge>
                      {isAuthenticated && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPin(pin);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePin(pin.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm mb-1">{pin.title}</h4>
                    {pin.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {pin.description}
                      </p>
                    )}
                    {pin.date && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(pin.date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Click to view on map
                    </div>
                  </div>
                ))}
                {pins.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pins yet!</p>
                    <p className="text-xs">
                      {isAuthenticated
                        ? "Click on the map to add your first adventure pin."
                        : "Login in the footer to start adding adventure pins."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Pin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPin ? "Edit Pin" : "Add New Pin"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedLocation && !editingPin && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <strong>Location:</strong>{" "}
                {selectedLocation.latitude.toFixed(4)},{" "}
                {selectedLocation.longitude.toFixed(4)}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={newPin.title}
                onChange={(e) =>
                  setNewPin({ ...newPin, title: e.target.value })
                }
                placeholder="Enter pin title..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newPin.description}
                onChange={(e) =>
                  setNewPin({ ...newPin, description: e.target.value })
                }
                placeholder="Describe this location..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={newPin.category}
                onChange={(e) =>
                  setNewPin({
                    ...newPin,
                    category: e.target.value as MapPin["category"],
                  })
                }
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="adventure">Adventure</option>
                <option value="photo">Photo Spot</option>
                <option value="memory">Memory</option>
                <option value="wishlist">Wishlist</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newPin.date}
                onChange={(e) => setNewPin({ ...newPin, date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingPin ? handleUpdatePin : handleAddPin}>
                {editingPin ? "Update Pin" : "Add Pin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
