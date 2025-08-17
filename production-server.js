#!/usr/bin/env node

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Force production mode
process.env.NODE_ENV = "production";

console.log("🚀 Starting MINIMAL Production Server");
console.log("📂 Working directory:", process.cwd());
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);
console.log("📁 Serving from:", path.resolve("dist/spa"));

// Health check
app.get("/api/ping", (req, res) => {
  res.json({
    message: "Production server is running",
    timestamp: new Date().toISOString(),
  });
});

// FORCE static file serving - NO development dependencies
app.use(
  express.static("dist/spa", {
    index: false,
    redirect: false,
    fallthrough: false,
  }),
);

// SPA fallback - serve index.html for all routes
app.get("*", (req, res) => {
  console.log("📄 Serving SPA fallback for:", req.path);
  res.sendFile(path.resolve("dist/spa/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Production server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
