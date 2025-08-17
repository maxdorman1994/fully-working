import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist/spa
app.use(express.static(path.join(__dirname, "dist/spa")));

// API health check
app.get("/api/ping", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// SPA fallback - serve index.html for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/spa/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
