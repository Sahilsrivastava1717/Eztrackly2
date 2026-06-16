"use client";

import { useState, useEffect, useRef } from "react";

// ── helpers ────────────────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low",    dot: "#22c55e" },
  { value: "medium", label: "Medium", dot: "#f59e0b" },
  { value: "high",   label: "High",   dot: "#f97316" },
  { value: "urgent", label: "Urgent", dot: "#ef4444" },
];

const TODAY_ISO = new Date().toISOString().substring(0, 10);

export default function AddQuickTaskDrawer({ open, onClose }) {
  const [form, setForm] = useState({
    title: "", notes: "", assignTo: "myself",
    category: "", priority: "medium",
    due_date: TODAY_ISO, link: "", file: null,
  });
  const [saving,    setSaving]    = useState(false);
  const [prioOpen,  setPrioOpen]  = useState(false);
  const titleRef = useRef(null);
  const prioRef  = useRef(null);

  useEffect(() => {
    if (open) {
      setForm({ title:"", notes:"", assignTo:"myself", category:"", priority:"medium", due_date:TODAY_ISO, link:"", file:null });
      setSaving(false); setPrioOpen(false);
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    if (!prioOpen) return;
    const h = (e) => { if (prioRef.current && !prioRef.current.contains(e.target)) setPrioOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [prioOpen]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) { titleRef.current?.focus(); return; }
    setSaving(true);
    // wire up your real save / addTask logic here
    console.log("New task:", form);
    setTimeout(() => { setSaving(false); onClose(); }, 300);
  };

  const selPrio = PRIORITY_OPTIONS.find(p => p.value === form.priority);

  if (!open) return null;

  return (
    <>
      <style>{`
        .aqt-overlay{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.38);backdrop-filter:blur(2px);}
        .aqt-modal{
          position:fixed;left:50%;top:50%;z-index:101;
          transform:translate(-50%,-50%);
          width:100%;max-width:450px;max-height:90vh;
          display:flex;flex-direction:column;
          background:#fff;border-radius:20px;
          box-shadow:0 24px 64px rgba(0,0,0,0.18);
          overflow:hidden;
          animation:aqt-in .18s ease;
        }
        @keyframes aqt-in{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        .aqt-body{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .aqt-body::-webkit-scrollbar{width:4px}
        .aqt-body::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        .aqt-label{font-size:13px;font-weight:600;color:#111827;display:flex;align-items:center;gap:6px;margin-bottom:5px;}
        .aqt-label-muted{font-weight:400;color:#9ca3af;}
        .aqt-input{
          width:100%;padding:10px 14px;border-radius:12px;
          border:1.5px solid #e5e7eb;font-size:14px;color:#111827;
          font-family:inherit;outline:none;background:#fff;box-sizing:border-box;
          transition:border-color .15s,box-shadow .15s;
        }
        .aqt-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
        .aqt-input::placeholder{color:#9ca3af;}
        .aqt-textarea{
          width:100%;padding:10px 14px;border-radius:12px;
          border:1.5px solid #e5e7eb;font-size:14px;color:#111827;
          font-family:inherit;outline:none;resize:vertical;min-height:88px;
          box-sizing:border-box;transition:border-color .15s,box-shadow .15s;
        }
        .aqt-textarea:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
        .aqt-textarea::placeholder{color:#9ca3af;}
        .aqt-select{
          width:100%;padding:10px 38px 10px 38px;border-radius:12px;
          border:1.5px solid #e5e7eb;font-size:14px;color:#111827;
          background:#fff;outline:none;appearance:none;
          font-family:inherit;box-sizing:border-box;
          transition:border-color .15s,box-shadow .15s;cursor:pointer;
        }
        .aqt-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
        .aqt-prio-btn{
          width:100%;display:flex;align-items:center;justify-content:space-between;
          padding:10px 14px;border-radius:12px;border:1.5px solid #e5e7eb;
          background:#fff;font-size:14px;color:#111827;cursor:pointer;
          transition:border-color .15s,box-shadow .15s;
        }
        .aqt-prio-btn.open{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
        .aqt-drop{
          position:absolute;top:calc(100% + 5px);left:0;right:0;z-index:200;
          background:#fff;border:1px solid #e5e7eb;border-radius:14px;
          box-shadow:0 8px 28px rgba(0,0,0,.12);overflow:hidden;
        }
        .aqt-drop-item{
          display:flex;align-items:center;justify-content:space-between;
          padding:10px 16px;font-size:14px;cursor:pointer;color:#111827;
          transition:background .1s;
        }
        .aqt-drop-item:hover{background:#f9fafb;}
        .aqt-drop-item.sel{background:#eff6ff;color:#2563eb;font-weight:600;}
        .aqt-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;display:inline-block;}
        .aqt-file-box{
          display:flex;align-items:center;gap:10px;
          padding:10px 14px;border-radius:12px;border:1.5px solid #e5e7eb;
          background:#fff;
        }
        .aqt-file-lbl{
          flex-shrink:0;padding:5px 14px;border-radius:8px;
          border:1px solid #bfdbfe;background:#eff6ff;
          font-size:13px;font-weight:600;color:#2563eb;cursor:pointer;
          transition:background .15s;
        }
        .aqt-file-lbl:hover{background:#dbeafe;}
        .aqt-cancel{
          padding:9px 22px;border-radius:10px;border:none;
          background:transparent;font-size:14px;font-weight:600;
          color:#6b7280;cursor:pointer;transition:background .15s;
        }
        .aqt-cancel:hover{background:#f3f4f6;}
        .aqt-add{
          display:flex;align-items:center;gap:7px;
          padding:9px 22px;border-radius:10px;border:none;
          background:#3b82f6;color:#fff;font-size:14px;
          font-weight:600;cursor:pointer;
          transition:background .15s,transform .15s,box-shadow .15s;
          box-shadow:0 2px 8px rgba(59,130,246,.3);
        }
        .aqt-add:hover:not(:disabled){background:#2563eb;transform:translateY(-1px);box-shadow:0 6px 16px rgba(59,130,246,.35);}
        .aqt-add:disabled{opacity:.5;cursor:not-allowed;}
        .aqt-close{
          display:flex;align-items:center;justify-content:center;
          width:30px;height:30px;border-radius:8px;border:none;
          background:transparent;color:#9ca3af;cursor:pointer;
          transition:background .15s,color .15s;flex-shrink:0;
        }
        .aqt-close:hover{background:#f3f4f6;color:#374151;}
        .aqt-ai-btn{
          display:flex;align-items:center;gap:5px;
          padding:4px 10px;border-radius:8px;border:none;
          background:transparent;font-size:12px;font-weight:500;
          color:#3b82f6;cursor:pointer;transition:background .15s;
        }
        .aqt-ai-btn:hover{background:#eff6ff;}
        .aqt-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .aqt-date-input{
          width:100%;padding:10px 14px;border-radius:12px;
          border:1.5px solid #3b82f6;font-size:14px;color:#111827;
          font-family:inherit;outline:none;background:#fff;box-sizing:border-box;
          box-shadow:0 0 0 3px rgba(59,130,246,.10);
          transition:border-color .15s;
        }
        .aqt-date-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(59,130,246,.15);}
      `}</style>

      {/* Backdrop */}
      <div className="aqt-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="aqt-modal">

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          padding:"22px 24px 16px", borderBottom:"1px solid #f3f4f6",
        }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span style={{ fontSize:18, fontWeight:700, color:"#111827" }}>Add a quick task</span>
            </div>
            <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.5 }}>
              Captures a personal to-do for your day. Tasks appear in{" "}
              <strong style={{ color:"#374151" }}>My Tasks</strong>.
            </p>
          </div>
          <button className="aqt-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="aqt-body">

          {/* Title */}
          <div>
            <div className="aqt-label">Title</div>
            <input
              ref={titleRef}
              type="text"
              className="aqt-input"
              placeholder="e.g. Follow up with Acme Corp"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              maxLength={200}
            />
          </div>

          {/* Notes */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
              <div className="aqt-label" style={{ marginBottom:0 }}>
                Notes <span className="aqt-label-muted">(optional)</span>
              </div>
              <button className="aqt-ai-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/>
                </svg>
                AI refine
              </button>
            </div>
            <textarea
              className="aqt-textarea"
              rows={4}
              placeholder="Any details, links or context..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              maxLength={2000}
            />
          </div>

          {/* Assign to */}
          <div>
            <div className="aqt-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Assign to
            </div>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <select className="aqt-select" value={form.assignTo} onChange={e => set("assignTo", e.target.value)}>
                <option value="myself">Myself</option>
              </select>
              <div style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#9ca3af" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {/* Category + Priority */}
          <div className="aqt-row2">
            {/* Category */}
            <div>
              <div className="aqt-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                Category <span className="aqt-label-muted">(optional)</span>
              </div>
              <input
                type="text"
                className="aqt-input"
                placeholder="e.g. Sales, Follow-up"
                value={form.category}
                onChange={e => set("category", e.target.value)}
              />
            </div>

            {/* Priority */}
            <div ref={prioRef} style={{ position:"relative" }}>
              <div className="aqt-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                Priority
              </div>
              <button
                type="button"
                className={`aqt-prio-btn${prioOpen?" open":""}`}
                onClick={() => setPrioOpen(v => !v)}
              >
                <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className="aqt-dot" style={{ background: selPrio?.dot }} />
                  {selPrio?.label}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                  style={{ transform: prioOpen?"rotate(180deg)":"none", transition:"transform .15s" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {prioOpen && (
                <div className="aqt-drop">
                  {PRIORITY_OPTIONS.map(p => (
                    <div
                      key={p.value}
                      className={`aqt-drop-item${form.priority===p.value?" sel":""}`}
                      onClick={() => { set("priority", p.value); setPrioOpen(false); }}
                    >
                      <span style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <span className="aqt-dot" style={{ background: p.dot }} />
                        {p.label}
                      </span>
                      {form.priority===p.value && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due date */}
          <div>
            <div className="aqt-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Due date
            </div>
            <input
              type="date"
              className="aqt-date-input"
              value={form.due_date}
              onChange={e => set("due_date", e.target.value)}
            />
          </div>

          {/* Link */}
          <div>
            <div className="aqt-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Link <span className="aqt-label-muted">(optional)</span>
            </div>
            <input
              type="url"
              className="aqt-input"
              placeholder="https://..."
              value={form.link}
              onChange={e => set("link", e.target.value)}
            />
          </div>

          {/* Attach file */}
          <div>
            <div className="aqt-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Attach file <span className="aqt-label-muted">(optional, max 10MB)</span>
            </div>
            <div className="aqt-file-box">
              <label className="aqt-file-lbl">
                Choose File
                <input type="file" style={{ display:"none" }} accept="*/*" onChange={e => set("file", e.target.files?.[0] ?? null)} />
              </label>
              <span style={{ fontSize:13, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {form.file ? form.file.name : "No file chosen"}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10,
          padding:"14px 24px", borderTop:"1px solid #f3f4f6", background:"#fff",
        }}>
          <button className="aqt-cancel" onClick={onClose}>Cancel</button>
          <button
            className="aqt-add"
            onClick={handleSubmit}
            disabled={!form.title.trim() || saving}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {saving ? "Adding…" : "Add task"}
          </button>
        </div>

      </div>
    </>
  );
}
