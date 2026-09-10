import { createContext, useContext, useState } from "react";

// ---------------------------------------------------------------------------
// FAKE AUTH — no real OAuth call is ever made here.
// TODO(backend): swap `fakeGoogleLogin` for a real Google OAuth flow and
// persist the session (token, cookie, etc.) once a backend exists.
// ---------------------------------------------------------------------------

const FAKE_USER = {
  name: "Ana Silva",
  email: "ana@empresa.com",
  avatar: "https://ui-avatars.com/api/?name=Ana+Silva&background=2E5CFF&color=fff",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function fakeGoogleLogin() {
    setIsLoggingIn(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(FAKE_USER);
        setIsLoggingIn(false);
        resolve(FAKE_USER);
      }, 500);
    });
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggingIn, fakeGoogleLogin, logout }}>
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
