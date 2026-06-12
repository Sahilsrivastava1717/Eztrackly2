"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Shared initial mock data ─────────────────────────────────────────────────
const INITIAL_TASKS = [
  {
    id: "1",
    title: "create dashboard page",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: new Date(new Date().setHours(23, 59, 0, 0)).toISOString(),
    created_at: new Date().toISOString(),
    assigned_to: "self",
    assigned_by: "self",
    completed_at: null,
    completion_remarks: null,
    category: null,
  },
  {
    id: "2",
    title: "update the cards and add sign in button with design in landing page",
    description: "",
    status: "done",
    priority: "medium",
    due_date: null,
    completed_at: "2025-06-05T17:01:00.000Z",
    created_at: "2025-06-05T10:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
  {
    id: "3",
    title: "create admin login page",
    description: "",
    status: "done",
    priority: "medium",
    due_date: null,
    completed_at: "2025-06-05T17:01:00.000Z",
    created_at: "2025-06-05T09:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
  {
    id: "4",
    title: "create login page",
    description: "",
    status: "done",
    priority: "medium",
    due_date: null,
    completed_at: "2025-06-05T17:01:00.000Z",
    created_at: "2025-06-05T08:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
  {
    id: "5",
    title: "setup project structure",
    description: "",
    status: "done",
    priority: "high",
    due_date: null,
    completed_at: "2025-06-04T15:00:00.000Z",
    created_at: "2025-06-04T09:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: "Scaffolded with Next.js + Tailwind.",
    category: null,
  },
  {
    id: "6",
    title: "implement auth middleware",
    description: "",
    status: "done",
    priority: "high",
    due_date: null,
    completed_at: "2025-06-04T16:00:00.000Z",
    created_at: "2025-06-04T10:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
  {
    id: "7",
    title: "design system setup",
    description: "",
    status: "done",
    priority: "medium",
    due_date: null,
    completed_at: "2025-06-03T14:00:00.000Z",
    created_at: "2025-06-03T09:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
  {
    id: "8",
    title: "database schema migration",
    description: "",
    status: "done",
    priority: "high",
    due_date: null,
    completed_at: "2025-06-02T12:00:00.000Z",
    created_at: "2025-06-02T09:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
  {
    id: "9",
    title: "API routes for users",
    description: "",
    status: "done",
    priority: "medium",
    due_date: null,
    completed_at: "2025-06-01T17:00:00.000Z",
    created_at: "2025-06-01T09:00:00.000Z",
    assigned_to: "self",
    assigned_by: "self",
    completion_remarks: null,
    category: null,
  },
];

const STORAGE_KEY = "ezsignly_tasks";

function loadFromStorage() {
  if (typeof window === "undefined") return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_TASKS;
}

function saveToStorage(tasks) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────
const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
   setTasks(loadFromStorage());
   setLoaded(true);
  }, []);

  // Persist every change
  useEffect(() => { saveToStorage(tasks); }, [tasks]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setTasks(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addTask = useCallback((payload) => {
    const newTask = {
      id: Date.now().toString(),
      status: "pending",
      assigned_to: "self",
      assigned_by: "self",
      completed_at: null,
      completion_remarks: null,
      category: null,
      created_at: new Date().toISOString(),
      ...payload,
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markDone = useCallback((id, remarks = "") => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "done", completed_at: new Date().toISOString(), completion_remarks: remarks || null }
          : t
      )
    );
  }, []);

  const setStatus = useCallback((id, status) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, completed_at: status === "done" ? new Date().toISOString() : null }
          : t
      )
    );
  }, []);

  return (
    <TaskContext.Provider value={{ tasks,loaded, addTask, updateTask, deleteTask, markDone, setStatus }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("try");
  return ctx;
}

// ─── Shared helpers (used by both pages) ─────────────────────────────────────
export function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function isOverdue(t) {
  return t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date() && !isToday(t.due_date);
}

export function isUpcoming(t) {
  return t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) > new Date() && !isToday(t.due_date);
}

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
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high: "bg-amber-50 text-amber-600 border-amber-200",
  urgent: "bg-red-50 text-red-600 border-red-200",
};

export const STATUS_META = {
  pending: { label: "Pending", color: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "In progress", color: "bg-blue-50 text-blue-600 border-blue-200" },
  done: { label: "Done", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200" },
};