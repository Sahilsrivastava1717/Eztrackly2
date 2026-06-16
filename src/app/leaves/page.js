"use client";

import { useState, useCallback, useEffect } from "react";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function dayCount(start, end, dayType) {
  const isHalf = dayType === "first_half" || dayType === "second_half";
  if (isHalf) return 0.5;
  return Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1;
}

// ── status colours ────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:   { background:"#fffbeb", color:"#d97706", border:"1px solid #fde68a" },
  approved:  { background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0" },
  rejected:  { background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" },
  cancelled: { background:"#f3f4f6", color:"#6b7280", border:"1px solid #e5e7eb" },
};

// ── custom select ─────────────────────────────────────────────────────────────
function Sel({ value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const cur = options.find(o => o.value === value);
  return (
    <div style={{ position:"relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"9px 12px", borderRadius:8,
          border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          background: disabled ? "#f9fafb" : "#fff",
          fontSize:14, color: disabled ? "#9ca3af" : "#111827",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? "0 0 0 3px #dbeafe" : "none",
        }}
      >
        <span>{cur?.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:10 }} />
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:20, minWidth:"100%",
            background:"#fff", border:"1px solid #e5e7eb", borderRadius:10,
            boxShadow:"0 8px 24px rgba(0,0,0,.10)", overflow:"hidden"
          }}>
            {options.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"10px 16px", fontSize:14, cursor:"pointer",
                  background: value===o.value ? "#eff6ff" : "transparent",
                  color: value===o.value ? "#2563eb" : "#111827",
                }}
              >
                {o.label}
                {value===o.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e5e7eb", borderRadius:16,
      padding:"10px 26px", boxShadow:"0 1px 3px rgba(0,0,0,.04)"
    }}>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", color:"#9ca3af", textTransform:"uppercase", marginBottom:10 }}>
        {label}
      </div>
      <div style={{ fontSize:36, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

// ── badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, style }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 10px", borderRadius:999, fontSize:12, fontWeight:500,
      border:"1px solid #e5e7eb", background:"#f9fafb", color:"#374151",
      ...style
    }}>
      {children}
    </span>
  );
}

// ── mock data (replace with real supabase calls) ──────────────────────────────
const MOCK_HOLIDAYS = [
  { id:1, date:"2026-08-15", name:"Independance Day" },
  { id:2, date:"2026-10-02", name:"Gandhi Jayanti"   },
  { id:3, date:"2026-10-20", name:"Dussehra"         },
  { id:4, date:"2026-11-08", name:"Diwali"           },
  { id:5, date:"2026-12-25", name:"Christmas Day"    },
];

// ── page ──────────────────────────────────────────────────────────────────────
export default function MyLeavesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaves,    setLeaves]    = useState([]);
  const [holidays,  setHolidays]  = useState(MOCK_HOLIDAYS);
  const [submitting,setSubmitting]= useState(false);
  const [toast,     setToast]     = useState(null);        // {msg, type}
  const [form, setForm] = useState({
    start_date:"", end_date:"", type:"casual", reason:"", day_type:"full_day"
  });

  // toast helper
  const notify = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // counts
  const counts = {
    daysTaken: leaves.filter(l => l.status==="approved").reduce((s,l) => s + dayCount(l.start_date, l.end_date, l.day_type), 0),
    pending:   leaves.filter(l => l.status==="pending").length,
    approved:  leaves.filter(l => l.status==="approved").length,
    rejected:  leaves.filter(l => l.status==="rejected").length,
  };

  const apply = (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) return;
    if (form.end_date < form.start_date) { notify("End date must be after start date","error"); return; }
    if (form.day_type !== "full_day" && form.start_date !== form.end_date) { notify("Half-day must be a single date","error"); return; }
    setSubmitting(true);
    setTimeout(() => {
      const newLeave = {
        id: Date.now().toString(),
        ...form,
        status:"pending",
        created_at: new Date().toISOString(),
      };
      setLeaves(prev => [newLeave, ...prev]);
      setForm({ start_date:"", end_date:"", type:"casual", reason:"", day_type:"full_day" });
      setSubmitting(false);
      notify("Leave request submitted");
    }, 600);
  };

  const cancel = (id) => {
    setLeaves(prev => prev.map(l => l.id===id ? { ...l, status:"cancelled" } : l));
    notify("Cancelled");
  };

  const DURATION_OPTS = [
    { value:"full_day",    label:"Full day"            },
    { value:"first_half",  label:"Half day (1st half)" },
    { value:"second_half", label:"Half day (2nd half)" },
  ];
  const TYPE_OPTS = [
    { value:"casual",   label:"Casual"   },
    { value:"sick",     label:"Sick"     },
    { value:"vacation", label:"Vacation" },
    { value:"personal", label:"Personal" },
    { value:"unpaid",   label:"Unpaid"   },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        input[type=date] {
          width:100%; padding:9px 12px; border-radius:8px;
          border:1.5px solid #d1d5db; font-size:14px;
          color:#111827; outline:none; background:#fff;
        }
        input[type=date]:focus { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
        input[type=date]:disabled { background:#f9fafb; color:#9ca3af; cursor:not-allowed; }
        input[type=text] {
          width:100%; padding:9px 12px; border-radius:8px;
          border:1.5px solid #d1d5db; font-size:14px; color:#111827; outline:none;
        }
        input[type=text]:focus { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
        input[type=text]::placeholder { color:#9ca3af; }
        .lv-label { font-size:14px; font-weight:600; color:#0d1014; margin-bottom:5px; display:block; }
        .card { width:100%; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:22px 24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
        .fab {
          position:fixed; bottom:32px; right:32px;
          width:52px; height:52px; border-radius:50%;
          background:#2563eb; color:#fff; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          font-size:26px; box-shadow:0 4px 14px rgba(37,99,235,.45);
        }
        .fab:hover { background:#1d4ed8; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:20, right:24, zIndex:999,
          padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:500,
          background: toast.type==="error" ? "#fef2f2" : "#f0fdf4",
          color:       toast.type==="error" ? "#dc2626" : "#15803d",
          border:      toast.type==="error" ? "1px solid #fecaca" : "1px solid #bbf7d0",
          boxShadow:"0 4px 12px rgba(0,0,0,.10)"
        }}>
          {toast.msg}
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          paddingLeft: "100px",
          paddingRight: "100px",
        }}
      >

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:30, fontWeight:700, color:"#0f172a" }}>My Leaves</h1>
          <p style={{ fontSize:14, color:"#6b7280", marginTop:4 }}>Plan your time off and view requests.</p>
        </div>

        {/* Summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(230px,1fr))", gap:12, marginBottom:24 }}>
          <SummaryCard label="Days taken" value={counts.daysTaken} color="#16a34a" />
          <SummaryCard label="Pending"    value={counts.pending}   color="#d97706" />
          <SummaryCard label="Approved"   value={counts.approved}  color="#0284c7" />
          <SummaryCard label="Rejected"   value={counts.rejected}  color="#dc2626" />
        </div>

        {/* Apply form */}
        <form onSubmit={apply} className="card" style={{ marginBottom:24, width:"100%"}}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:18 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span style={{ fontSize:18, fontWeight:600, color:"#01050e" }}>Apply for leave</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 2fr", gap:10, marginBottom:18 }}>
            {/* From */}
            <div>
              <label className="lv-label">From</label>
              <input
                type="date" required value={form.start_date}
                onChange={e => setForm({
                  ...form, start_date: e.target.value,
                  ...(form.day_type!=="full_day" ? { end_date: e.target.value } : {})
                })}
              />
            </div>
            {/* To */}
            <div>
              <label className="lv-label">To</label>
              <input
                type="date" required value={form.end_date}
                disabled={form.day_type!=="full_day"}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            {/* Duration */}
            <div>
              <label className="lv-label">Duration</label>
              <Sel
                value={form.day_type}
                options={DURATION_OPTS}
                onChange={v => setForm({
                  ...form, day_type: v,
                  ...(v!=="full_day" && form.start_date ? { end_date: form.start_date } : {})
                })}
              />
            </div>
            {/* Type */}
            <div>
              <label className="lv-label">Type</label>
              <Sel value={form.type} options={TYPE_OPTS} onChange={v => setForm({ ...form, type: v })} />
            </div>
            {/* Reason */}
            <div>
              <label className="lv-label">Reason (optional)</label>
              <input
                type="text" value={form.reason} placeholder="Family event, vacation..."
                onChange={e => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button
              type="submit" disabled={submitting}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"10px 22px", borderRadius:10, border:"none",
                background:"#2563eb", color:"#fff", fontSize:14,
                fontWeight:600, cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                boxShadow:"0 2px 8px rgba(37,99,235,.35)"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>

        {/* Upcoming holidays */}
        {holidays.length > 0 && (
          <div className="card" style={{ marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontSize:18 }}>🎉</span>
              <span style={{ fontSize:16, fontWeight:600, color:"#111827" }}>Upcoming public holidays</span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {holidays.map(h => {
                const d = new Date(h.date + "T00:00:00");
                const label = d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
                return (
                  <Badge key={h.id} style={{
                    background:"#fff7ed", color:"#c2410c",
                    border:"1px solid #fed7aa", fontWeight:500
                  }}>
                    {label} · {h.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Leave history */}
        <div style={{
          background:"#fff", border:"1px solid #e5e7eb", borderRadius:16,
          overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.04)"
        }}>
          <div style={{
            padding:"16px 24px", borderBottom:"1px solid #f3f4f6",
            fontSize:15, fontWeight:600, color:"#111827"
          }}>
            My leave history
          </div>
          {leaves.length === 0 ? (
            <div style={{ padding:"48px 24px", textAlign:"center", fontSize:14, color:"#9ca3af" }}>
              No leave requests yet.
            </div>
          ) : (
            <div>
              {leaves.map((l, i) => {
                const days = dayCount(l.start_date, l.end_date, l.day_type);
                const isHalf = l.day_type==="first_half" || l.day_type==="second_half";
                const halfLabel = l.day_type==="first_half" ? "1st half" : l.day_type==="second_half" ? "2nd half" : null;
                const ss = STATUS_STYLE[l.status] || STATUS_STYLE.cancelled;
                return (
                  <div key={l.id} style={{
                    display:"flex", alignItems:"flex-start", justifyContent:"space-between",
                    gap:16, padding:"16px 24px",
                    borderTop: i===0 ? "none" : "1px solid #f3f4f6"
                  }}>
                    <div>
                      <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6, marginBottom:6 }}>
                        <Badge style={{ textTransform:"capitalize" }}>{l.type}</Badge>
                        {halfLabel && (
                          <Badge style={{ background:"#eff6ff", color:"#0369a1", border:"1px solid #bae6fd" }}>
                            {halfLabel}
                          </Badge>
                        )}
                        <Badge style={ss}>{l.status}</Badge>
                      </div>
                      <div style={{ fontSize:13, color:"#374151" }}>
                        {fmtDate(l.start_date)}
                        {!isHalf && ` → ${fmtDate(l.end_date)}`}
                        {" · "}
                        <strong>{days} {days===1?"day":"days"}</strong>
                      </div>
                      {l.reason && (
                        <div style={{ fontSize:12, color:"#9ca3af", fontStyle:"italic", marginTop:4 }}>
                          "{l.reason}"
                        </div>
                      )}
                    </div>
                    {l.status==="pending" && (
                      <button
                        onClick={() => cancel(l.id)}
                        style={{
                          display:"flex", alignItems:"center", gap:5,
                          padding:"6px 14px", borderRadius:8,
                          border:"1px solid #fecaca", background:"#fff",
                          color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer",
                          flexShrink:0
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
              onClick={() => setDrawerOpen(true)}
              className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
              title="Add a quick task"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
       
            {/* Quick Task Drawer */}
            <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          
    </>
  );
}