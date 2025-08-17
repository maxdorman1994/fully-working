import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

console.log("🔧 Supabase Configuration Check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlFormat: supabaseUrl
    ? supabaseUrl.startsWith("https://")
      ? "Valid HTTPS URL"
      : "Invalid URL format"
    : "Missing",
  keyFormat: supabaseAnonKey
    ? supabaseAnonKey.length > 100
      ? "Valid length"
      : "Too short"
    : "Missing",
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
  console.warn("Environment variables:", {
    VITE_SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? "Set" : "Missing",
  });
}

// Create Supabase client (with fallback for when not configured)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : {
      // Mock client to prevent crashes when Supabase not configured
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      }),
      channel: () => ({
        on: () => ({}),
        subscribe: () => ({}),
      }),
      removeChannel: () => {},
      rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    };

// Database types for Supabase tables
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  location: string;
  weather: string;
  mood: string;
  miles_traveled: number;
  parking: string;
  dog_friendly: boolean;
  paid_activity: boolean;
  adult_tickets: string;
  child_tickets: string;
  other_tickets: string;
  pet_notes: string;
  tags: string[];
  photos: string[]; // Array of Cloudflare R2 URLs
  created_at?: string;
  updated_at?: string;
}

export interface ProcessedPhoto {
  id: string;
  file: File;
  originalFile: File;
  preview: string;
  isProcessing: boolean;
  uploadProgress: number;
  cloudflareUrl?: string; // R2 URL, not Supabase
  error?: string;
}

// Note: Photos are stored in Cloudflare R2, not Supabase Storage
// Supabase only stores the R2 URLs in the database

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Get Supabase configuration status
 */
export function getSupabaseStatus(): {
  configured: boolean;
  message: string;
  url?: string;
} {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      configured: false,
      message:
        "Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
    };
  }

  return {
    configured: true,
    message: "Supabase configured successfully",
    url: supabaseUrl,
  };
}
