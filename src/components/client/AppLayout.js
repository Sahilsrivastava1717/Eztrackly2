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
  { label: "My Documents", href: "/Documents", icon: (
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
  "/Chat", "/Documents", "/meetings", "/documents", "/leaves",
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

// ─── Logout Confirmation Modal ────────────────────────────────────────────────
function LogoutModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 18, padding: "28px 28px 22px 22px",
        width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        animation: "ez-modal-in 0.18s ease",
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
          Sign out of EzTrackly?
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "10px 0 24px", lineHeight: 1.55 }}>
          You'll be returned to the sign-in screen and any unsaved work may be lost.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 22px", borderRadius: 10, border: "1.5px solid #e5e7eb",
              background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151",
              cursor: "pointer", transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 22px", borderRadius: 10, border: "none",
              background: "#2563eb", fontSize: 14, fontWeight: 600, color: "#fff",
              cursor: "pointer", transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ collapsed, onToggle }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(null);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = mounted && time
    ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    : "--:--:--";
  const dateStr = mounted && time
    ? time.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
    : "";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", height: 52, width: "100%",
      alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid #e5e7eb", background: "#fff",
      padding: "0 16px", gap: 12, boxSizing: "border-box",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", overflow: "hidden",
        flexShrink: 0, transition: "width .3s",
        width: collapsed ? 48 : 232, minWidth: collapsed ? 48 : 232,
      }}>
        <Link href="/dashboard" style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px",
          whiteSpace: "nowrap", textDecoration: "none",
        }}>
          {collapsed
            ? <span style={{ color: "#2563eb" }}>Ez</span>
            : <><span style={{ color: "#111827" }}>Ez</span><span style={{ color: "#2563eb" }}>Trackly</span></>
          }
        </Link>
      </div>

      {/* Center-right */}
      <div style={{
        display: "flex", flex: 1, alignItems: "center",
        justifyContent: "space-between", paddingLeft: 8,
        minWidth: 0, gap: 8,
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={onToggle} title={collapsed ? "Expand" : "Collapse"} className="ez-nav-btn"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "transparent", color: "#6b7280", cursor: "pointer", flexShrink: 0 }}>
            <CollapseIcon collapsed={collapsed} />
          </button>
          <button className="ez-nav-btn" style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid #e5e7eb", padding: "5px 10px", fontSize: 13, fontWeight: 700, color: "#374151", background: "transparent", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            My Activity
          </button>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            EzSignly
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, background: "#10b981", fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Lv 5 · Achiever
          </div>
          <div style={{ display: "flex", alignItems: "center", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", padding: "4px 8px", gap: 6, whiteSpace: "nowrap" }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>In since 9:24 AM</span>
            <button className="ez-nav-btn" style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 999, border: "1px solid #d1d5db", background: "#fff", padding: "3px 10px", fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Out
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <div style={{ fontWeight: 600, lineHeight: 1, fontSize: 13 }}>{timeStr}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{dateStr} · Asia/Calcutta</div>
            </div>
          </div>
          <button className="ez-nav-btn" style={{ position: "relative", width: 34, height: 34, borderRadius: "50%", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 999, padding: "0 4px", lineHeight: "14px", minWidth: 14, textAlign: "center" }}>1</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onLogoutClick }) {
  const pathname = usePathname();

  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      height: "100%", flexShrink: 0,
      borderRight: "1px solid #e5e7eb", background: "#fff",
      transition: "width .3s", overflow: "hidden",
      width: collapsed ? 48 : 250,
    }}>
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 6px" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={active ? "ez-sidebar-link ez-sidebar-active" : "ez-sidebar-link"}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: "none",
                ...(collapsed
                  ? { justifyContent: "center", padding: "10px 0" }
                  : { gap: 10, padding: "9px 12px" }),
                ...(active
                  ? { background: "#dbeafe", color: "#1d4ed8" }
                  : { color: "#374151" }),
              }}
            >
              {active && !collapsed && (
                <span style={{
                  position: "absolute", left: 0, top: 6, bottom: 6,
                  width: 3, borderRadius: "0 3px 3px 0", background: "#2563eb",
                }}/>
              )}
              <span style={{ color: active ? "#2563eb" : "#6b7280", flexShrink: 0, display: "flex" }}>
                {item.icon}
              </span>
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
              <div style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                S
                <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }}/>
              </div>
            </div>
            <button
              onClick={onLogoutClick}
              className="ez-logout-btn"
              style={{ width: "100%", display: "flex", justifyContent: "center", padding: "6px 0", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280", marginTop: 4 }}
              title="Logout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
              <div style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                S
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>Sahil</div>
                <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.2 }}>Developer</div>
              </div>
            </div>
            <button
              onClick={onLogoutClick}
              className="ez-logout-btn"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, border: "1px solid transparent", background: "transparent", cursor: "pointer", fontSize: 13, color: "#374151", marginTop: 2 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogoutConfirm = () => {
    setLogoutOpen(false);
    // Add your actual logout logic here, e.g. signOut() or router.push("/login")
    console.log("User signed out");
  };

  return (
    <>
      <style>{`
        @keyframes ez-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Navbar buttons ── */
        .ez-nav-btn {
          transition: background .15s, color .15s, border-color .15s, transform .15s !important;
        }
        .ez-nav-btn:hover {
          background: rgba(37,99,235,0.08) !important;
          color: #2563eb !important;
          border-color: rgba(37,99,235,0.25) !important;
          transform: translateY(-1px);
        }

        /* ── Sidebar nav links ── */
        .ez-sidebar-link {
          transition: background .15s, color .15s, transform .15s, box-shadow .15s !important;
        }
        .ez-sidebar-link:not(.ez-sidebar-active):hover {
          background: #dbeafe !important;
          color: #1d4ed8 !important;
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 2px 8px rgba(37,99,235,0.10);
        }
        .ez-sidebar-link:not(.ez-sidebar-active):hover span {
          color: #2563eb !important;
        }
        .ez-sidebar-active {
          background: #dbeafe !important;
          border: 1px solid #bfdbfe !important;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
        }
        .ez-sidebar-active:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(37,99,235,0.13);
        }

        /* ── Logout button ── */
        .ez-logout-btn {
        background: #2563eb;
        color: white;
        border: 1px solid transparent;
        border-radius: 10px;
        transition: all 0.2s ease;
      }
        .ez-logout-btn:hover {
          background: #dbeafe !important; /* same as first image */
          color: #2563eb !important;      /* blue text */
          border-color: #bfdbfe !important;
          border-radius: 10px !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
        }
        .ez-logout-btn:hover svg {
          stroke: blue !important;
        }

        /* ── Scrollbar ── */
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      {/* Logout Modal */}
      <LogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      <div style={{
        display: "flex", height: "100vh", flexDirection: "column",
        overflow: "hidden", background: "#f3f4f6",
      }}>
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar collapsed={collapsed} onLogoutClick={() => setLogoutOpen(true)} />
          <main style={{
            flex: 1, overflowY: "auto",
            background: "linear-gradient(90deg, #ffffff 0%, #f0f9ff 50%, #ffffff 100%)",
          }}>
            <div style={{ padding: "22px 26px" }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AppLayout({ children }) {
  const pathname = usePathname();
  if (!isAppRoute(pathname)) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}