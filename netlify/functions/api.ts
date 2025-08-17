import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { handleDemo } from "../../server/routes/demo";
import {
  uploadPhoto,
  uploadPhotoMiddleware,
  getPlaceholderPhoto,
  listPhotos,
  deletePhoto,
} from "../../server/routes/photos";
import { logR2Status, getR2Status } from "../../server/utils/r2Config";

// Create Express app specifically for Netlify Functions
function createNetlifyServer() {
  const app = express();

  // Log R2 configuration status
  logR2Status();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping, environment: "netlify-function" });
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

  // Log environment info for Netlify
  console.log("🔧 Netlify Function Environment Check:", {
    NODE_ENV: process.env.NODE_ENV,
    cwd: process.cwd(),
    platform: "netlify-functions",
  });

  return app;
}

export const handler = serverless(createNetlifyServer());
