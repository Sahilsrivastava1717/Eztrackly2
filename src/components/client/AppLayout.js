"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { label: "My Tasks", href: "/myTasks", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )},
  { label: "Content", href: "/content", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
  { label: "Personal Notes", href: "/PersonalNotes", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )},
  { label: "XP & Leaderboard", href: "/xp", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )},
  { label: "Chat", href: "/Chat", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { label: "My Documents", href: "/documents/my", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { label: "Meetings", href: "/meetings", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  )},
  { label: "Documents", href: "/documents", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  )},
  { label: "Leaves & Holidays", href: "/leaves", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 3H3v18h18V3z"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )},
  { label: "My Attendance", href: "/attendance", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { label: "My Profile", href: "/profile", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { label: "My Onboarding", href: "/onboarding", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )},
];

const APP_ROUTES = [
  "/dashboard", "/myTasks", "/content", "/PersonalNotes", "/xp",
  "/Chat", "/documents", "/meetings", "/leaves",
  "/attendance", "/profile", "/onboarding",
];

function isAppRoute(pathname) {
  if (!pathname) return false;
  return APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function CollapseIcon({ collapsed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {collapsed ? (
        <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>
      ) : (
        <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>
      )}
    </svg>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
  
function Navbar({ collapsed, onToggle }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(null);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());

    const id = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const timeStr =
    mounted && time
      ? time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      : "--:--:--";

  const dateStr =
    mounted && time
      ? time.toLocaleDateString([], {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "";

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* LEFT: Logo — shrinks to just icon when collapsed */}
      <div
        className="flex shrink-0 items-center overflow-hidden transition-all duration-300"
        style={{ width: collapsed ? 52 : 248 }}
      >
        <Link href="/dashboard" className="text-[20px] font-bold tracking-tight whitespace-nowrap">
          {collapsed ? (
            <span className="text-blue-500">Ez</span>
          ) : (
            <>
              <span className="text-gray-900">Ez</span>
              <span className="text-blue-500">Trackly</span>
            </>
          )}
        </Link>
      </div>

      {/* RIGHT: navbar controls */}
      <div className="flex flex-1 items-center justify-between pl-2">
        {/* Collapse toggle + My Activity */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-200 hover:text-blue-700 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] font-bold text-gray-800 hover:bg-blue-100 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            My Activity
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[13px] font-bold text-gray-600">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            EzSignly
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-emerald-500 px-2.5 py-1.5 text-[10px] font-bold text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Lv 4 · Performer
          </div>
          <div className="group flex items-center rounded-xl border border-emerald-300 bg-emerald-50 px-2 py-0.5 transition-all duration-200 hover:border-green-400 hover:bg-green-100">
  
          {/* Check Icon */}
        <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-green-500 text-green-500 transition-colors group-hover:border-blue-500 group-hover:text-blue-600">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Time Text */}
        <span className="text-[13px] font-semibold text-green-600 transition-colors group-hover:text-blue-700">
          In since 9:24 AM
        </span>

        {/* Out Button */}
        <button className="ml-2 flex items-center gap-1 rounded-full border border-green-300 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400">
          <svg
            width="13"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Out
        </button>
        </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-700">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <div>
              <div className="font-semibold leading-none">{timeStr}</div>
              <div className="text-[10px] text-gray-500 leading-none mt-0.5">{dateStr} · Asia/Calcutta</div>
            </div>
          </div>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-900 hover:bg-blue-200 hover:text-blue-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">1</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ collapsed }) {
  const pathname = usePathname();

  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      height: "100%", flexShrink: 0,
      borderRight: "1px solid #e5e7eb", background: "#fff",
      transition: "width .3s", overflow: "hidden",
      width: collapsed ? 52 : 248
    }}>
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 6px" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: "none",
                transition: "all .15s",
                ...(collapsed
                  ? { justifyContent: "center", padding: "10px 0" }
                  : { gap: 10, padding: "9px 12px" }),
                ...(active
                  ? { background: "#eff6ff", color: "#1d4ed8" }
                  : { color: "#374151" }),
              }}
            >
              {/* Active indicator */}
              {active && !collapsed && (
                <span style={{
                  position: "absolute", left: 0, top: 6, bottom: 6,
                  width: 3, borderRadius: "0 3px 3px 0", background: "#2563eb"
                }}/>
              )}
              {/* Icon */}
              <span style={{ color: active ? "#2563eb" : "#6b7280", flexShrink: 0, display: "flex" }}>
                {item.icon}
              </span>
              {/* Label */}
              {!collapsed && (
                <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 450, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid #f3f4f6", padding: "8px 6px" }}>
        {collapsed ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
              <div style={{
                position: "relative", width: 32, height: 32, borderRadius: "50%",
                background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                S
                <span style={{
                  position: "absolute", bottom: -1, right: -1,
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#22c55e", border: "2px solid #fff"
                }}/>
              </div>
            </div>
            <button style={{
              width: "100%", display: "flex", justifyContent: "center",
              padding: "6px 0", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", color: "#6b7280", marginTop: 4
            }} title="Logout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 10
            }}>
              <div style={{
                position: "relative", width: 36, height: 36, borderRadius: "50%",
                background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                S
                <span style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 11, height: 11, borderRadius: "50%",
                  background: "#22c55e", border: "2px solid #fff"
                }}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>Sahil</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.2 }}>Developer</div>
              </div>
            </div>
            <button style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 10, border: "none",
              background: "transparent", cursor: "pointer",
              fontSize: 13, color: "#374151", marginTop: 2
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function AppShell({ children }) {
  // ← KEY FIX: default is false (expanded), not true (collapsed)
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar collapsed={collapsed} />
        <main style={{ flex: 1, overflowY: "auto", background: "#f3f5fb" }}>
          <div style={{ padding: "28px 32px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const pathname = usePathname();
  if (!isAppRoute(pathname)) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}