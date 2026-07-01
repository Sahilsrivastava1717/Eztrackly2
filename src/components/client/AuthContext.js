"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AuthContext = createContext(null);

function setToken(token) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: token }));
}

function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  // Clear the 10-hour session timer so the auto-logout hook resets correctly
  localStorage.removeItem("auth_login_time");
  window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
}

// Try to refresh the access token silently
async function tryRefresh() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setToken(data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) {
          const newToken = await tryRefresh();
          if (!newToken) { clearToken(); return null; }
          const r2 = await fetch(`${API_BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          return r2.ok ? r2.json() : null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data) setUser(data); else clearToken(); })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // Auto-refresh token every 25 minutes (before 30 min expiry)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const newToken = await tryRefresh();
      if (!newToken) {
        clearToken();
        setUser(null);
        router.push("/auth");
      }
    }, 25 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    setToken(data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    // Stamp the login time so the 10-hour auto-logout timer starts from here
    localStorage.setItem("auth_login_time", Date.now().toString());
    setUser(data.user);
    router.push("/dashboard");
  };

  const register = async (username, email, password, full_name) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, full_name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    setToken(data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    // Stamp the login time so the 10-hour auto-logout timer starts from here
    localStorage.setItem("auth_login_time", Date.now().toString());
    setUser(data.user);
    router.push("/dashboard");
  };

  const logout = () => {
    clearToken(); // also removes auth_login_time
    setUser(null);
    router.push("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, tryRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}