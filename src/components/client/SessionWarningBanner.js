"use client";

/**
 * SessionWarningBanner
 *
 * Displayed when the user has < 10 minutes left in their 10-hour session.
 * Place it at the top of AppLayout (inside the return, above everything else).
 *
 * Props:
 *   minutesLeft  — number, minutes remaining
 *   onDismiss    — () => void, hide the banner
 *   onLogout     — () => void, log out now
 */
export default function SessionWarningBanner({ minutesLeft, onDismiss, onLogout }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      background: "linear-gradient(90deg, #b45309, #d97706)",
      color: "#fff",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      fontSize: 14,
      fontWeight: 500,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Clock icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>
          Your session will automatically sign out in{" "}
          <strong>{minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}</strong>
          {" "}— your 10-hour session limit is almost up.
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          onClick={onLogout}
          style={{
            padding: "5px 14px",
            borderRadius: 7,
            border: "1.5px solid rgba(255,255,255,0.7)",
            background: "transparent",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign out now
        </button>
        <button
          onClick={onDismiss}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}