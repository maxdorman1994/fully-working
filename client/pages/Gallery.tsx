import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Heart,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Camera,
  Star,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getJournalEntries, getAllTags } from "@/lib/journalService";
import { JournalEntry } from "@/lib/supabase";

interface PhotoWithMetadata {
  url: string;
  journalEntry: JournalEntry;
  index: number; // Index within the journal entry's photos array
}

export default function Gallery() {
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoWithMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithMetadata | null>(
    null,
  );
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [sortBy, setSortBy] = useState<"date" | "location" | "title">("date");

  // Load photos and metadata
  useEffect(() => {
    loadGalleryData();
  }, []);

  // Filter photos when search/filter criteria change
  useEffect(() => {
    filterPhotos();
  }, [photos, searchTerm, selectedTag, selectedLocation, sortBy]);

  const loadGalleryData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [journalEntries, availableTags] = await Promise.all([
        getJournalEntries(),
        getAllTags(),
      ]);

      // Extract all photos with their metadata
      const allPhotos: PhotoWithMetadata[] = [];
      const locationSet = new Set<string>();

      journalEntries.forEach((entry) => {
        locationSet.add(entry.location);

        if (entry.photos && entry.photos.length > 0) {
          entry.photos.forEach((photoUrl, index) => {
            allPhotos.push({
              url: photoUrl,
              journalEntry: entry,
              index,
            });
          });
        }
      });

      setPhotos(allPhotos);
      setTags(availableTags);
      setLocations(Array.from(locationSet).sort());

      console.log(
        `✅ Loaded ${allPhotos.length} photos from ${journalEntries.length} journal entries`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to load gallery data:", errorMessage);
      setError(`Failed to load photos: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPhotos = () => {
    let filtered = [...photos];

    // Filter by search term (searches entry title, content, location)
    if (searchTerm) {
      filtered = filtered.filter(
        (photo) =>
          photo.journalEntry.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          photo.journalEntry.content
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          photo.journalEntry.location
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by tag
    if (selectedTag !== "all") {
      filtered = filtered.filter((photo) =>
        photo.journalEntry.tags?.includes(selectedTag),
      );
    }

    // Filter by location
    if (selectedLocation !== "all") {
      filtered = filtered.filter(
        (photo) => photo.journalEntry.location === selectedLocation,
      );
    }

    // Sort photos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.journalEntry.date).getTime() -
            new Date(a.journalEntry.date).getTime()
          );
        case "location":
          return a.journalEntry.location.localeCompare(b.journalEntry.location);
        case "title":
          return a.journalEntry.title.localeCompare(b.journalEntry.title);
        default:
          return 0;
      }
    });

    setFilteredPhotos(filtered);
  };

  const openLightbox = (photo: PhotoWithMetadata, index: number) => {
    setSelectedPhoto(photo);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setLightboxIndex(0);
  };

  const nextPhoto = () => {
    if (lightboxIndex < filteredPhotos.length - 1) {
      const nextIndex = lightboxIndex + 1;
      setLightboxIndex(nextIndex);
      setSelectedPhoto(filteredPhotos[nextIndex]);
    }
  };

  const previousPhoto = () => {
    if (lightboxIndex > 0) {
      const prevIndex = lightboxIndex - 1;
      setLightboxIndex(prevIndex);
      setSelectedPhoto(filteredPhotos[prevIndex]);
    }
  };

  const getGridCols = () => {
    switch (gridSize) {
      case "small":
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
      case "medium":
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case "large":
        return "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Loading Photo Gallery
          </h3>
          <p className="text-slate-600">
            Gathering your beautiful Scottish memories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border-2 border-blue-200/50 shadow-lg">
            <Camera className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Scottish Adventure Gallery
            </span>
            <ImageIcon className="h-6 w-6 text-blue-600" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
              Photo Gallery
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Relive your Scottish adventures through {filteredPhotos.length}{" "}
            beautiful memories
          </p>

          {/* Error Display */}
          {error && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 text-red-800 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <span className="font-semibold">Gallery Error</span>
                </div>
                <p className="text-sm text-center">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadGalleryData}
                  className="mt-4 mx-auto block border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {filteredPhotos.length}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Photos
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {locations.length}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  Locations
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">
                  {tags.length}
                </div>
                <div className="text-sm font-semibold text-slate-600">Tags</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🔍 Search
                </label>
                <Input
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2 border-slate-200 focus:border-blue-400"
                />
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🏷️ Tag
                </label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📍 Location
                </label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📊 Sort
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid Size */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📐 Size
                </label>
                <div className="flex gap-1">
                  <Button
                    variant={gridSize === "small" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGridSize("small")}
                    className="p-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === "medium" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGridSize("medium")}
                    className="p-2"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === "large" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGridSize("large")}
                    className="p-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl p-12 border-2 border-slate-200 max-w-md mx-auto">
              <ImageIcon className="h-16 w-16 mx-auto mb-6 text-slate-400" />
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                No Photos Found
              </h3>
              <p className="text-slate-600 mb-6">
                {photos.length === 0
                  ? "No photos have been added to your journal entries yet."
                  : "Try adjusting your search filters to find photos."}
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTag("all");
                  setSelectedLocation("all");
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className={`grid ${getGridCols()} gap-4`}>
            {filteredPhotos.map((photo, index) => (
              <Card
                key={`${photo.journalEntry.id}-${photo.index}`}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white/95 backdrop-blur-sm"
                onClick={() => openLightbox(photo, index)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={photo.url}
                    alt={`Photo from ${photo.journalEntry.title}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-bold text-lg mb-1 truncate">
                        {photo.journalEntry.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {photo.journalEntry.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(
                            photo.journalEntry.date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation Buttons */}
              {lightboxIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {lightboxIndex < filteredPhotos.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Photo */}
              <div className="relative max-h-full max-w-full">
                <img
                  src={selectedPhoto.url}
                  alt={`Photo from ${selectedPhoto.journalEntry.title}`}
                  className="max-h-full max-w-full object-contain"
                />

                {/* Photo Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedPhoto.journalEntry.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedPhoto.journalEntry.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(
                          selectedPhoto.journalEntry.date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      Photo {lightboxIndex + 1} of {filteredPhotos.length}
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mb-3">
                    {selectedPhoto.journalEntry.content}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPhoto.journalEntry.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
