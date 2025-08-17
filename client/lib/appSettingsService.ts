import { supabase } from "./supabase";
import { debugNetworkError } from "./debug";

export interface AppSettings {
  id?: string;
  logo_url: string;
  app_title: string;
  theme_color: string;
  updated_at?: string;
  created_at?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  logo_url: "/placeholder.svg",
  app_title: "A Wee Adventure",
  theme_color: "#3B82F6",
};

/**
 * Load app settings from database with fallback to localStorage
 */
export async function loadAppSettings(): Promise<AppSettings> {
  try {
    console.log("🔄 Loading app settings from database...");

    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, create default
        console.log("📝 No app settings found, creating defaults...");
        return await createAppSettings(DEFAULT_SETTINGS);
      }
      throw error;
    }

    console.log("✅ App settings loaded from database:", data);

    // Cache in localStorage for offline access
    localStorage.setItem("app_settings", JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("❌ Failed to load app settings:", error);
    debugNetworkError(error);

    // Fallback to localStorage
    const cached = localStorage.getItem("app_settings");
    if (cached) {
      console.log("📱 Using cached app settings");
      return JSON.parse(cached);
    }

    // Final fallback to defaults
    console.log("🔄 Using default app settings");
    return DEFAULT_SETTINGS;
  }
}

/**
 * Create initial app settings
 */
export async function createAppSettings(
  settings: AppSettings,
): Promise<AppSettings> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .insert([settings])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ App settings created:", data);
    localStorage.setItem("app_settings", JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("❌ Failed to create app settings:", error);
    debugNetworkError(error);
    return settings;
  }
}

/**
 * Update app settings (logo, title, etc.)
 */
export async function updateAppSettings(
  updates: Partial<AppSettings>,
): Promise<AppSettings> {
  try {
    console.log("🔄 Updating app settings:", updates);

    // First try to get existing settings
    let { data: existing, error: fetchError } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      // No settings exist, create them
      const newSettings = { ...DEFAULT_SETTINGS, ...updates };
      return await createAppSettings(newSettings);
    }

    if (fetchError) throw fetchError;

    // Update existing settings
    const { data, error } = await supabase
      .from("app_settings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ App settings updated:", data);

    // Update localStorage cache
    localStorage.setItem("app_settings", JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("❌ Failed to update app settings:", error);
    debugNetworkError(error);

    // Update localStorage as fallback
    const cached = localStorage.getItem("app_settings");
    const currentSettings = cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
    const updatedSettings = { ...currentSettings, ...updates };
    localStorage.setItem("app_settings", JSON.stringify(updatedSettings));

    return updatedSettings;
  }
}

/**
 * Update logo URL specifically
 */
export async function updateLogoUrl(logoUrl: string): Promise<void> {
  try {
    console.log("🔄 Syncing logo URL across devices:", logoUrl);

    const settings = await updateAppSettings({ logo_url: logoUrl });

    // Also update localStorage for immediate access
    if (logoUrl !== "/placeholder.svg") {
      localStorage.setItem("family_logo_url", logoUrl);
    } else {
      localStorage.removeItem("family_logo_url");
    }

    console.log("✅ Logo URL synced across devices");
  } catch (error) {
    console.error("❌ Failed to sync logo URL:", error);

    // Fallback to localStorage only
    if (logoUrl !== "/placeholder.svg") {
      localStorage.setItem("family_logo_url", logoUrl);
    } else {
      localStorage.removeItem("family_logo_url");
    }
  }
}

/**
 * Subscribe to app settings changes for real-time sync
 */
export function subscribeToAppSettings(
  callback: (settings: AppSettings) => void,
): () => void {
  console.log("🔄 Setting up real-time app settings sync...");

  const subscription = supabase
    .channel("app_settings_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_settings",
      },
      (payload) => {
        console.log("🔄 App settings changed:", payload);

        if (payload.new) {
          // Update localStorage cache
          localStorage.setItem("app_settings", JSON.stringify(payload.new));

          // Update legacy logo cache
          if (
            payload.new.logo_url &&
            payload.new.logo_url !== "/placeholder.svg"
          ) {
            localStorage.setItem("family_logo_url", payload.new.logo_url);
          } else {
            localStorage.removeItem("family_logo_url");
          }

          callback(payload.new as AppSettings);
        }
      },
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Get current logo URL from cache or defaults
 */
export function getCurrentLogoUrl(): string {
  const legacyLogo = localStorage.getItem("family_logo_url");
  if (legacyLogo && legacyLogo !== "/placeholder.svg") {
    return legacyLogo;
  }

  const cached = localStorage.getItem("app_settings");
  if (cached) {
    const settings = JSON.parse(cached);
    return settings.logo_url || DEFAULT_SETTINGS.logo_url;
  }

  return DEFAULT_SETTINGS.logo_url;
}
