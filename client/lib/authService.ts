// Simple password-based authentication for family editing access
const FAMILY_PASSWORD = "Summer07max";
const AUTH_KEY = "family_auth_token";
const AUTH_EXPIRY_KEY = "family_auth_expiry";

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem(AUTH_KEY);
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);

  if (!token || !expiry) {
    return false;
  }

  const expiryTime = parseInt(expiry);
  const now = Date.now();

  if (now > expiryTime) {
    // Session expired, clear storage
    logout();
    return false;
  }

  return token === "authenticated";
}

/**
 * Authenticate with family password
 */
export function authenticate(password: string): boolean {
  if (password === FAMILY_PASSWORD) {
    const expiry = Date.now() + SESSION_DURATION;
    localStorage.setItem(AUTH_KEY, "authenticated");
    localStorage.setItem(AUTH_EXPIRY_KEY, expiry.toString());
    return true;
  }
  return false;
}

/**
 * Logout and clear session
 */
export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
}

/**
 * Get remaining session time in minutes
 */
export function getSessionTimeRemaining(): number {
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (!expiry) return 0;

  const expiryTime = parseInt(expiry);
  const now = Date.now();
  const remaining = expiryTime - now;

  return Math.max(0, Math.floor(remaining / (60 * 1000)));
}

/**
 * Extend current session
 */
export function extendSession(): void {
  if (isAuthenticated()) {
    const expiry = Date.now() + SESSION_DURATION;
    localStorage.setItem(AUTH_EXPIRY_KEY, expiry.toString());
  }
}
