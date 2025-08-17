import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SyncStatus from "@/components/SyncStatus";

interface EnvironmentStatus {
  supabase: boolean;
  cloudflare: boolean;
  api: boolean;
  environment: string;
}

export default function Debug() {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      // Check API endpoint
      const apiResponse = await fetch("/api/ping");
      const apiData = await apiResponse.json();

      // Check photo status
      const photoResponse = await fetch("/api/photos/status");
      const photoData = await photoResponse.json();

      setStatus({
        api: apiResponse.ok,
        cloudflare: photoData.configured || false,
        supabase: !!import.meta.env.VITE_SUPABASE_URL,
        environment: apiData.environment || "unknown",
      });
    } catch (error) {
      console.error("Environment check failed:", error);
      setStatus({
        api: false,
        cloudflare: false,
        supabase: !!import.meta.env.VITE_SUPABASE_URL,
        environment: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">System Status</h1>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Environment Check</h2>

          {loading ? (
            <p>Checking environment...</p>
          ) : status ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>API Server</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    status.api
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status.api ? "✅ Connected" : "❌ Disconnected"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Cloudflare Images</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    status.cloudflare
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {status.cloudflare
                    ? "✅ Configured"
                    : "⚠️ Using Placeholders"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Supabase Database</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    status.supabase
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status.supabase ? "✅ Configured" : "❌ Not Configured"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Platform</span>
                <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                  {status.environment}
                </span>
              </div>
            </div>
          ) : (
            <p>Failed to check environment</p>
          )}

          <Button
            onClick={checkEnvironment}
            className="mt-4"
            disabled={loading}
          >
            {loading ? "Checking..." : "Refresh Status"}
          </Button>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Supabase URL:</strong>{" "}
              {import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
            </div>
            <div>
              <strong>Supabase Key:</strong>{" "}
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
            </div>
          </div>
        </div>

        <SyncStatus showDetails={true} className="border-2 border-blue-200" />
      </div>
    </div>
  );
}
