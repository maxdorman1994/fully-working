import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Shield,
  Clock,
  User,
  LogOut,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthFooter() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, sessionTimeRemaining, authenticate, logout } =
    useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = authenticate(password);

      if (success) {
        setPassword("");
        setError("");
        setIsExpanded(false);

        // Brief delay then refresh to ensure UI updates properly after authentication
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setPassword("");
    setError("");
    setIsExpanded(false);
  };

  return (
    <footer className="sticky bottom-0 z-50 backdrop-blur-md bg-white/95 dark:bg-gray-900/95 border-t border-border/50 shadow-lg safe-bottom">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Main Footer Bar */}
        <div className="flex items-center justify-between py-2 sm:py-3">
          {/* Left Side - Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm ${
                isAuthenticated
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-orange-50 border border-orange-200 text-orange-700"
              }`}
            >
              {isAuthenticated ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span className="font-medium">Edit Mode</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    <Clock className="w-3 h-3 mr-1" />
                    {sessionTimeRemaining}m
                  </Badge>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">View Only</span>
                </>
              )}
            </div>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-8 px-3 text-xs"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Lock
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-3 text-xs"
              >
                <Shield className="w-3 h-3 mr-1" />
                Family Login
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronUp className="w-3 h-3 ml-1" />
                )}
              </Button>
            )}
          </div>

          {/* Right Side - App Info */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>A Wee Adventure</span>
            <span>•</span>
            <span>Family Adventures</span>
          </div>
        </div>

        {/* Expanded Login Form */}
        {isExpanded && !isAuthenticated && (
          <div className="border-t border-border/50 pt-4 pb-4">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-sm">
                  Family Access Required
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the family password to edit content, add photos, create
                  journal entries, and mark Munros complete.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter family password"
                    className="pr-10 text-sm"
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                    className="flex-1 h-8 text-xs"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-8 text-xs"
                    disabled={isLoading || !password.trim()}
                  >
                    {isLoading ? "Checking..." : "Unlock"}
                  </Button>
                </div>
              </form>

              <div className="text-center text-xs text-muted-foreground mt-3">
                Access will remain active for 24 hours
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
