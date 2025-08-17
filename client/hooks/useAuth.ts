import { useState, useEffect, useCallback } from "react";
import {
  isAuthenticated,
  authenticate,
  logout,
  getSessionTimeRemaining,
} from "@/lib/authService";

export function useAuth() {
  const [isAuth, setIsAuth] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);

  // Check authentication status on mount and periodically
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setIsAuth(authStatus);
      setSessionTimeRemaining(getSessionTimeRemaining());
    };

    checkAuth();

    // Check every minute for session expiry
    const interval = setInterval(checkAuth, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleAuthenticate = useCallback((password: string): boolean => {
    const success = authenticate(password);
    if (success) {
      setIsAuth(true);
      setShowPasswordPrompt(false);
      setSessionTimeRemaining(getSessionTimeRemaining());
    }
    return success;
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsAuth(false);
    setSessionTimeRemaining(0);
  }, []);

  const requestAuth = useCallback(() => {
    if (isAuthenticated()) {
      return true;
    }
    setShowPasswordPrompt(true);
    return false;
  }, []);

  const cancelAuth = useCallback(() => {
    setShowPasswordPrompt(false);
  }, []);

  return {
    isAuthenticated: isAuth,
    showPasswordPrompt,
    sessionTimeRemaining,
    requestAuth,
    authenticate: handleAuthenticate,
    logout: handleLogout,
    cancelAuth,
  };
}
