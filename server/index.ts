import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { handleDemo } from "./routes/demo";
import {
  uploadPhoto,
  uploadPhotoMiddleware,
  getPlaceholderPhoto,
  listPhotos,
  deletePhoto,
} from "./routes/photos";
import { logR2Status, getR2Status } from "./utils/r2Config";

// Fix for serverless environments where import.meta.url might be undefined
let __dirname: string;
try {
  __dirname = path.dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname = process.cwd();
}

export function createServer() {
  const app = express();

  // Log R2 configuration status
  logR2Status();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Photo upload routes
  app.post("/api/photos/upload", uploadPhotoMiddleware, uploadPhoto);
  app.get("/api/photos/placeholder/:photoId", getPlaceholderPhoto);
  app.get("/api/photos", listPhotos);
  app.delete("/api/photos/:imageId", deletePhoto);

  // R2 configuration status
  app.get("/api/photos/status", (_req, res) => {
    const status = getR2Status();
    res.json(status);
  });

  // Log environment info
  const distPath = path.join(__dirname, "../dist/spa");
  console.log("🔧 Server Environment Check:", {
    NODE_ENV: process.env.NODE_ENV,
    distExists: fs.existsSync(distPath),
    distPath: distPath,
    cwd: process.cwd(),
    dirname: __dirname,
  });

  // Serve static files from dist/spa (force for all non-dev environments)
  const isDevelopment = process.env.NODE_ENV === "development";
  const hasDistFolder = fs.existsSync(distPath);

  if (!isDevelopment && hasDistFolder) {
    console.log("✅ Serving static files from:", distPath);
    app.use(express.static(distPath));

    // Serve index.html for all non-API routes (SPA fallback)
    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      console.log("📄 Serving SPA fallback:", indexPath);
      res.sendFile(indexPath);
    });
  } else {
    console.log(
      "⚠️ Not serving static files - development mode or no dist folder",
    );
    console.log("📁 Checked path:", distPath);
    console.log("📁 Directory exists:", hasDistFolder);
  }

  return app;
}
