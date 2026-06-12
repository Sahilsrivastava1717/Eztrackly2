"use client";

import { useState, useMemo } from "react";

// ── date helpers (no imports) ─────────────────────────────────────────────────
function startOfDay(d) { const r = new Date(d); r.setHours(0,0,0,0); return r; }
function endOfDay(d)   { const r = new Date(d); r.setHours(23,59,59,999); return r; }
function subDays(d, n) { const r = new Date(d); r.setDate(r.getDate() - n); return r; }
function diffDays(a, b) { return Math.floor((a - b) / 86400000); }
function diffHours(a, b) { return Math.floor((a - b) / 3600000); }
function fmtDate(d, fmt) {
  const date = new Date(d);
  if (fmt === "yyyy-MM-dd")
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  if (fmt === "MMM d")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (fmt === "EEEE, MMM d, yyyy")
    return date.toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric", year:"numeric" });
  return date.toLocaleDateString();
}

// ── constants ─────────────────────────────────────────────────────────────────
const TEAMS = [
  { key: "all",            label: "All teams"   },
  { key: "sales",          label: "Sales"       },
  { key: "seo",            label: "SEO"         },
  { key: "content_writer", label: "Content"     },
  { key: "developer",      label: "Developers"  },
  { key: "manager",        label: "Managers"    },
];

const RANGES = [
  { key: "today",     label: "Today",       days: 0 },
  { key: "yesterday", label: "Yesterday",   days: 1 },
  { key: "last2",     label: "Last 2 days", days: 2 },
  { key: "last3",     label: "Last 3 days", days: 3 },
  { key: "last7",     label: "Last 7 days", days: 7 },
];

// ── question builder ──────────────────────────────────────────────────────────
function buildQuestions({ name, rangeLabel, tasks, reports }) {
  const now = new Date();
  const out = [];
  const overdue  = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done");
  const inProg   = tasks.filter(t => t.status === "in_progress");
  const pending  = tasks.filter(t => t.status === "pending");
  const done     = tasks.filter(t => t.status === "done");
  const stale    = tasks.filter(t => t.status !== "done" && diffDays(now, new Date(t.updated_at)) >= 2);
  const noStandup = reports.length === 0;
  const blockers  = reports.filter(r => r.blockers && r.blockers.trim());
  const completed = reports.flatMap(r => r.completed  || []);
  const planned   = reports.flatMap(r => r.priorities || []);

  overdue.slice(0,3).forEach(t => out.push({ q:`"${t.title}" was due ${fmtDate(t.due_date,"MMM d")} and is still ${t.status}. What's blocking it?`, tag:"overdue", severity:"high" }));
  blockers.forEach(r => out.push({ q:`You flagged a blocker on ${fmtDate(r.report_date,"MMM d")}: "${r.blockers}". What support do you need?`, tag:"blocker", severity:"high" }));
  if (noStandup) out.push({ q:`No standup submitted for ${rangeLabel}. Walk us through what you worked on?`, tag:"general", severity:"high" });
  stale.filter(t => !overdue.includes(t)).slice(0,3).forEach(t => out.push({ q:`"${t.title}" hasn't updated in ${diffDays(now,new Date(t.updated_at))}d. Current status?`, tag:"stale", severity:"med" }));
  if (inProg.length >= 4) out.push({ q:`You have ${inProg.length} tasks in progress — which 2 are the real priority?`, tag:"progress", severity:"med" });
  if (planned.length > 0 && completed.length === 0) out.push({ q:`You planned ${planned.length} item(s) but no completions logged. Did the plan change?`, tag:"plan", severity:"med" });
  if (planned.length > 0 && completed.length > 0 && completed.length < planned.length/2) out.push({ q:`Only ${completed.length} of ${planned.length} planned done. What slowed things?`, tag:"plan", severity:"med" });
  inProg.slice(0,2).forEach(t => out.push({ q:`On "${t.title}" — what % complete and next step?`, tag:"progress", severity:"low" }));
  if (pending.length >= 3) out.push({ q:`You have ${pending.length} pending tasks. When will you start them?`, tag:"plan", severity:"low" });
  if (done.length === 0 && tasks.length > 0) out.push({ q:`Nothing marked done in ${rangeLabel}. Smallest task you can ship today?`, tag:"progress", severity:"med" });
  if (out.length === 0) out.push({ q:`${name}, anything we should know — risks, dependencies, upcoming needs?`, tag:"general", severity:"low" });
  return out.slice(0,8);
}

// ── severity cls ─────────────────────────────────────────────────────────────
function sevCls(s) {
  return s === "high" ? "sev-high" : s === "med" ? "sev-med" : "sev-low";
}

// ── tiny components ───────────────────────────────────────────────────────────
function StatCard({ emoji, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label"><span>{emoji}</span>{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function Badge({ children, cls = "" }) {
  return <span className={`bdg ${cls}`}>{children}</span>;
}

function EmptyState({ message }) {
  return (
    <div className="empty">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c8ccd4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8"  y1="2" x2="8"  y2="6"/>
        <line x1="3"  y1="10" x2="21" y2="10"/>
      </svg>
      <p>{message}</p>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function MeetingsPage() {
  // Change to "user" to hide admin-only tabs
  const role = "user";
  const isAdmin = role === "admin";

  const [outerTab, setOuterTab] = useState(isAdmin ? "schedule" : "upcoming");
  const [innerTab, setInnerTab] = useState("questions");
  const [team,     setTeam]     = useState("all");
  const [rangeKey, setRangeKey] = useState("today");
  const [meetingType, setMeetingType] = useState("daily");
  const [notes, setNotes] = useState("");

  // Mock data – replace with real Supabase fetches
  const users   = [];
  const roleMap = {};
  const tasks   = [];
  const reports = [];

  const range   = RANGES.find(r => r.key === rangeKey);
  const from    = useMemo(() => startOfDay(subDays(new Date(), range.days)), [rangeKey]);
  const to      = useMemo(() => endOfDay(new Date()), []);

  const teamUsers   = useMemo(() => users.filter(u => team === "all" || roleMap[u.id] === team), [team]);
  const teamUserIds = useMemo(() => new Set(teamUsers.map(u => u.id)), [teamUsers]);
  const teamTasks   = useMemo(() => tasks.filter(t => {
    if (!teamUserIds.has(t.assigned_to)) return false;
    if (t.status !== "done") return true;
    const upd = new Date(t.updated_at);
    return upd >= from && upd <= to;
  }), [teamUserIds, from, to]);
  const teamReports = useMemo(() => reports.filter(r => teamUserIds.has(r.user_id)), [teamUserIds]);
  const userMap     = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), []);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      done:          teamTasks.filter(t => t.status === "done").length,
      pending:       teamTasks.filter(t => t.status === "pending").length,
      inProgress:    teamTasks.filter(t => t.status === "in_progress").length,
      overdue:       teamTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done").length,
      stale:         teamTasks.filter(t => t.status !== "done" && diffDays(now, new Date(t.updated_at)) >= 2).length,
      blockersCount: teamReports.filter(r => r.blockers && r.blockers.trim()).length,
      noStandup:     teamUsers.filter(u => !teamReports.some(r => r.user_id === u.id)).length,
    };
  }, [teamTasks, teamReports, teamUsers]);

  const perPerson = useMemo(() => teamUsers.map(u => {
    const ut = teamTasks.filter(t => t.assigned_to === u.id);
    const ur = teamReports.filter(r => r.user_id === u.id);
    return { user: u, tasks: ut, reports: ur, questions: buildQuestions({ name: u.name, rangeLabel: range.label, tasks: ut, reports: ur }) };
  }), [teamUsers, teamTasks, teamReports, range.label]);

  const agenda = useMemo(() => {
    const tl = TEAMS.find(t => t.key === team).label;
    const lines = [
      `# ${meetingType === "daily" ? "Daily Standup" : "Alternate-day Sync"} — ${tl}`,
      `Date: ${fmtDate(new Date(),"EEEE, MMM d, yyyy")} · Period: ${range.label}`, "",
      "## 1. Quick Status (2 min)",
      `- Team: ${teamUsers.length} · Missing standup: ${stats.noStandup}`,
      `- Done: ${stats.done} · In progress: ${stats.inProgress} · Pending: ${stats.pending}`,
      `- 🔥 Overdue: ${stats.overdue} · 🕒 Stale >2d: ${stats.stale} · 🚧 Blockers: ${stats.blockersCount}`, "",
      "## 2. Per-Person Round (5–10 min)",
    ];
    perPerson.forEach(({ user: u, tasks: ut, reports: ur, questions }) => {
      const completed  = ur.flatMap(r => r.completed  || []);
      const priorities = ur.flatMap(r => r.priorities || []);
      const bkrs       = ur.map(r => r.blockers).filter(Boolean);
      const open       = ut.filter(t => t.status !== "done");
      lines.push(`### ${u.name} (${roleMap[u.id] ?? "—"})`);
      lines.push(`- ✅ Did (${range.label}):`);
      completed.length ? completed.slice(0,5).forEach(c => lines.push(`  - ${c}`)) : lines.push(`  - (no standup notes)`);
      lines.push(`- ➡️ Plan:`);
      priorities.length ? priorities.slice(0,5).forEach(p => lines.push(`  - ${p}`)) : lines.push(`  - (no plan logged)`);
      if (open.length) {
        lines.push(`- 📋 Open (${open.length}):`);
        open.slice(0,6).forEach(t => {
          const due  = t.due_date ? ` · due ${fmtDate(t.due_date,"MMM d")}` : "";
          const age  = diffDays(new Date(), new Date(t.updated_at));
          lines.push(`  - [${t.status}] ${t.title}${due}${age >= 1 ? ` · ${age}d ago` : ""}`);
        });
      }
      if (bkrs.length) { lines.push(`- 🚧 Blockers:`); bkrs.forEach(b => lines.push(`  - ${b}`)); }
      lines.push(`- ❓ Questions:`);
      questions.forEach(q => lines.push(`  - ${q.q}`));
      lines.push("");
    });
    lines.push("## 3. Cross-team Risks", "- Re-assign overdue · confirm dependencies · escalate blockers");
    if (notes.trim()) { lines.push("", "## 4. Notes", notes.trim()); }
    return lines.join("\n");
  }, [meetingType, team, range, teamUsers, perPerson, stats, notes]);

  const copyAgenda = () => { navigator.clipboard.writeText(agenda); };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* reset */
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* page bg comes from AppLayout's main — just content here */
        .mtg-page { padding: 0; }

        /* header */
        .mtg-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 26px; font-weight: 700; color: #0f172a;
          letter-spacing: -0.3px; margin-bottom: 5px;
        }
        .mtg-sub { font-size: 14px; color: #6b7280; margin-bottom: 22px; }

        /* tabs */
        .tabs-row {
          display: flex; gap: 3px; margin-bottom: 16px;
        }
        .tab-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 10px; border: none;
          font-size: 14px; font-weight: 500; cursor: pointer;
          background: transparent; color: #6b7280; transition: all .15s;
        }
        .tab-btn:hover { background: rgba(255,255,255,.7); color: #374151; }
        .tab-btn.active {
          background: #fff; color: #111827; font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04);
        }

        /* panel */
        .panel {
          background: #fff; border-radius: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
          overflow: hidden;
        }

        /* empty */
        .empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 72px 24px; gap: 14px;
        }
        .empty p { font-size: 14px; color: #9ca3af; }

        /* planner controls */
        .planner-header {
          display: flex; flex-wrap: wrap; align-items: flex-end;
          justify-content: space-between; gap: 10px; margin-bottom: 20px;
        }
        .planner-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .planner-sub   { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .ctrl-right    { display: flex; flex-wrap: wrap; gap: 8px; }
        .sel {
          padding: 7px 28px 7px 10px; border-radius: 8px;
          border: 1px solid #e5e7eb; font-size: 13px; background: #fff;
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 8px center;
        }

        /* stat grid */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px; margin-bottom: 20px;
        }
        .stat-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 10px; padding: 12px 14px;
        }
        .stat-label {
          font-size: 11px; color: #6b7280;
          display: flex; align-items: center; gap: 5px;
        }
        .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }

        /* inner tabs */
        .inner-tabs { display: flex; gap: 3px; margin-bottom: 14px; flex-wrap: wrap; }
        .itab {
          padding: 6px 13px; border-radius: 8px; border: none;
          font-size: 13px; cursor: pointer; background: transparent;
          color: #6b7280; transition: all .12s;
        }
        .itab:hover { background: #fff; color: #111; }
        .itab.active { background: #fff; color: #111; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.08); }

        /* badge */
        .bdg {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 7px; border-radius: 999px; font-size: 11px;
          font-weight: 500; border: 1px solid transparent;
        }
        .bdg-outline  { border-color: #e5e7eb; background: transparent; color: #374151; }
        .bdg-sec      { background: #f3f4f6; color: #374151; }
        .sev-high     { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .sev-med      { background: #fffbeb; color: #92400e; border-color: #fde68a; }
        .sev-low      { background: #f9fafb; color: #374151; border-color: #e5e7eb; }

        /* cards */
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .card-head {
          padding: 13px 15px 10px; border-bottom: 1px solid #f3f4f6;
          display: flex; align-items: center; justify-content: space-between;
        }
        .card-title { font-size: 13px; font-weight: 600; }
        .card-body  { padding: 13px 15px; }

        /* person grid */
        .pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 12px; }

        /* q item */
        .q-item { border-radius: 7px; padding: 8px 10px; margin-bottom: 6px; border: 1px solid; }
        .q-item:last-child { margin-bottom: 0; }
        .q-row  { display: flex; align-items: flex-start; gap: 7px; }
        .q-tag  { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing:.4px; margin-top: 2px; flex-shrink: 0; }
        .q-text { font-size: 12px; line-height: 1.5; }

        /* agenda */
        .agenda-pre {
          white-space: pre-wrap; font-size: 12px; font-family: monospace;
          line-height: 1.7; background: #f9fafb; padding: 16px;
          border-radius: 8px; border: 1px solid #e5e7eb;
        }

        /* ai banner */
        .ai-banner {
          border: 1px solid #ddd6fe; border-radius: 10px; padding: 10px 14px;
          background: linear-gradient(to right,#faf5ff,#eff6ff);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px; margin-bottom: 14px;
        }
        .ai-left { display: flex; align-items: center; gap: 8px; font-size: 13px; }

        /* buttons */
        .btn {
          padding: 7px 13px; border-radius: 8px; border: 1px solid #e5e7eb;
          font-size: 13px; background: #fff; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .btn:hover { background: #f9fafb; }
        .btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-sm { padding: 5px 10px; font-size: 12px; }

        /* table */
        .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .tbl th { background: #f9fafb; padding: 8px 10px; text-align: left; font-weight: 600; }
        .tbl td { padding: 8px 10px; border-top: 1px solid #f3f4f6; }

        /* blocker */
        .blk-item { border-left: 3px solid #f87171; padding-left: 12px; margin-bottom: 12px; }
        .blk-name { font-size: 13px; font-weight: 600; }
        .blk-text { font-size: 13px; color: #6b7280; margin-top: 2px; }

        /* notes */
        textarea.notes-ta {
          width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb;
          border-radius: 8px; font-size: 13px; resize: vertical; font-family: inherit;
        }
        textarea.notes-ta:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
        .notes-hint { font-size: 11px; color: #9ca3af; margin-top: 6px; }

        /* schedule form */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ff { display: flex; flex-direction: column; gap: 5px; }
        .ff label { font-size: 12px; font-weight: 600; color: #374151; }
        .ff input, .ff select { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; }
        .ff.full { grid-column: 1 / -1; }

        /* fab */
        .fab {
          position: fixed; bottom: 32px; right: 32px;
          width: 52px; height: 52px; border-radius: 50%;
          background: #2563eb; color: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; box-shadow: 0 4px 14px rgba(37,99,235,.45);
          transition: background .15s, transform .15s; line-height: 1;
        }
        .fab:hover { background: #1d4ed8; transform: scale(1.06); }

        @media(max-width:640px){
          .form-grid { grid-template-columns: 1fr; }
          .stat-grid  { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      <div className="mtg-page">
        {/* ── Title ── */}
        <div className="mtg-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          Meetings
        </div>
        <div className="mtg-sub">
          {isAdmin
            ? "Schedule Google Meets, track upcoming & past calls, and plan team standups."
            : "View your upcoming and past Google Meet calls."}
        </div>

        {/* ── Outer tabs ── */}
        <div className="tabs-row">
          {isAdmin && (
            <button className={`tab-btn${outerTab==="schedule"?" active":""}`} onClick={()=>setOuterTab("schedule")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Schedule
            </button>
          )}
          <button className={`tab-btn${outerTab==="upcoming"?" active":""}`} onClick={()=>setOuterTab("upcoming")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Upcoming
          </button>
          <button className={`tab-btn${outerTab==="history"?" active":""}`} onClick={()=>setOuterTab("history")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            History
          </button>
          {isAdmin && (
            <button className={`tab-btn${outerTab==="planner"?" active":""}`} onClick={()=>setOuterTab("planner")}>
              ✨ Planner
            </button>
          )}
        </div>

        {/* ── Upcoming ── */}
        {outerTab==="upcoming" && (
          <div className="panel"><EmptyState message="No upcoming meetings yet." /></div>
        )}

        {/* ── History ── */}
        {outerTab==="history" && (
          <div className="panel"><EmptyState message="No past meetings found." /></div>
        )}

        {/* ── Schedule (admin) ── */}
        {isAdmin && outerTab==="schedule" && (
          <div className="card">
            <div className="card-head"><span className="card-title">📅 Schedule a Google Meet</span></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="ff"><label>Title</label><input type="text" placeholder="e.g. Daily standup"/></div>
                <div className="ff"><label>Date &amp; Time</label><input type="datetime-local"/></div>
                <div className="ff">
                  <label>Team</label>
                  <select className="sel">{TEAMS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select>
                </div>
                <div className="ff"><label>Duration (min)</label><input type="number" defaultValue={30}/></div>
                <div className="ff full"><label>Description</label><textarea rows={3} placeholder="Agenda or notes..." style={{padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:"8px",fontSize:"13px",fontFamily:"inherit"}}/></div>
                <div className="ff full" style={{flexDirection:"row",gap:8}}>
                  <button className="btn btn-primary">Create Meeting</button>
                  <button className="btn">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Planner (admin) ── */}
        {isAdmin && outerTab==="planner" && (
          <div>
            <div className="planner-header">
              <div>
                <div className="planner-title">✨ Meeting Planner</div>
                <div className="planner-sub">Auto-generated agendas and smart probing questions.</div>
              </div>
              <div className="ctrl-right">
                <select className="sel" value={meetingType} onChange={e=>setMeetingType(e.target.value)}>
                  <option value="daily">Daily call</option>
                  <option value="alternate">Alternate-day call</option>
                </select>
                <select className="sel" value={team} onChange={e=>setTeam(e.target.value)}>
                  {TEAMS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <select className="sel" value={rangeKey} onChange={e=>setRangeKey(e.target.value)}>
                  {RANGES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
            </div>

            {/* Stat cards */}
            <div className="stat-grid">
              <StatCard emoji="👥" label="Team"        value={teamUsers.length}      />
              <StatCard emoji="✅" label="Done"        value={stats.done}            />
              <StatCard emoji="🔄" label="In progress" value={stats.inProgress}      />
              <StatCard emoji="📋" label="Pending"     value={stats.pending}         />
              <StatCard emoji="🔥" label="Overdue"     value={stats.overdue}         />
              <StatCard emoji="🕒" label="Stale >2d"   value={stats.stale}           />
              <StatCard emoji="⚠️" label="Blockers"    value={stats.blockersCount}   />
            </div>

            {/* Inner tabs */}
            <div className="inner-tabs">
              {["questions","people","tasks","agenda","blockers","notes"].map(t=>(
                <button key={t} className={`itab${innerTab===t?" active":""}`} onClick={()=>setInnerTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* Questions */}
            {innerTab==="questions" && (
              <>
                <div className="ai-banner">
                  <div className="ai-left">
                    <span>✨</span>
                    <span style={{fontWeight:600}}>AI-powered question generator</span>
                    <span style={{fontSize:12,color:"#6b7280"}}>Generate sharper, role-aware probing questions</span>
                  </div>
                  <button className="btn btn-primary btn-sm">Generate with AI</button>
                </div>
                {perPerson.length===0
                  ? <p style={{fontSize:13,color:"#6b7280"}}>No team members in scope.</p>
                  : <div className="pgrid">
                      {perPerson.map(({user:u,questions,tasks:ut,reports:ur})=>(
                        <div className="card" key={u.id}>
                          <div className="card-head">
                            <span style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6}}>❓ {u.name}</span>
                            <Badge cls="bdg-outline">{roleMap[u.id]??"—"}</Badge>
                          </div>
                          <div className="card-body">
                            <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                              <Badge cls="bdg-sec">{ut.length} open</Badge>
                              {ur.length===0 && <Badge cls="sev-high">No standup</Badge>}
                            </div>
                            {questions.map((q,i)=>(
                              <div key={i} className={`q-item ${sevCls(q.severity)}`}>
                                <div className="q-row">
                                  <span className="q-tag">{q.tag}</span>
                                  <span className="q-text">{q.q}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </>
            )}

            {/* People */}
            {innerTab==="people" && (
              <div className="pgrid">
                {perPerson.length===0
                  ? <p style={{fontSize:13,color:"#6b7280"}}>No team members.</p>
                  : perPerson.map(({user:u,tasks:ut,reports:ur})=>{
                      const comp = ur.flatMap(r=>r.completed||[]);
                      const prio = ur.flatMap(r=>r.priorities||[]);
                      const pvd  = prio.length>0 ? Math.round((comp.length/prio.length)*100) : null;
                      return (
                        <div className="card" key={u.id}>
                          <div className="card-head">
                            <span style={{fontWeight:600,fontSize:13}}>{u.name}</span>
                            <Badge cls="bdg-outline">{roleMap[u.id]??"—"}</Badge>
                          </div>
                          <div className="card-body" style={{fontSize:12}}>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                              <Badge cls="bdg-sec">Done {ut.filter(t=>t.status==="done").length}</Badge>
                              <Badge cls="bdg-sec">In progress {ut.filter(t=>t.status==="in_progress").length}</Badge>
                              <Badge cls="bdg-sec">Pending {ut.filter(t=>t.status==="pending").length}</Badge>
                              {pvd!==null && <Badge cls={pvd>=80?"sev-low":pvd>=40?"sev-med":"sev-high"}>{pvd}% plan</Badge>}
                            </div>
                            <div style={{fontWeight:600,color:"#059669",marginBottom:3}}>Did ({range.label})</div>
                            {comp.length ? <ul style={{paddingLeft:16}}>{comp.slice(0,4).map((c,i)=><li key={i}>{c}</li>)}</ul> : <p style={{color:"#9ca3af"}}>No standup data</p>}
                            <div style={{fontWeight:600,color:"#2563eb",marginTop:8,marginBottom:3}}>Plan</div>
                            {prio.length ? <ul style={{paddingLeft:16}}>{prio.slice(0,4).map((c,i)=><li key={i}>{c}</li>)}</ul> : <p style={{color:"#9ca3af"}}>—</p>}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* Tasks */}
            {innerTab==="tasks" && (
              <div className="card">
                <div className="card-head"><span className="card-title">Open & recently-touched tasks</span></div>
                <div style={{overflowX:"auto"}}>
                  <table className="tbl">
                    <thead>
                      <tr>{["Owner","Task","Status","Priority","Due","Last update","Health"].map(h=><th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {teamTasks.length===0
                        ? <tr><td colSpan={7} style={{textAlign:"center",padding:24,color:"#9ca3af"}}>No tasks in scope.</td></tr>
                        : teamTasks.slice().sort((a,b)=>{
                            const now=new Date();
                            const ao=a.due_date&&new Date(a.due_date)<now&&a.status!=="done"?0:1;
                            const bo=b.due_date&&new Date(b.due_date)<now&&b.status!=="done"?0:1;
                            return ao!==bo?ao-bo:new Date(a.updated_at)-new Date(b.updated_at);
                          }).map(t=>{
                            const now=new Date();
                            const isOv=t.due_date&&new Date(t.due_date)<now&&t.status!=="done";
                            const ad=diffDays(now,new Date(t.updated_at));
                            const ah=diffHours(now,new Date(t.updated_at));
                            const isSt=t.status!=="done"&&ad>=2;
                            return (
                              <tr key={t.id}>
                                <td>{userMap[t.assigned_to]?.name??"—"}</td>
                                <td style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</td>
                                <td><Badge cls="bdg-outline">{t.status.replace("_"," ")}</Badge></td>
                                <td><Badge cls="bdg-sec">{t.priority}</Badge></td>
                                <td>{t.due_date?fmtDate(t.due_date,"MMM d"):"—"}</td>
                                <td>{ad>=1?`${ad}d ago`:`${ah}h ago`}</td>
                                <td>
                                  {isOv&&<Badge cls="sev-high">🔥 overdue</Badge>}
                                  {isSt&&!isOv&&<Badge cls="sev-med">🕒 stale</Badge>}
                                  {!isOv&&!isSt&&t.status!=="done"&&<Badge cls="sev-low" style={{background:"#dcfce7",color:"#15803d",borderColor:"#bbf7d0"}}>on track</Badge>}
                                  {t.status==="done"&&<Badge cls="bdg-sec">done</Badge>}
                                </td>
                              </tr>
                            );
                          })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Agenda */}
            {innerTab==="agenda" && (
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Generated Agenda</span>
                  <div style={{display:"flex",gap:6}}>
                    <button className="btn btn-sm" onClick={copyAgenda}>📋 Copy</button>
                    <button className="btn btn-sm" onClick={()=>window.print()}>🖨 Print</button>
                  </div>
                </div>
                <div className="card-body"><pre className="agenda-pre">{agenda}</pre></div>
              </div>
            )}

            {/* Blockers */}
            {innerTab==="blockers" && (
              <div className="card">
                <div className="card-body">
                  {teamReports.filter(r=>r.blockers).length===0
                    ? <p style={{fontSize:13,color:"#6b7280"}}>No blockers reported 🎉</p>
                    : teamReports.filter(r=>r.blockers).map(r=>(
                        <div className="blk-item" key={r.id}>
                          <div className="blk-name">{userMap[r.user_id]?.name??"Unknown"} <span style={{fontWeight:400,fontSize:11,color:"#9ca3af"}}>· {fmtDate(r.report_date,"MMM d")}</span></div>
                          <div className="blk-text">{r.blockers}</div>
                        </div>
                      ))
                  }
                </div>
              </div>
            )}

            {/* Notes */}
            {innerTab==="notes" && (
              <div className="card">
                <div className="card-body">
                  <textarea className="notes-ta" rows={8} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add discussion points, decisions, action items..."/>
                  <p className="notes-hint">Notes get appended to the agenda automatically.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" title="New meeting">+</button>
    </>
  );
}