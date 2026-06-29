"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
  return res.json();
}

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Calcutta"
  });
}
function fmtDate(isoDay) {
  const d = new Date(isoDay + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function fmtDur(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h}h ${m}m`;
}
function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
}
function startOfWeek(d) {
  const x = new Date(d); x.setHours(0,0,0,0);
  x.setDate(x.getDate() - (x.getDay()+6)%7);
  return x;
}
function ymdFromDate(d) {
  const ist = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Calcutta" }));
  return `${ist.getFullYear()}-${String(ist.getMonth()+1).padStart(2,"0")}-${String(ist.getDate()).padStart(2,"0")}`;
}

// ── Camera Modal — fixed auto-capture bug ─────────────────────────────────────
function CameraModal({ open, type, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("loading"); // "loading" | "live" | "captured" | "error"
  const [captured, setCaptured] = useState(null);
  const [camError, setCamError] = useState("");
  const [liveTime, setLiveTime] = useState("");

  // Update live timestamp every second
  useEffect(() => {
    if (phase !== "live") return;
    const tick = () => setLiveTime(
      new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true, timeZone:"Asia/Calcutta" })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Start camera when modal opens
  useEffect(() => {
    if (!open) return;
    setPhase("loading");
    setCaptured(null);
    setCamError("");

    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Only set phase to "live" when video actually starts playing — NOT before
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => {
              if (!cancelled) setPhase("live");
            }).catch(() => {
              if (!cancelled) setPhase("live"); // still show it
            });
          };
        }
      })
      .catch(() => {
        if (!cancelled) { setCamError("Camera access denied. Please allow camera permission and try again."); setPhase("error"); }
      });

    return () => {
      cancelled = true;
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [open]);

  // Stop stream when modal closes
  useEffect(() => {
    if (!open && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const handleCapture = () => {
    // Must be in live phase with a valid video element
    if (phase !== "live" || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    // Mirror the image to match what user sees
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
    setPhase("captured");
    // Stop camera stream after capture
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const handleRetake = () => {
    setCaptured(null);
    setPhase("loading");
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => setPhase("live")).catch(() => setPhase("live"));
          };
        }
      })
      .catch(() => { setCamError("Camera error"); setPhase("error"); });
  };

  const handleConfirm = () => { if (captured) onCapture(captured); };

  const isIn = type === "checkin";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:460, boxShadow:"0 25px 60px rgba(0,0,0,0.35)" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background: isIn?"#dcfce7":"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isIn?"#16a34a":"#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"#111827" }}>
                {isIn ? "Check in with a live photo" : "Check out with a live photo"}
              </div>
              <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                Capture a quick selfie to confirm your {isIn?"check-in":"check-out"}.
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", border:"1.5px solid #e5e7eb", background:"#f9fafb", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#6b7280", flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Video/image area */}
        <div style={{ borderRadius:12, overflow:"hidden", background:"#111", aspectRatio:"4/3", position:"relative", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          {phase === "error" && (
            <div style={{ color:"#f87171", textAlign:"center", padding:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
              <div style={{ fontSize:13 }}>{camError}</div>
            </div>
          )}
          {phase === "loading" && (
            <div style={{ color:"#9ca3af", textAlign:"center" }}>
              <svg style={{ animation:"att-spin 1s linear infinite", display:"block", margin:"0 auto 8px" }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <div style={{ fontSize:13, color:"#9ca3af" }}>Starting camera…</div>
            </div>
          )}
          {/* Video — always rendered but hidden when not needed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width:"100%", height:"100%", objectFit:"cover",
              transform:"scaleX(-1)",
              display: phase === "live" ? "block" : "none",
            }}
          />
          {/* Captured image */}
          {phase === "captured" && captured && (
            <img src={captured} alt="captured" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          )}
          {/* Live timestamp */}
          {phase === "live" && liveTime && (
            <div style={{ position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,0.6)", borderRadius:6, padding:"3px 8px", fontSize:12, color:"#fff", fontWeight:600 }}>
              {liveTime}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display:"none" }} />

        {/* Action buttons */}
        {phase !== "captured" ? (
          <button
            onClick={handleCapture}
            disabled={phase !== "live"}
            style={{
              width:"100%", padding:"13px", borderRadius:10, border:"none",
              background: phase === "live" ? "#2563eb" : "#9ca3af",
              color:"#fff", fontSize:15, fontWeight:700,
              cursor: phase === "live" ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow: phase === "live" ? "0 4px 12px rgba(37,99,235,.35)" : "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            {phase === "loading" ? "Starting camera…" : "Capture photo"}
          </button>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleRetake} style={{ flex:1, padding:"13px", borderRadius:10, border:"1.5px solid #e5e7eb", background:"#f9fafb", fontSize:14, fontWeight:600, color:"#374151", cursor:"pointer" }}>
              Retake
            </button>
            <button onClick={handleConfirm} style={{ flex:2, padding:"13px", borderRadius:10, border:"none", background: isIn?"#16a34a":"#2563eb", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 4px 12px ${isIn?"rgba(22,163,74,.35)":"rgba(37,99,235,.35)"}` }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Confirm {isIn ? "Check In" : "Check Out"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Photo badge next to time (like ref image) ─────────────────────────────────
function PhotoBadge({ src, label }) {
  if (!src) return null;
  return (
    <div style={{ position:"relative", display:"inline-flex", flexShrink:0 }}>
      <img
        src={src}
        alt={label}
        onClick={() => window.open(src, "_blank")}
        style={{ width:34, height:34, borderRadius:8, objectFit:"cover", border:"2px solid #e5e7eb", cursor:"pointer", transition:"transform .15s" }}
        onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
        title={`${label} photo — click to enlarge`}
      />
      <span style={{ position:"absolute", bottom:-4, right:-4, background: label==="In"?"#16a34a":"#d97706", color:"#fff", fontSize:8, fontWeight:700, borderRadius:4, padding:"1px 3px", lineHeight:1.4, border:"1.5px solid #fff" }}>
        {label}
      </span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const TINTS = {
  emerald: { bg:"rgba(16,185,129,.12)", color:"#059669" },
  sky:     { bg:"rgba(14,165,233,.12)", color:"#0284c7" },
  violet:  { bg:"rgba(139,92,246,.12)", color:"#7c3aed" },
  orange:  { bg:"rgba(249,115,22,.12)", color:"#ea580c" },
  rose:    { bg:"rgba(244,63,94,.12)",  color:"#e11d48" },
};
function StatCard({ icon, label, value, tint }) {
  const t = TINTS[tint];
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", color:t.color, flexShrink:0 }}>
          {icon}
        </div>
        <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9ca3af" }}>{label}</span>
      </div>
      <div style={{ fontSize:24, fontWeight:700, color:"#111827" }}>{value}</div>
    </div>
  );
}

function Bdg({ children, color, bg, border }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:999, fontSize:12, fontWeight:500, color: color||"#374151", background: bg||"#f9fafb", border:`1px solid ${border||"#e5e7eb"}` }}>
      {children}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyAttendancePage() {
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [sessions, setSessions]       = useState([]);
  const [stats, setStats]             = useState(null);
  const [todayStatus, setTodayStatus] = useState({ active:false, session:null });
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab]                 = useState("daily");
  const [now, setNow]                 = useState(() => new Date());
  const [cursor, setCursor]           = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [toast, setToast]             = useState(null); // { msg, ok }
  const [cameraModal, setCameraModal] = useState(null); // "checkin"|"checkout"|null

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const monthLabel     = cursor.toLocaleDateString("en-IN", { month:"long", year:"numeric" });
  const isCurrentMonth = now.getFullYear()===cursor.getFullYear() && now.getMonth()===cursor.getMonth();

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sess, st, td] = await Promise.all([
        apiFetch(`/api/v1/attendance/sessions?year=${cursor.getFullYear()}&month=${cursor.getMonth()+1}`),
        apiFetch(`/api/v1/attendance/stats?year=${cursor.getFullYear()}&month=${cursor.getMonth()+1}`),
        isCurrentMonth ? apiFetch("/api/v1/attendance/today") : Promise.resolve({active:false,session:null}),
      ]);
      setSessions(Array.isArray(sess) ? sess : []);
      setStats(st);
      setTodayStatus(td || {active:false,session:null});
    } catch { showToast("Failed to load attendance data", false); }
    finally { setLoading(false); }
  }, [cursor, isCurrentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  // Capture confirmed → post to backend
  const handlePhotoCaptured = async (photoDataUrl) => {
    const mode = cameraModal;
    setCameraModal(null);
    setActionLoading(true);
    try {
      await apiFetch(mode==="checkin" ? "/api/v1/attendance/checkin" : "/api/v1/attendance/checkout", {
        method:"POST",
        body: JSON.stringify({ photo_url: photoDataUrl }),
      });
      showToast(mode==="checkin" ? "✅ Checked in successfully!" : "✅ Checked out successfully!");
      await loadData();
    } catch(e) { showToast(e?.detail || "Action failed", false); }
    finally { setActionLoading(false); }
  };

  const isOnTime = (iso) => {
    const ist = new Date(new Date(iso).toLocaleString("en-US", { timeZone:"Asia/Calcutta" }));
    return ist <= new Date(ist).setHours(9,15,0,0);
  };

  // Group sessions by IST day
  const byDay = useMemo(() => {
    const map = new Map();
    sessions.forEach(s => {
      const k = new Date(s.login_at).toLocaleDateString("en-CA", { timeZone:"Asia/Calcutta" });
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    });
    return Array.from(map.entries()).sort((a,b)=>a[0]<b[0]?1:-1).map(([day,list]) => {
      const sorted = [...list].sort((a,b)=>a.login_at.localeCompare(b.login_at));
      const first = sorted[0], last = sorted[sorted.length-1];
      let totalMin = 0;
      sorted.forEach(s => {
        const end = s.logout_at ? new Date(s.logout_at) : new Date();
        totalMin += Math.max(0, Math.round((end - new Date(s.login_at))/60000));
      });
      return {
        day,
        checkIn: first.login_at,
        checkInPhoto: first.checkin_photo_url,
        checkOut: last.logout_at,
        checkOutPhoto: last.checkout_photo_url,
        totalMin,
        sessions: sorted,
        isOpen: !last.logout_at,
      };
    });
  }, [sessions]);

  const weekly = useMemo(() => {
    const weeks = new Map();
    byDay.forEach(d => {
      const dt = new Date(d.day+"T00:00:00"), ws = startOfWeek(dt), key = ymdFromDate(ws);
      if (!weeks.has(key)) weeks.set(key, {start:ws, days:[], total:0});
      const w = weeks.get(key); w.days.push(d); w.total += d.totalMin;
    });
    return Array.from(weeks.values()).sort((a,b)=>a.start>b.start?-1:1);
  }, [byDay]);

  const tKey = todayIST();
  const todayDay = byDay.find(d => d.day === tKey) ?? null;

  const exportCSV = () => {
    const rows = [["Date","Check in (IST)","Check out (IST)","Total","On time"],
      ...[...byDay].sort((a,b)=>a.day<b.day?-1:1).map(d=>[d.day,fmtTime(d.checkIn),d.isOpen?"Active":fmtTime(d.checkOut),fmtDur(d.totalMin),isOnTime(d.checkIn)?"Yes":"No"])];
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `attendance-${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}.csv`;
    a.click();
  };
  const exportPDF = () => {
    const w = window.open("","_blank"); if(!w) return;
    const rows = [...byDay].sort((a,b)=>a.day<b.day?-1:1).map(d=>`<tr><td>${fmtDate(d.day)}</td><td>${fmtTime(d.checkIn)}</td><td>${d.isOpen?"Active":fmtTime(d.checkOut)}</td><td>${fmtDur(d.totalMin)}</td><td>${isOnTime(d.checkIn)?"✓":"—"}</td></tr>`).join("");
    w.document.write(`<html><head><title>Attendance</title><style>body{font-family:-apple-system,sans-serif;padding:32px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #e5e7eb;padding:8px 10px;text-align:left}th{background:#f9fafb;font-size:11px;font-weight:600;text-transform:uppercase;color:#666}@media print{button{display:none}}</style></head><body><h2>Attendance — ${monthLabel} (IST)</h2><table><thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Total</th><th>On time</th></tr></thead><tbody>${rows}</tbody></table><button onclick="window.print()" style="margin-top:20px;padding:8px 16px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer">Print / Save PDF</button></body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  };

  // Icons inline
  const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const IconClock = ({c}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const IconFlame = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
  const IconTrend = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
  const IconIn   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
  const IconOut  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
  const IconCam  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
  const IconDl   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
  const IconCal  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  const IconChL  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
  const IconChR  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
  const IconAct  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  const IconStar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  const IconStarGray = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

  const btnStyle = (active) => ({
    display:"flex", alignItems:"center", gap:7, padding:"8px 18px", borderRadius:8,
    border:"1px solid #e5e7eb", background:"#fff", fontSize:13, fontWeight:600,
    color:"#374151", cursor:"pointer", transition:"all .2s",
    boxShadow:"0 1px 4px rgba(0,0,0,.06)",
  });

  return (
    <>
      <style>{`
        @keyframes att-spin{to{transform:rotate(360deg)}}
        .att-pulse{animation:att-pulse-kf 2s infinite}
        @keyframes att-pulse-kf{0%,100%{opacity:1}50%{opacity:.4}}
        .att-tab{padding:7px 20px;border-radius:8px;border:none;font-size:14px;font-weight:500;cursor:pointer;background:transparent;color:#6b7280;transition:all .15s}
        .att-tab.on{background:#fff;color:#111827;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.1)}
        .att-row:hover{background:#fafafa!important}
        .att-btn:hover{background:#eff6ff!important;border-color:#93c5fd!important;color:#2563eb!important;transform:translateY(-1px)}
        .att-arrow{width:32px;height:32px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;transition:all .15s}
        .att-arrow:hover{background:#eff6ff;border-color:#93c5fd;color:#2563eb}
        .att-arrow:disabled{opacity:.35;cursor:not-allowed}
      `}</style>

      <CameraModal open={!!cameraModal} type={cameraModal} onCapture={handlePhotoCaptured} onClose={()=>setCameraModal(null)} />

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9998, padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:600,
          background: toast.ok?"#dcfce7":"#fee2e2", color: toast.ok?"#16a34a":"#dc2626",
          border:`1px solid ${toast.ok?"#86efac":"#fca5a5"}`, boxShadow:"0 4px 12px rgba(0,0,0,.15)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:980, margin:"0 auto", paddingBottom:60 }}>

        {/* ── Header ── */}
        <div style={{ background:"linear-gradient(135deg,rgba(14,165,233,.07) 0%,#fff 65%)", border:"1px solid #e5e7eb", borderRadius:16, padding:"22px 28px", marginBottom:18, boxShadow:"0 1px 3px rgba(0,0,0,.04)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"rgba(14,165,233,.07)", filter:"blur(40px)" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, position:"relative" }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:700, color:"#0f172a", letterSpacing:"-0.3px" }}>My Attendance</h1>
              <p style={{ fontSize:13, color:"#6b7280", marginTop:3 }}>Your daily check-in and check-out times</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              {/* Check In / Out */}
              {isCurrentMonth && (
                <button
                  onClick={() => setCameraModal(todayStatus.active ? "checkout" : "checkin")}
                  disabled={actionLoading}
                  style={{
                    display:"flex", alignItems:"center", gap:8, padding:"9px 20px", borderRadius:10, border:"none",
                    background: todayStatus.active?"#ef4444":"#16a34a", color:"#fff", fontSize:14, fontWeight:700,
                    cursor: actionLoading?"not-allowed":"pointer", opacity: actionLoading?.7:1,
                    boxShadow:`0 4px 12px ${todayStatus.active?"rgba(239,68,68,.3)":"rgba(22,163,74,.3)"}`,
                    transition:"all .2s",
                  }}
                  onMouseEnter={e=>{ if(!actionLoading){e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 20px ${todayStatus.active?"rgba(239,68,68,.35)":"rgba(22,163,74,.35)"}`;} }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 4px 12px ${todayStatus.active?"rgba(239,68,68,.3)":"rgba(22,163,74,.3)"}`; }}
                >
                  <IconCam />
                  {actionLoading ? "Processing…" : todayStatus.active ? "Check Out" : "Check In"}
                </button>
              )}
              <button onClick={exportCSV} className="att-btn" style={btnStyle()}><IconDl /> CSV</button>
              <button onClick={exportPDF} className="att-btn" style={btnStyle()}><IconDl /> PDF</button>
              <button className="att-arrow" onClick={()=>{const d=new Date(cursor);d.setMonth(d.getMonth()-1);setCursor(d);}}><IconChL /></button>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", fontSize:13, fontWeight:500, color:"#111827", minWidth:132, justifyContent:"center" }}>
                <IconCal /> {monthLabel}
              </div>
              <button className="att-arrow" disabled={isCurrentMonth} onClick={()=>{const d=new Date(cursor);d.setMonth(d.getMonth()+1);setCursor(d);}}><IconChR /></button>
            </div>
          </div>
        </div>

        {/* ── AI Weekly Summary ── */}
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"18px 24px", marginBottom:18, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#a855f7,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <IconStar />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#111827" }}>AI Weekly Summary</div>
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>
                  {(()=>{ const ws=startOfWeek(now),we=new Date(ws); we.setDate(we.getDate()+6); const f=d=>d.toLocaleDateString("en-US",{month:"short",day:"numeric"}); return `${f(ws)} — ${f(we)} (this week)`; })()}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className="att-arrow"><IconChL /></button>
              <button className="att-arrow"><IconChR /></button>
              <button style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px", borderRadius:8, border:"none", background:"#2563eb", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 12px rgba(37,99,235,.25)", transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 18px rgba(37,99,235,.3)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(37,99,235,.25)"; }}>
                <IconStar /> Generate
              </button>
            </div>
          </div>
          <div style={{ marginTop:20, padding:"28px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <IconStarGray />
            <div style={{ fontSize:14, fontWeight:500, color:"#374151", textAlign:"center" }}>Generate an AI-powered weekly performance summary.</div>
            <div style={{ fontSize:13, color:"#9ca3af", textAlign:"center" }}>Tailored to role-specific KPIs · attendance · activities · output.</div>
          </div>
        </div>

        {/* ── Today card ── */}
        {isCurrentMonth && (
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"16px 22px", marginBottom:18, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(14,165,233,.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#0284c7", flexShrink:0 }}>
                  <IconAct />
                </div>
                <div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>
                    Today, {now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Calcutta"})}
                  </div>
                  <div style={{ fontSize:16, fontWeight:600, color:"#111827", marginTop:2 }}>
                    {todayStatus.active && todayStatus.session
                      ? <><span>Active — checked in at </span><span style={{color:"#2563eb"}}>{fmtTime(todayStatus.session.login_at)}</span></>
                      : todayDay && !todayDay.isOpen
                        ? <><span>Checked out at </span><span style={{color:"#6b7280"}}>{fmtTime(todayDay.checkOut)}</span></>
                        : "Not checked in yet"
                    }
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {/* Today's photos */}
                {todayDay?.checkInPhoto && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <img src={todayDay.checkInPhoto} alt="in" style={{ width:40, height:40, borderRadius:8, objectFit:"cover", border:"2px solid #bbf7d0", cursor:"pointer" }}
                      onClick={()=>window.open(todayDay.checkInPhoto,"_blank")} />
                    <span style={{ fontSize:9, color:"#16a34a", fontWeight:700 }}>IN</span>
                  </div>
                )}
                {todayDay?.checkOutPhoto && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <img src={todayDay.checkOutPhoto} alt="out" style={{ width:40, height:40, borderRadius:8, objectFit:"cover", border:"2px solid #fde68a", cursor:"pointer" }}
                      onClick={()=>window.open(todayDay.checkOutPhoto,"_blank")} />
                    <span style={{ fontSize:9, color:"#d97706", fontWeight:700 }}>OUT</span>
                  </div>
                )}
                {todayStatus.active && (
                  <Bdg color="#15803d" bg="#f0fdf4" border="#bbf7d0">
                    <span className="att-pulse" style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
                    Active
                  </Bdg>
                )}
                {todayDay && (
                  <Bdg {...(isOnTime(todayDay.checkIn)?{color:"#0284c7",bg:"#eff6ff",border:"#bae6fd"}:{color:"#d97706",bg:"#fffbeb",border:"#fde68a"})}>
                    {isOnTime(todayDay.checkIn) ? "On time" : "Late"}
                  </Bdg>
                )}
                <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, background:"#f9fafb", border:"1px solid #e5e7eb", fontSize:14, fontWeight:600, color:"#374151" }}>
                  <IconClock /> {todayDay ? fmtDur(todayDay.totalMin) : "0h 0m"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:18 }}>
          <StatCard icon={<IconCheck />}              label="Days Present"   value={String(stats?.days_present ?? byDay.length)}       tint="emerald" />
          <StatCard icon={<IconClock c="#0284c7"/>}   label="Total Time"     value={fmtDur(stats?.total_minutes ?? 0)}                 tint="sky" />
          <StatCard icon={<IconTrend />}              label="Avg / Day"      value={fmtDur(stats?.avg_minutes_per_day ?? 0)}           tint="violet" />
          <StatCard icon={<IconFlame />}              label="Longest Streak" value={`${stats?.longest_streak ?? 0}d`}                  tint="orange" />
          <StatCard icon={<IconIn />}                 label="Avg Check-In"   value={stats?.avg_checkin_time ?? "—"}                    tint="rose" />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:4, background:"#f3f4f6", borderRadius:10, padding:3, width:"fit-content", marginBottom:16 }}>
          {["daily","weekly"].map(t=>(
            <button key={t} className={`att-tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Daily table ── */}
        {tab==="daily" && (
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            {/* Column header */}
            <div style={{ display:"grid", gridTemplateColumns:"2.2fr 2fr 2fr 1.2fr", padding:"10px 22px", background:"#f9fafb", borderBottom:"1px solid #f3f4f6", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9ca3af" }}>
              <div>Date</div>
              <div>Check In</div>
              <div>Check Out</div>
              <div style={{textAlign:"right"}}>Total</div>
            </div>
            {loading
              ? <div style={{ padding:"48px", textAlign:"center", color:"#9ca3af", fontSize:14 }}>Loading…</div>
              : byDay.length===0
                ? <div style={{ padding:"48px", textAlign:"center", color:"#9ca3af", fontSize:14 }}>No records for {monthLabel}.</div>
                : byDay.map((d,i)=>{
                    const isToday = d.day===tKey;
                    const onTime  = isOnTime(d.checkIn);
                    return (
                      <div key={d.day} className="att-row" style={{
                        display:"grid", gridTemplateColumns:"2.2fr 2fr 2fr 1.2fr",
                        padding:"13px 22px", borderTop: i===0?"none":"1px solid #f3f4f6",
                        alignItems:"center", background: isToday?"rgba(37,99,235,.025)":"#fff",
                        transition:"background .15s",
                      }}>
                        {/* Date */}
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                            <span style={{ fontSize:14, fontWeight:500, color:"#111827" }}>{fmtDate(d.day)}</span>
                            {isToday && <Bdg color="#2563eb" bg="#eff6ff" border="#bfdbfe" style={{fontSize:10}}>Today</Bdg>}
                            {!onTime && <Bdg color="#d97706" bg="#fffbeb" border="#fde68a" style={{fontSize:10}}>Late</Bdg>}
                          </div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{d.sessions.length} session{d.sessions.length===1?"":"s"}</div>
                        </div>

                        {/* Check In — time + photo */}
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <IconIn />
                          <span style={{ fontSize:14, color:"#111827", fontWeight:500 }}>{fmtTime(d.checkIn)}</span>
                          <PhotoBadge src={d.checkInPhoto} label="In" />
                        </div>

                        {/* Check Out — time + photo */}
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <IconOut />
                          {d.isOpen
                            ? <Bdg color="#15803d" bg="#f0fdf4" border="#bbf7d0">
                                <span className="att-pulse" style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
                                Active
                              </Bdg>
                            : <span style={{ fontSize:14, color:"#111827", fontWeight:500 }}>{fmtTime(d.checkOut)}</span>
                          }
                          {!d.isOpen && <PhotoBadge src={d.checkOutPhoto} label="Out" />}
                        </div>

                        {/* Total */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:5, fontSize:14, fontWeight:600, color:"#111827" }}>
                          <IconClock c="#9ca3af" /> {fmtDur(d.totalMin)}
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        )}

        {/* ── Weekly table ── */}
        {tab==="weekly" && (
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"3fr 2.5fr 1.5fr 1.5fr", padding:"10px 22px", background:"#f9fafb", borderBottom:"1px solid #f3f4f6", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9ca3af" }}>
              <div>Week</div><div style={{textAlign:"center"}}>Days</div><div style={{textAlign:"right"}}>Avg/Day</div><div style={{textAlign:"right"}}>Total</div>
            </div>
            {weekly.length===0
              ? <div style={{ padding:"48px", textAlign:"center", color:"#9ca3af", fontSize:14 }}>No weekly data.</div>
              : weekly.map((w,i)=>{
                  const end=new Date(w.start); end.setDate(end.getDate()+6);
                  const fmt=d=>d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
                  return (
                    <div key={w.start.toISOString()} className="att-row" style={{ display:"grid", gridTemplateColumns:"3fr 2.5fr 1.5fr 1.5fr", padding:"13px 22px", borderTop:i===0?"none":"1px solid #f3f4f6", alignItems:"center", background:"#fff", transition:"background .15s" }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:500, color:"#111827" }}>{fmt(w.start)} — {fmt(end)}</div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{w.days.length} day{w.days.length===1?"":"s"} present</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"center", gap:4 }}>
                        {Array.from({length:7}).map((_,idx)=>{
                          const dt=new Date(w.start); dt.setDate(dt.getDate()+idx);
                          const present=w.days.find(d=>d.day===ymdFromDate(dt));
                          return (
                            <div key={idx} title={dt.toLocaleDateString()} style={{ width:24, height:24, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, border:"1px solid",
                              ...(present?{background:"rgba(16,185,129,.15)",color:"#059669",borderColor:"rgba(16,185,129,.3)"}:{background:"#f9fafb",color:"#9ca3af",borderColor:"#e5e7eb"})
                            }}>
                              {["M","T","W","T","F","S","S"][idx]}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontSize:14, color:"#9ca3af", textAlign:"right" }}>{w.days.length?fmtDur(Math.round(w.total/w.days.length)):"—"}</div>
                      <div style={{ fontSize:14, fontWeight:600, color:"#111827", textAlign:"right" }}>{fmtDur(w.total)}</div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      <button onClick={()=>setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <AddQuickTaskDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} />
    </>
  );
}