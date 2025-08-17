import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";

export interface ProcessedPhoto {
  id: string;
  file: File;
  originalFile: File;
  preview: string;
  isProcessing: boolean;
  uploadProgress: number;
  cloudflareUrl?: string;
  error?: string;
}

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  quality: number;
}

const defaultCompressionOptions: CompressionOptions = {
  maxSizeMB: 0.8, // Compress to max 0.8MB (smaller for faster uploads)
  maxWidthOrHeight: 1600, // Max dimension 1600px (optimal for most screens)
  useWebWorker: true,
  quality: 0.85, // 85% quality (better balance of quality/size)
};

/**
 * Get compression options based on file size for optimal results
 */
function getSmartCompressionOptions(file: File): CompressionOptions {
  const fileSizeMB = file.size / 1024 / 1024;

  // For very large files (>8MB), be more aggressive
  if (fileSizeMB > 8) {
    return {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1400,
      useWebWorker: true,
      quality: 0.8,
    };
  }

  // For large files (4-8MB), moderate compression
  if (fileSizeMB > 4) {
    return {
      maxSizeMB: 0.7,
      maxWidthOrHeight: 1500,
      useWebWorker: true,
      quality: 0.82,
    };
  }

  // For medium files (1-4MB), light compression
  if (fileSizeMB > 1) {
    return {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      quality: 0.85,
    };
  }

  // For small files (<1MB), minimal compression
  return {
    maxSizeMB: 0.9,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: 0.9,
  };
}

/**
 * Compress an image file with smart compression based on file size
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {},
): Promise<File> {
  // Use smart compression if no custom options provided
  const smartOptions =
    Object.keys(options).length === 0
      ? getSmartCompressionOptions(file)
      : { ...defaultCompressionOptions, ...options };

  const compressionOptions = smartOptions;

  try {
    console.log(`Starting compression for: ${file.name} (${file.type})`);

    const compressedFile = await imageCompression(file, compressionOptions);

    // Create a new file with a compressed suffix for clarity
    const newName = file.name.replace(/(\.[^.]+)$/, "_compressed$1");

    const result = new File([compressedFile], newName, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });

    console.log(
      `Compression successful: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) -> ${result.name} (${(result.size / 1024 / 1024).toFixed(2)}MB)`,
    );
    return result;
  } catch (error) {
    console.error("Image compression failed for:", file.name);
    console.error("Compression error details:", error);

    // Extract meaningful error information
    let errorMessage = "Unknown compression error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error instanceof Event) {
      errorMessage = "Browser event error during compression";
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }

    console.error("Detailed compression error:", errorMessage);
    throw new Error(
      `Failed to compress image: ${file.name}. Error: ${errorMessage}`,
    );
  }
}

/**
 * Process a single photo: convert HEIC if needed, compress, and create preview
 */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  const id = uuidv4();
  let processedFile = file;
  let conversionAttempted = false;
  let compressionAttempted = false;
  const warnings: string[] = [];

  try {
    // Try to compress the image
    console.log(`Attempting compression for: ${processedFile.name}`);
    compressionAttempted = true;

    try {
      const compressedFile = await compressImage(processedFile);
      processedFile = compressedFile;
      console.log(`Compression successful for: ${file.name}`);
    } catch (compressionError) {
      console.warn(
        `Compression failed for ${processedFile.name}:`,
        compressionError,
      );
      warnings.push("Compression failed - using original size");
      // Keep the uncompressed file
    }

    // Create preview URL
    let preview: string;
    try {
      preview = URL.createObjectURL(processedFile);
    } catch (previewError) {
      console.warn("Failed to create preview, using placeholder");
      preview = "/placeholder.svg";
      warnings.push("Preview generation failed");
    }

    console.log(
      `Photo processing completed: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) -> ${processedFile.name} (${(processedFile.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    return {
      id,
      file: processedFile,
      originalFile: file,
      preview,
      isProcessing: false,
      uploadProgress: 0,
      error: warnings.length > 0 ? warnings.join("; ") : undefined,
    };
  } catch (error) {
    console.error("Photo processing failed completely:", error);

    // Ultimate fallback: return the original file with detailed error
    let fallbackPreview = "/placeholder.svg";
    try {
      fallbackPreview = URL.createObjectURL(file);
    } catch (previewError) {
      console.warn("Even fallback preview failed");
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      id,
      file,
      originalFile: file,
      preview: fallbackPreview,
      isProcessing: false,
      uploadProgress: 0,
      error: `Processing failed: ${errorMessage}. Uploading original file.`,
    };
  }
}

/**
 * Process multiple photos
 */
export async function processPhotos(files: File[]): Promise<ProcessedPhoto[]> {
  const processedPhotos: ProcessedPhoto[] = [];

  for (const file of files) {
    try {
      const processed = await processPhoto(file);
      processedPhotos.push(processed);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      // Add failed photo with error state
      processedPhotos.push({
        id: uuidv4(),
        file,
        originalFile: file,
        preview: URL.createObjectURL(file),
        isProcessing: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
  }

  return processedPhotos;
}

/**
 * Upload photo to Cloudflare Images via our API
 */
export async function uploadPhotoToCloudflare(
  photo: ProcessedPhoto,
  onProgress?: (progress: number) => void,
): Promise<string> {
  console.log(
    `🔼 Starting upload for photo: ${photo.originalFile.name} (${photo.id})`,
  );

  const formData = new FormData();
  formData.append("photo", photo.file);
  formData.append("originalName", photo.originalFile.name);
  formData.append("photoId", photo.id);

  console.log(`📤 FormData prepared:`, {
    fileName: photo.originalFile.name,
    fileSize: photo.file.size,
    fileType: photo.file.type,
    photoId: photo.id,
  });

  try {
    // Create XMLHttpRequest to track upload progress
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        console.log(`📥 Upload response received:`, {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText,
        });

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log(`✅ Upload successful:`, response);
            resolve(response.url);
          } catch (error) {
            console.error(`❌ Failed to parse response:`, error);
            reject(new Error("Invalid response format"));
          }
        } else {
          console.error(
            `❌ Upload failed with status ${xhr.status}:`,
            xhr.responseText,
          );
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", "/api/photos/upload");
      console.log(`🚀 Sending upload request to /api/photos/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Photo upload failed:", error);
    throw new Error(error instanceof Error ? error.message : "Upload failed");
  }
}

/**
 * Validate file type and size for Cloudflare Images
 */
export function validatePhotoFile(file: File): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  const maxSize = 15 * 1024 * 1024; // 15MB limit (we compress aggressively)
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum file size is ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (
    !allowedTypes.includes(file.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    return {
      valid: false,
      error:
        "Unsupported file type. Please use JPEG, PNG, WebP, GIF, or SVG images",
    };
  }

  return { valid: true };
}

/**
 * Cleanup preview URLs to prevent memory leaks
 */
export function cleanupPreviewUrls(photos: ProcessedPhoto[]) {
  photos.forEach((photo) => {
    if (photo.preview.startsWith("blob:")) {
      URL.revokeObjectURL(photo.preview);
    }
  });
}
