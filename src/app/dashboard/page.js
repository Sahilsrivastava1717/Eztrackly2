"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTasks, isToday, isOverdue, PRIO_COLORS, STATUS_META, friendlyDate } from "../../components/client/TaskContext";
import { useAuth } from "../../components/client/AuthContext";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";
import ProtectedRoute from "../../components/client/ProtectedRoute";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function cn(...classes) { return classes.filter(Boolean).join(" "); }

function Badge({ children, className = "" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

function StatCard({ label, value, gradient, icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200">
      <div className={cn(
        "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        gradient
      )} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</span>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
          gradient
        )}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-4xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function DashboardContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { tasks } = useTasks();
  const { user } = useAuth();

  // ---------------- USER STATUS ----------------

  const [userStatus, setUserStatus] = useState("online");
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Change these according to your attendance API
  const isCheckedIn = true;
  const isOnLeave = false;

  useEffect(() => {
    if (!isCheckedIn || isOnLeave) {
      setUserStatus("offline");
      return;
    }

    const updateActivity = () => {
      setLastActivity(Date.now());

      if (document.visibilityState === "visible") {
        setUserStatus("online");
      }
    };

    const checkStatus = () => {
      if (!isCheckedIn || isOnLeave) {
        setUserStatus("offline");
        return;
      }

      if (document.visibilityState === "hidden") {
        setUserStatus("away");
        return;
      }

      const diff = Date.now() - lastActivity;

      // 30 minutes
      if (diff >= 30 * 60 * 1000 && diff < 2 * 60 * 60 * 1000) {
        setUserStatus("away");
      }

      // 2 hours
      else if (diff >= 2 * 60 * 60 * 1000) {
        setUserStatus("inactive");
      }

      else {
        setUserStatus("online");
      }
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("mousedown", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("scroll", updateActivity);
    window.addEventListener("touchstart", updateActivity);
    window.addEventListener("focus", updateActivity);
    document.addEventListener("visibilitychange", updateActivity);

    const timer = setInterval(checkStatus, 10000);

    return () => {
      clearInterval(timer);

      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("mousedown", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      window.removeEventListener("focus", updateActivity);
      document.removeEventListener("visibilitychange", updateActivity);
    };
  }, [lastActivity, isCheckedIn, isOnLeave]);

  const STATUS_CONFIG = {
    online: {
      text: "Online",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
      dotClass: "bg-emerald-500 animate-pulse",
    },

    away: {
      text: "Away",
      textClass: "text-yellow-600",
      bgClass: "bg-yellow-50",
      borderClass: "border-yellow-200",
      dotClass: "bg-yellow-500",
    },

    inactive: {
      text: "Inactive",
      textClass: "text-red-600",
      bgClass: "bg-red-50",
      borderClass: "border-red-200",
      dotClass: "bg-red-500",
    },

    offline: {
      text: "Offline",
      textClass: "text-black",
      bgClass: "bg-gray-100",
      borderClass: "border-gray-300",
      dotClass: "bg-gray-700",
    },
  };

  const status = STATUS_CONFIG[userStatus];

  // Use all tasks (they're already filtered by user on the backend)
  const myTasks = tasks;

  const total = myTasks.length;
  const pending = myTasks.filter((t) => t.status === "pending").length;
  const inProgress = myTasks.filter((t) => t.status === "in_progress").length;
  const completed = myTasks.filter((t) => t.status === "done").length;
  const backlog = myTasks.filter((t) => isOverdue(t)).length;

  const now = new Date();
  const dueToday = myTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && isToday(t.due_date)
  );


  const upcoming = myTasks
    .filter((t) => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) > now && !isToday(t.due_date))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  const recentDone = myTasks.filter((t) => t.status === "done").slice(0, 5);

  // Display name from auth
  // Display name from auth
  const rawName = user?.full_name?.split(" ")[0] || user?.username || "there";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const statCards = [
    {
      label: "Total Assigned", value: total,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    },
    {
      label: "Pending", value: pending,
      gradient: "bg-gradient-to-br from-slate-500 to-slate-600",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
      label: "In Progress", value: inProgress,
      gradient: "bg-gradient-to-br from-blue-400 to-cyan-500",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    },
    {
      label: "Completed", value: completed,
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    },
    {
      label: "Backlog (Overdue)", value: backlog,
      gradient: "bg-gradient-to-br from-orange-500 to-red-500",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="mx-auto max-w-7xl space-y-5 px-3 py-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Developer Workspace
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-gray-900">
              {greet()},{" "}
              <span className="text-blue-500">{displayName}</span>
              <span>👋</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.borderClass} ${status.bgClass} ${status.textClass}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${status.dotClass}`}
                />
                {status.text}
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {dueToday.length > 0
                ? `You have ${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today.`
                : "No tasks due today."}
              {backlog > 0 && (
                <span className="ml-2 font-medium text-red-500">{backlog} in backlog.</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/myTasks"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 hover:-translate-y-0.5 whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Open my tasks
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Due today + Upcoming ── */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h3 className="font-semibold text-gray-900">Due today</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {dueToday.length}
                </span>
              </div>
              <Link href="/myTasks" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
                View all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {dueToday.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-gray-400">Nothing due today. 🎯</div>
              )}
              {dueToday.map((t) => (
                <div key={t.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-gray-900">{t.title}</span>
                    <Badge className={cn("capitalize", PRIO_COLORS[t.priority])}>
                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </Badge>
                    <Badge className={STATUS_META[t.status]?.color}>
                      {STATUS_META[t.status]?.label}
                    </Badge>
                  </div>
                  {t.due_date && (
                    <p className="mt-0.5 text-xs text-gray-400">Due {formatTime(t.due_date)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 className="font-semibold text-gray-900">Upcoming</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {upcoming.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {upcoming.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-gray-400">No upcoming tasks scheduled.</div>
              )}
              {upcoming.map((t) => (
                <div key={t.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-gray-900">{t.title}</span>
                    <Badge className={cn("capitalize", PRIO_COLORS[t.priority])}>
                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </Badge>
                  </div>
                  {t.due_date && (
                    <p className="mt-0.5 text-xs text-gray-400">Due {formatDate(t.due_date)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recently completed ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h3 className="font-semibold text-gray-900">Recently completed</h3>
            </div>
            <Link href="/myTasks" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
              History
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDone.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No completed tasks yet.</div>
            )}
            {recentDone.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-400 line-through">{t.title}</p>
                  {t.completed_at && (
                    <p className="mt-0.5 text-xs text-gray-400">Done {friendlyDate(t.completed_at)}</p>
                  )}
                </div>
                <Badge className={cn("ml-4 capitalize", PRIO_COLORS[t.priority])}>
                  {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
        title="Add a quick task"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default function DeveloperDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}