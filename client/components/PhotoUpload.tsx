import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  processPhotos,
  uploadPhotoToCloudflare,
  validatePhotoFile,
  cleanupPreviewUrls,
  ProcessedPhoto,
} from "@/lib/photoUtils";

interface PhotoUploadProps {
  photos: ProcessedPhoto[];
  onPhotosChange: (photos: ProcessedPhoto[]) => void;
  maxPhotos?: number;
  className?: string;
}

export default function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 20,
  className = "",
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        alert(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      // Validate files
      const validFiles: File[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      filesToProcess.forEach((file) => {
        const validation = validatePhotoFile(file);
        if (validation.valid) {
          validFiles.push(file);
          if (validation.warning) {
            warnings.push(`${file.name}: ${validation.warning}`);
          }
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (errors.length > 0) {
        alert(`Some files were skipped:\n${errors.join("\n")}`);
      }

      if (warnings.length > 0) {
        console.warn("Photo upload warnings:", warnings.join("\n"));
      }

      if (validFiles.length === 0) return;

      setIsProcessing(true);

      try {
        console.log(`Processing ${validFiles.length} photos...`);
        const processedPhotos = await processPhotos(validFiles);

        // Add processed photos to the list
        onPhotosChange([...photos, ...processedPhotos]);

        console.log(`Successfully processed ${processedPhotos.length} photos`);
      } catch (error) {
        console.error("Error processing photos:", error);
        alert("Failed to process some photos. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [photos, onPhotosChange, maxPhotos],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removePhoto = useCallback(
    (photoId: string) => {
      const photoToRemove = photos.find((p) => p.id === photoId);
      if (photoToRemove && photoToRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      onPhotosChange(photos.filter((photo) => photo.id !== photoId));
    },
    [photos, onPhotosChange],
  );

  const uploadPhoto = useCallback(
    async (photo: ProcessedPhoto) => {
      if (photo.cloudflareUrl || photo.isProcessing) return;

      const updatedPhotos = photos.map((p) =>
        p.id === photo.id ? { ...p, isProcessing: true, uploadProgress: 0 } : p,
      );
      onPhotosChange(updatedPhotos);

      try {
        const cloudflareUrl = await uploadPhotoToCloudflare(
          photo,
          (progress) => {
            const updatedPhotos = photos.map((p) =>
              p.id === photo.id ? { ...p, uploadProgress: progress } : p,
            );
            onPhotosChange(updatedPhotos);
          },
        );

        const finalUpdatedPhotos = photos.map((p) =>
          p.id === photo.id
            ? { ...p, isProcessing: false, uploadProgress: 100, cloudflareUrl }
            : p,
        );
        onPhotosChange(finalUpdatedPhotos);

        console.log(
          `Photo uploaded: ${photo.originalFile.name} -> ${cloudflareUrl}`,
        );
      } catch (error) {
        console.error("Upload failed:", error);
        const errorUpdatedPhotos = photos.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                isProcessing: false,
                uploadProgress: 0,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : p,
        );
        onPhotosChange(errorUpdatedPhotos);
      }
    },
    [photos, onPhotosChange],
  );

  const uploadAllPhotos = useCallback(async () => {
    const photosToUpload = photos.filter(
      (p) => !p.cloudflareUrl && !p.isProcessing && !p.error,
    );

    for (const photo of photosToUpload) {
      await uploadPhoto(photo);
    }
  }, [photos, uploadPhoto]);

  const canAddMore = photos.length < maxPhotos;
  const hasPhotosToUpload = photos.some(
    (p) => !p.cloudflareUrl && !p.isProcessing && !p.error,
  );

  return (
    <div className={className}>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="relative group overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <img
                  src={photo.preview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />

                {/* Processing overlay */}
                {photo.isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-xs">
                        {photo.uploadProgress > 0
                          ? `${photo.uploadProgress}%`
                          : "Processing..."}
                      </div>
                      {photo.uploadProgress > 0 && (
                        <Progress
                          value={photo.uploadProgress}
                          className="w-16 h-1 mt-1"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {photo.cloudflareUrl && (
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {photo.error && (
                    <div className="bg-red-500 rounded-full p-1">
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 left-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Upload button for individual photos */}
                {!photo.cloudflareUrl &&
                  !photo.isProcessing &&
                  !photo.error && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-1 left-1 h-6 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => uploadPhoto(photo)}
                    >
                      Upload
                    </Button>
                  )}
              </div>

              {/* File info */}
              <div className="p-2 bg-gray-50">
                <div className="text-xs font-medium truncate">
                  {photo.originalFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(photo.file.size / 1024 / 1024).toFixed(2)}MB
                  {photo.file.size !== photo.originalFile.size && (
                    <span className="text-green-600">
                      {" "}
                      (compressed from{" "}
                      {(photo.originalFile.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                  )}
                </div>
                {photo.error && (
                  <div className="text-xs mt-1 leading-tight">
                    <div className="text-red-500">{photo.error}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Upload area */}
        {canAddMore && (
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              isDragging
                ? "border-vibrant-blue bg-vibrant-blue/10"
                : "border-scotland-thistle/50 hover:border-vibrant-blue"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center aspect-square p-4">
              {isProcessing ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                  <span className="text-sm text-muted-foreground text-center">
                    Processing photos...
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground text-center">
                    Add Photo
                  </span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    JPEG, PNG, WebP
                  </span>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action buttons */}
      {photos.length > 0 && (
        <div className="flex gap-2 justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {photos.length}/{maxPhotos} photos •
            {photos.filter((p) => p.cloudflareUrl).length} uploaded • Supports
            JPEG, PNG, WebP, GIF
          </div>

          {hasPhotosToUpload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={uploadAllPhotos}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload All
            </Button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-2">
        📷 Photos are intelligently compressed for faster uploads while
        maintaining quality. Max {maxPhotos} photos, up to 15MB each. Larger
        photos are compressed more aggressively.
      </p>
    </div>
  );
}
