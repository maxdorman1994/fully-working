#!/usr/bin/env node

// Force production environment
process.env.NODE_ENV = "production";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🚀 Starting Scottish Adventure App in Production Mode");
console.log("📂 Working directory:", process.cwd());
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);

// Check if production build exists
const distPath = path.join(process.cwd(), "dist");
const spaPath = path.join(distPath, "spa");
const serverPath = path.join(distPath, "server", "node-build.mjs");

console.log("📋 Checking build files:");
console.log("  - dist/ exists:", fs.existsSync(distPath));
console.log("  - dist/spa/ exists:", fs.existsSync(spaPath));
console.log("  - server build exists:", fs.existsSync(serverPath));

if (!fs.existsSync(serverPath)) {
  console.error("❌ Production server build not found!");
  console.error("   Expected:", serverPath);
  console.error("   Run: npm run build");
  process.exit(1);
}

// Start the server
console.log("✅ Starting production server...");
import("./dist/server/node-build.mjs");
