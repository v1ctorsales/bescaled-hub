import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

// ---------------------------------------------------------------------------
// The real session: { role: "admin" | "company", name, email, avatar,
// companyId }, held by the backend in an httpOnly cookie. On load we ask
// GET /api/auth/me whether a valid session already exists; `loading` is true
// until that answers, so route guards don't bounce a logged-in user to /login.
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authService
      .getSession()
      .then((session) => {
        if (!cancelled) setUser(session);
      })
      .catch(() => {
        // Backend unreachable: treat as logged out; Login will surface errors on attempt.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Throws if the backend rejects the credential (e.g. 403 "not authorized").
  async function loginWithGoogle(credential) {
    const session = await authService.loginWithGoogle(credential);
    setUser(session);
    return session;
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
