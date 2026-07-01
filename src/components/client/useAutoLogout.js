"use client";

/**
 * useAutoLogout
 *
 * Automatically signs the user out after SESSION_DURATION_MS (10 hours)
 * from their login time. Shows a dismissible warning banner 10 minutes
 * before the deadline.
 *
 * Usage:
 *   1. When the user logs in, store the timestamp:
 *        localStorage.setItem("auth_login_time", Date.now().toString());
 *   2. When the user manually logs out, clear it:
 *        localStorage.removeItem("auth_login_time");
 *   3. Call this hook once inside AppLayout (or any always-mounted component):
 *        useAutoLogout(logout);
 */

import { useEffect, useRef, useState, useCallback } from "react";

const SESSION_DURATION_MS = 10 * 60 * 60 * 1000;  // 10 hours
const WARN_BEFORE_MS      =      10 * 60 * 1000;   // warn 10 min before expiry
const CHECK_INTERVAL_MS   =           60 * 1000;   // check every 60 s

/**
 * @param {() => void} logout  — the logout function from useAuth()
 * @returns {{ showWarning: boolean, minutesLeft: number, dismiss: () => void }}
 */
export function useAutoLogout(logout) {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft]  = useState(10);
  const dismissedRef   = useRef(false);
  const loggedOutRef   = useRef(false);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setShowWarning(false);
  }, []);

  useEffect(() => {
    const check = () => {
      const raw = typeof window !== "undefined"
        ? localStorage.getItem("auth_login_time")
        : null;
      if (!raw) return;

      const loginTime = parseInt(raw, 10);
      if (isNaN(loginTime)) return;

      const elapsed    = Date.now() - loginTime;
      const remaining  = SESSION_DURATION_MS - elapsed;

      // ── Auto-logout ──────────────────────────────────────────────────────
      if (remaining <= 0 && !loggedOutRef.current) {
        loggedOutRef.current = true;
        setShowWarning(false);
        localStorage.removeItem("auth_login_time");
        logout();
        return;
      }

      // ── Warning banner ───────────────────────────────────────────────────
      if (remaining <= WARN_BEFORE_MS && !dismissedRef.current && !loggedOutRef.current) {
        setMinutesLeft(Math.max(1, Math.ceil(remaining / 60_000)));
        setShowWarning(true);
      } else if (remaining > WARN_BEFORE_MS) {
        // Reset warn state if user re-logged-in (new login_time)
        dismissedRef.current = false;
        setShowWarning(false);
      }
    };

    check(); // run immediately on mount
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [logout]);

  return { showWarning, minutesLeft, dismiss };
}