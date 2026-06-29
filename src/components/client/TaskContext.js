"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setTasks([]);       // ← clear tasks if no token
      setLoaded(true);
      return;
    }
    setLoaded(false);
    apiFetch("/api/v1/tasks")
      .then((data) => {
        setTasks(Array.isArray(data) ? data : data.tasks ?? []);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err);
        setLoaded(true);
      });
  }, []);

  // Load on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Re-load when token changes (login/logout/switch account)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token") {
        setTasks([]);   // clear immediately on token change
        loadTasks();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadTasks]);

  const addTask = useCallback(async (payload) => {
    const newTask = await apiFetch("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback(async (id, patch) => {
    const updated = await apiFetch(`/api/v1/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id) => {
    await apiFetch(`/api/v1/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markDone = useCallback(async (id, remarks = "") => {
    const updated = await apiFetch(`/api/v1/tasks/${id}/mark-done`, {
      method: "POST",
      body: JSON.stringify({ completion_remarks: remarks || null }),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const setStatus = useCallback(async (id, status) => {
    const updated = await apiFetch(`/api/v1/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, loaded, error, addTask, updateTask, deleteTask, markDone, setStatus, loadTasks }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used inside TaskProvider");
  return ctx;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
export function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export const isOverdue  = (t) => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date() && !isToday(t.due_date);
export const isUpcoming = (t) => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) > new Date() && !isToday(t.due_date);

export function friendlyDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export function dueLabel(iso, status) {
  if (!iso || status === "done" || status === "cancelled") return { label: "", tone: "muted" };
  const diff = new Date(iso) - new Date();
  const days = Math.floor(diff / 86400000);
  if (diff < 0) return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`, tone: "danger" };
  if (isToday(iso)) return { label: "Due today", tone: "warning" };
  if (days === 1) return { label: "Due tomorrow", tone: "warning" };
  return { label: `Due in ${days} days`, tone: "normal" };
}

export const PRIO_COLORS = {
  low:    "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50   text-blue-600  border-blue-200",
  high:   "bg-amber-50  text-amber-600 border-amber-200",
  urgent: "bg-red-50    text-red-600   border-red-200",
};

export const STATUS_META = {
  pending:     { label: "Pending",     color: "bg-slate-100  text-slate-600  border-slate-200" },
  in_progress: { label: "In progress", color: "bg-blue-50    text-blue-600   border-blue-200"  },
  done:        { label: "Done",        color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  cancelled:   { label: "Cancelled",   color: "bg-gray-100   text-gray-500   border-gray-200"  },
};