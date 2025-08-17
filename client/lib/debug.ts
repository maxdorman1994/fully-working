/**
 * Debug utilities for troubleshooting configuration issues
 */

export function getEnvironmentInfo() {
  const info = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "NOT_SET",
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "NOT_SET",
    cloudflareAccountId:
      import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || "NOT_SET",
    cloudflareToken: import.meta.env.VITE_CLOUDFLARE_IMAGES_TOKEN
      ? "SET"
      : "NOT_SET",
    nodeEnv: import.meta.env.MODE || "development",
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  };

  console.log("🔧 Environment Configuration:", info);
  return info;
}

export function validateSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const validation = {
    hasUrl: !!url,
    hasKey: !!key,
    urlValid: url
      ? url.startsWith("https://") && url.includes("supabase")
      : false,
    keyValid: key ? key.length > 100 : false,
  };

  console.log("✅ Supabase Validation:", validation);
  return validation;
}

export function debugNetworkError(error: any) {
  console.group("🐛 Network Error Debug");
  console.log("Error type:", typeof error);
  console.log("Error name:", error?.name);
  console.log("Error message:", error?.message);
  console.log("Error stack:", error?.stack);

  if (error instanceof TypeError) {
    if (error.message.includes("Failed to fetch")) {
      console.log(
        "💡 This is likely a network connectivity issue or CORS problem",
      );
    }
  }

  console.groupEnd();
}
