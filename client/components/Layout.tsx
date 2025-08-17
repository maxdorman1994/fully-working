import React, { useState, useEffect, useRef } from "react";
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Edit, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthFooter from "./AuthFooter";
import PWAInstaller from "./PWAInstaller";
import SyncStatus from "./SyncStatus";
import RefreshHelper from "./RefreshHelper";
import { useAuth } from "@/hooks/useAuth";
import { useSync } from "@/lib/syncService";
import {
  loadAppSettings,
  updateLogoUrl,
  subscribeToAppSettings,
  getCurrentLogoUrl,
} from "@/lib/appSettingsService";
import {
  processPhoto,
  uploadPhotoToCloudflare,
  validatePhotoFile,
} from "@/lib/photoUtils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/placeholder.svg");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const location = useLocation();
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const { initializeSync } = useSync();

  // Load stored logo URL from localStorage on component mount
  useEffect(() => {
    // Load app settings including logo from database
    const loadSettings = async () => {
      try {
        const settings = await loadAppSettings();
        console.log("🔄 Loading app settings:", settings);
        setLogoUrl(settings.logo_url);
      } catch (error) {
        console.error("Failed to load app settings:", error);
        // Fallback to localStorage
        const storedLogoUrl = getCurrentLogoUrl();
        setLogoUrl(storedLogoUrl);
      }
    };

    loadSettings();

    // Initialize cross-device sync
    initializeSync().catch((error) => {
      console.error("Failed to initialize sync:", error);
    });

    // Subscribe to real-time app settings changes
    const unsubscribeSettings = subscribeToAppSettings((settings) => {
      console.log("🔄 App settings synced from another device:", settings);
      setLogoUrl(settings.logo_url);
    });

    return unsubscribeSettings;
  }, [initializeSync]);

  // Save logo URL and sync across devices
  const updateLogoUrlLocal = async (newUrl: string) => {
    setLogoUrl(newUrl);

    // Sync logo URL to database for cross-device sync
    try {
      await updateLogoUrl(newUrl);
      console.log("💾 Logo URL synced across all devices:", newUrl);
    } catch (error) {
      console.error("Failed to sync logo URL:", error);
      // Fallback to localStorage only
      if (newUrl !== "/placeholder.svg") {
        localStorage.setItem("family_logo_url", newUrl);
      } else {
        localStorage.removeItem("family_logo_url");
      }
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Journal", href: "/journal" },
    { name: "Munro Bagging", href: "/munro-bagging" },
    { name: "Adventures", href: "/castles-lochs" },
    { name: "Gallery", href: "/gallery" },
    { name: "Map", href: "/map" },
    { name: "Milestones", href: "/milestones" },
    { name: "Hints & Tips", href: "/hints-tips" },
    { name: "Wishlist", href: "/wishlist" },
  ];

  const isActivePage = (href: string) => {
    if (href === "/" && location.pathname === "/") return true;
    if (href !== "/" && location.pathname.startsWith(href)) return true;
    return false;
  };

  const handleLogoEdit = () => {
    if (!isAuthenticated) {
      return;
    }
    logoFileInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      alert(`Invalid file: ${validation.error}`);
      return;
    }

    setIsUploadingLogo(true);

    try {
      console.log(`📸 Processing and uploading new logo: ${file.name}`);

      // Process the photo (compress, etc.)
      const processedPhoto = await processPhoto(file);

      // Upload to Cloudflare
      const cloudflareUrl = await uploadPhotoToCloudflare(processedPhoto);

      // Update logo URL with cross-device sync
      await updateLogoUrlLocal(cloudflareUrl);
      console.log("✅ Logo updated successfully:", cloudflareUrl);
    } catch (error) {
      console.error("❌ Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
      // Reset input value to allow selecting the same file again
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-vibrant-pink/15 via-scotland-thistle/10 to-vibrant-blue/25">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-vibrant-blue to-scotland-loch overflow-hidden border-2 border-white shadow-lg relative group ${isAuthenticated ? "cursor-pointer" : ""}`}
                onClick={
                  isAuthenticated
                    ? (e) => {
                        e.preventDefault();
                        handleLogoEdit();
                      }
                    : undefined
                }
              >
                <img
                  src={logoUrl}
                  alt="Family Adventure Logo"
                  className="w-full h-full object-cover"
                />

                {/* Edit overlay for authenticated users */}
                {isAuthenticated && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingLogo ? (
                      <Upload className="h-4 w-4 text-white animate-spin" />
                    ) : logoUrl !== "/placeholder.svg" ? (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLogoEdit();
                          }}
                          className="p-1 hover:bg-white/20 rounded"
                          title="Change logo"
                        >
                          <Edit className="h-3 w-3 text-white" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await updateLogoUrlLocal("/placeholder.svg");
                          }}
                          className="p-1 hover:bg-white/20 rounded"
                          title="Reset to default"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <Edit className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-vibrant-blue via-scotland-loch to-vibrant-teal bg-clip-text text-transparent">
                A Wee Adventure
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActivePage(item.href)
                      ? "text-vibrant-blue bg-scotland-thistle/20 shadow-sm"
                      : "text-gray-700 dark:text-gray-200 hover:text-vibrant-blue hover:bg-scotland-thistle/10"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Sync Status, PWA, Theme Toggle & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <SyncStatus />
              <PWAInstaller />

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4">
              <nav className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 touch-manipulation ${
                      isActivePage(item.href)
                        ? "text-vibrant-blue bg-scotland-thistle/20 shadow-sm"
                        : "text-gray-700 dark:text-gray-200 hover:text-vibrant-blue hover:bg-scotland-thistle/10 active:bg-scotland-thistle/20"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">{children}</main>

      {/* Refresh Helper for debugging cache issues */}
      <RefreshHelper />

      {/* Authentication Footer */}
      <AuthFooter />

      {/* PWA Install Prompt */}
      <PWAInstaller />

      {/* Hidden file input for logo upload */}
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />
    </div>
  );
}
