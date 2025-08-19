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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin as MapPinType,
  addMapPin,
  updateMapPin,
  deleteMapPin,
  subscribeToMapPins,
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

  const { isAuthenticated } = useAuth();

  const [viewState, setViewState] = useState<ViewState>({
    longitude: -4.2026,
    latitude: 56.4907,
    zoom: 6.5,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<MapPinType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);

  const [newPin, setNewPin] = useState({
    title: "",
    description: "",
    category: "adventure" as MapPinType["category"],
    date: "",
  });

  useEffect(() => {
    console.log("🗺️ Setting up map pins real-time sync...");
    setIsLoading(true);

    const unsubscribe = subscribeToMapPins((updatedPins) => {
      setPins(updatedPins);

      const newStats = {
        total: updatedPins.length,
        byCategory: {
          adventure: updatedPins.filter((p) => p.category === "adventure").length,
          photo: updatedPins.filter((p) => p.category === "photo").length,
          memory: updatedPins.filter((p) => p.category === "memory").length,
          wishlist: updatedPins.filter((p) => p.category === "wishlist").length,
        },
      };
      setStats(newStats);
      setIsLoading(false);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const mapRef = useRef<any>();

  const handleMapClick = useCallback(
    (event: any) => {
      const { lng, lat } = event.lngLat;
      if (!isAuthenticated) return;

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
      const addedPin = await addMapPin({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        title: newPin.title,
        description: newPin.description,
        category: newPin.category,
        date: newPin.date,
      });

      setPins((currentPins) => [addedPin, ...currentPins]);
      setIsDialogOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error("❌ Error adding pin:", error);
    }
  };

  const handleEditPin = (pin: MapPinType) => {
    if (!isAuthenticated) return;

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
      const updatedPin = await updateMapPin(editingPin.id, {
        title: newPin.title,
        description: newPin.description,
        category: newPin.category,
        date: newPin.date,
      });

      setPins((currentPins) =>
        currentPins.map((pin) => (pin.id === editingPin.id ? updatedPin : pin)),
      );
      setEditingPin(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("❌ Error updating pin:", error);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    if (!isAuthenticated) return;
    try {
      await deleteMapPin(pinId);
      setPins((currentPins) => currentPins.filter((pin) => pin.id !== pinId));
      setSelectedPin(null);
    } catch (error) {
      console.error("❌ Error deleting pin:", error);
    }
  };

  const flyToLocation = (latitude: number, longitude: number) => {
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 12, duration: 2000 });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6">
        <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Our Adventure Map
        </span>
      </h1>

      {/* Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[600px] w-full relative">
                <ReactMapGL
                  ref={mapRef}
                  {...viewState}
                  onMove={(evt) => setViewState(evt.viewState)}
                  onClick={handleMapClick}
                  mapStyle="mapbox://styles/mapbox/outdoors-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  style={{ width: "100%", height: "100%" }}
                >
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
