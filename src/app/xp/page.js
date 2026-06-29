"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../components/client/AuthContext";
import ProtectedRoute from "../../components/client/ProtectedRoute";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }
function subMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() - n); return r; }
function fmtMonth(d) { return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
function fmtMonthFull(d) { return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function fmtYM(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function fmtDateTime(iso) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

// ─── XP helpers ───────────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 500, 700, 950, 1250, 1600, 2000];
const LEVEL_TITLES = ["Newcomer","Starter","Explorer","Contributor","Performer","Achiever","Champion","Expert","Elite","Legend","Master"];
function getLevel(xp) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1; else break;
  }
  level = Math.min(level, 10);
  const current = LEVEL_THRESHOLDS[level - 1];
  const next = level < 10 ? LEVEL_THRESHOLDS[level] : LEVEL_THRESHOLDS[10];
  const progress = level >= 10 ? 100 : Math.round(((xp - current) / (next - current)) * 100);
  const toNext = level >= 10 ? 0 : next - xp;
  return { level, progress, toNext };
}
function getLevelTitle(level) { return LEVEL_TITLES[Math.min(level, 10) - 1] ?? "Newcomer"; }

const EVENT_LABELS = {
  task_completed:        { label: "Task completed",         emoji: "✅" },
  standup_submitted:     { label: "Daily standup",          emoji: "🌅" },
  eod_submitted:         { label: "EOD report",             emoji: "🌇" },
  checkin_ontime:        { label: "On-time check-in",       emoji: "⏰" },
  weekly_completion:     { label: "Weekly completion bonus",emoji: "🎯" },
  overdue_penalty:       { label: "Overdue task",           emoji: "⏳" },
  missed_standup:        { label: "Missed standup",         emoji: "🚫" },
  missed_eod:            { label: "Missed EOD",             emoji: "🚫" },
  late_checkin:          { label: "Late check-in",          emoji: "⚠️" },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success: m => add(m, "success"), error: m => add(m, "error") };
}
function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center">
      {toasts.map(t => (
        <div key={t.id} className={cn("flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg text-white",
          t.type === "success" ? "bg-emerald-500" : "bg-red-500")}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-pink-500","bg-emerald-500","bg-orange-500","bg-red-500","bg-teal-500","bg-indigo-500"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||"").length; i++) h = ((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function AvatarCircle({ src, name, size = "h-9 w-9", textSize = "text-sm" }) {
  if (src) return <img src={src} alt={name||""} className={cn("rounded-full object-cover shrink-0", size)} />;
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", size, textSize, avatarColor(name))}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}

function LevelBadge({ xp, size = "md" }) {
  const { level } = getLevel(xp);
  const title = getLevelTitle(level);
  if (size === "sm") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      Lv {level} {title}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-white">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      Lv {level} {title}
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Trophy:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  Sparkles:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
  TrendingUp:(p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Award:     (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Calendar:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  ChevronDown:(p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
};

// ─── UI primitives ────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return <div className={cn("rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>{children}</div>;
}
function CardHeader({ children, className = "" }) { return <div className={cn("px-5 pt-5 pb-3", className)}>{children}</div>; }
function CardTitle({ children, className = "" }) {
  return <h2 className={cn("text-base font-semibold text-gray-900 flex items-center gap-2", className)}>{children}</h2>;
}
function CardContent({ children, className = "" }) { return <div className={cn("px-5 pb-5", className)}>{children}</div>; }
function Badge({ children, variant = "default", className = "" }) {
  const v = {
    default:     "bg-gray-100 text-gray-700 border border-gray-200",
    secondary:   "bg-amber-50 text-amber-700 border border-amber-200",
    destructive: "bg-red-50 text-red-600 border border-red-200",
    outline:     "bg-white text-gray-600 border border-gray-200",
    positive:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", v[variant] || v.default, className)}>{children}</span>;
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options = [], placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const ref = useRef(null);
  const btnRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      if (spaceBelow < 220) setStyle({ position: "fixed", bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, zIndex: 9999 });
      else setStyle({ position: "fixed", top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
    }
    setOpen(o => !o);
  };
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button ref={btnRef} type="button" onClick={toggle}
        className={cn("flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors", open && "border-blue-400 ring-2 ring-blue-50")}>
        <span>{selected?.label ?? placeholder}</span>
        <Icon.ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div style={style} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg py-1">
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn("flex w-full items-center px-4 py-2.5 text-sm text-left transition-colors",
                value === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50")}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Breakdown Popover ────────────────────────────────────────────────────────
function BreakdownPopover({ name, xp, periodLabel, breakdown, recents }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const ref = useRef(null);
  const btnRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setStyle({ position: "fixed", top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 300), width: 288, zIndex: 9999 });
    }
    setOpen(o => !o);
  };
  const { level } = getLevel(xp);
  return (
    <div ref={ref} className="relative inline-block">
      <button ref={btnRef} type="button" onClick={toggle} className="hover:scale-105 transition-transform">
        <LevelBadge xp={xp} size="sm" />
      </button>
      {open && (
        <div style={style} className="rounded-2xl border border-gray-100 bg-white shadow-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-900">{name} · Lv {level}</span>
            <span className="text-xs text-gray-400">{xp} XP · {periodLabel}</span>
          </div>
          <div className="text-xs text-gray-400 mb-2">Breakdown · {periodLabel}</div>
          {Object.keys(breakdown).length === 0 ? (
            <p className="text-xs text-gray-400">No XP this period.</p>
          ) : (
            <ul className="space-y-1 mb-3">
              {Object.entries(breakdown)
                .sort((a, b) => Math.abs(b[1].points) - Math.abs(a[1].points))
                .map(([type, b]) => {
                  const meta = EVENT_LABELS[type] ?? { label: type, emoji: "⭐" };
                  return (
                    <li key={type} className="flex items-center justify-between text-xs">
                      <span>{meta.emoji} {meta.label} <span className="text-gray-400">×{b.count}</span></span>
                      <Badge variant={b.points < 0 ? "destructive" : "secondary"} className="font-bold">
                        {b.points > 0 ? "+" : ""}{b.points}
                      </Badge>
                    </li>
                  );
                })}
            </ul>
          )}
          {recents.length > 0 && (
            <>
              <div className="text-xs text-gray-400 border-t pt-2 mb-1">Recent</div>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {recents.map(e => {
                  const meta = EVENT_LABELS[e.event_type] ?? { label: e.event_type, emoji: "⭐" };
                  return (
                    <li key={e.id} className="flex items-start gap-2 text-[11px]">
                      <span>{meta.emoji}</span>
                      <span className="flex-1 min-w-0 truncate text-gray-700">{e.reason ?? meta.label}</span>
                      <span className={cn("font-semibold", e.points < 0 ? "text-red-600" : "text-emerald-600")}>
                        {e.points > 0 ? "+" : ""}{e.points}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reward tile ──────────────────────────────────────────────────────────────
function Reward({ emoji, label, pts, extra, negative }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-800 truncate">{label}</div>
        {extra && <div className="text-[10px] text-gray-400 mt-0.5">{extra}</div>}
      </div>
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold border",
        negative ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
        {pts}
      </span>
    </div>
  );
}

// ─── Team Fairness Panel ──────────────────────────────────────────────────────
function TeamFairnessPanel({ rows, periodLabel }) {
  const teamLabel = (t) => ({
    admin: "👑 Admin", sales: "💼 Sales", seo: "🔍 SEO",
    content_writer: "✍️ Content", developer: "💻 Developers", unassigned: "Unassigned",
  }[t] ?? t);

  return (
    <Card>
      <CardHeader>
        <CardTitle><Icon.Trophy className="h-4 w-4 text-emerald-500" />Team fairness — completion rate</CardTitle>
        <p className="text-xs text-gray-500 mt-0.5">Period: {periodLabel}</p>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No team data yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <li key={r.team} className="flex items-center gap-3 px-5 py-4">
                <span className="w-8 text-center text-xs font-bold text-gray-400">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{teamLabel(r.team)}</span>
                    <Badge variant="outline">{r.members} member{r.members === 1 ? "" : "s"}</Badge>
                  </div>
                  <div className="h-2 mt-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all",
                      r.rate >= 80 ? "bg-emerald-500" : r.rate >= 50 ? "bg-amber-500" : "bg-red-400")}
                      style={{ width: `${r.rate}%` }} />
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {r.done_on_time}/{r.due} on-time · avg {r.avg_xp} XP per member
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">{r.rate}%</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Period tabs ──────────────────────────────────────────────────────────────
const PERIODS = [
  { value: "current_month", label: "This month" },
  { value: "7d",            label: "7 days"      },
  { value: "30d",           label: "30 days"     },
  { value: "all",           label: "All time"    },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
function XPContent() {
  const { user } = useAuth();
  const toast = useToast();

  const [period, setPeriod]           = useState("current_month");
  const [customMonth, setCustomMonth] = useState(fmtYM(new Date()));
  const [myXP, setMyXP]               = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [fairness, setFairness]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fairnessLabel, setFairnessLabel] = useState("");

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, i);
      return { value: fmtYM(d), label: fmtMonth(d) };
    });
  }, []);

  const periodLabel = period === "all" ? "All time"
    : period === "7d" ? "Last 7 days"
    : period === "30d" ? "Last 30 days"
    : period === "current_month" ? fmtMonthFull(new Date())
    : monthOptions.find(m => m.value === customMonth)?.label ?? customMonth;

  // Build query string
  const qs = (extra = {}) => {
    const params = new URLSearchParams({ period, ...extra });
    if (period === "custom_month") params.set("custom_month", customMonth);
    return params.toString();
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch(`/api/v1/xp/me?${qs()}`),
      apiFetch(`/api/v1/xp/leaderboard?${qs()}`),
      apiFetch(`/api/v1/xp/team-fairness?${qs()}`),
    ])
      .then(([me, lb, tf]) => {
        setMyXP(me);
        setLeaderboard(lb.entries ?? []);
        setFairness(tf.rows ?? []);
        setFairnessLabel(tf.period_label ?? "");
      })
      .catch(err => toast.error(err.detail || "Failed to load XP data"))
      .finally(() => setLoading(false));
  }, [period, customMonth]);

  const me = myXP ? getLevel(myXP.period_xp) : { level: 1, progress: 0, toNext: 50 };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <ToastContainer toasts={toast.toasts} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Icon.Trophy className="h-6 w-6 text-amber-500" />
            XP & Leaderboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Earn points across every team — tasks, standups, attendance, and deals.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-0.5">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  period === p.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                {p.label}
              </button>
            ))}
            <button onClick={() => setPeriod("custom_month")}
              className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                period === "custom_month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <Icon.Calendar className="h-3 w-3" />Pick month
            </button>
          </div>
          {period === "custom_month" && (
            <CustomSelect value={customMonth} onChange={setCustomMonth} options={monthOptions} className="w-40" />
          )}
        </div>
      </div>

      {/* My XP Card */}
      {myXP && (
        <div className="overflow-hidden rounded-2xl border-2 border-purple-100 shadow-sm">
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-amber-50 p-6">
            <div className="flex flex-wrap items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl ring-4 ring-white">
                    {me.level}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-300 shadow">/10</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Your level · {periodLabel}</div>
                  <div className="text-2xl font-extrabold text-gray-900">{getLevelTitle(me.level)}</div>
                  <div className="text-sm text-gray-500">
                    {myXP.period_xp} XP this period · {me.level >= 10 ? "Max level reached 🏆" : `${me.toNext} XP to next`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">All-time XP: <span className="font-semibold text-gray-700">{myXP.total_xp}</span></div>
                </div>
              </div>
              <div className="flex-1 min-w-[220px] max-w-md">
                <div className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                  <span>Level {me.level}</span>
                  <span>{me.level >= 10 ? "MAX" : `Level ${me.level + 1}`}</span>
                </div>
                <div className="h-4 bg-white/60 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all rounded-full" style={{ width: `${me.progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{me.progress}%</span>
                  <span>Resets monthly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How to earn */}
      <Card>
        <CardHeader><CardTitle><Icon.Sparkles className="h-4 w-4 text-blue-500" />How to earn XP</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Reward emoji="✅" label="Task by priority" pts="+5 / +10 / +20 / +35" extra="low → urgent (effort-weighted)" />
            <Reward emoji="⏱️" label="On-time multiplier" pts="×1.5" extra="finished by due date" />
            <Reward emoji="🐢" label="Late multiplier" pts="×0.5" extra="finished after due date" />
            <Reward emoji="🛑" label="Daily task cap" pts="60 → 0.4× · 120 max" extra="prevents farming many tiny tasks" />
            <Reward emoji="🎯" label="Weekly completion bonus" pts="+10 / +25 / +40" extra="60% / 80% / 95% of due tasks done on time" />
            <Reward emoji="🌅" label="Daily standup" pts="+5" />
            <Reward emoji="🌇" label="EOD report" pts="+5" />
            <Reward emoji="⏰" label="On-time check-in" pts="+10" />
          </div>
        </CardContent>
      </Card>

      {/* Team Fairness */}
      <TeamFairnessPanel rows={fairness} periodLabel={fairnessLabel || periodLabel} />

      {/* How you lose XP */}
      <Card className="border-red-100">
        <CardHeader><CardTitle><span className="text-amber-500">⚠️</span> How you lose XP</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Reward negative emoji="⏳" label="Overdue task" pts="−2/day" extra="high/urgent only · capped at −20" />
            <Reward negative emoji="🚫" label="Missed standup" pts="−5" extra="working day, after 9pm cutoff" />
            <Reward negative emoji="🚫" label="Missed EOD" pts="−5" extra="working day, after 9pm cutoff" />
            <Reward negative emoji="⚠️" label="Late check-in" pts="0 / −5 / −10" extra="1st free · 2nd −5 · 3rd+ −10" />
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard + My Recent */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle><Icon.TrendingUp className="h-4 w-4 text-gray-600" />Your ranking</CardTitle>
            <span className="text-xs text-gray-400">{periodLabel}</span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-5 text-sm text-gray-400">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">No XP earned yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {leaderboard.map((p, i) => {
                  const isMe = p.id === user?.id;
                  return (
                    <li key={p.id} className={cn("flex items-center gap-3 px-5 py-3", isMe && "bg-blue-50/50")}>
                      <span className="w-6 text-center text-xs font-bold text-gray-400">#{i + 1}</span>
                      <AvatarCircle name={p.full_name || p.username} size="h-9 w-9" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">
                            {p.full_name || p.username}
                            {isMe && <span className="text-xs text-blue-500"> (you)</span>}
                          </span>
                          <BreakdownPopover
                            name={p.full_name || p.username}
                            xp={p.period_xp}
                            periodLabel={periodLabel}
                            breakdown={p.breakdown ?? {}}
                            recents={p.recents ?? []}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(p.breakdown ?? {})
                            .sort((a, b) => Math.abs(b[1].points) - Math.abs(a[1].points))
                            .slice(0, 5)
                            .map(([type, b]) => {
                              const meta = EVENT_LABELS[type] ?? { emoji: "⭐" };
                              return (
                                <span key={type} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {meta.emoji} {b.count}× <span className={b.points < 0 ? "text-red-500" : ""}>({b.points > 0 ? "+" : ""}{b.points})</span>
                                </span>
                              );
                            })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-gray-900 tabular-nums">{p.period_xp > 0 ? "+" : ""}{p.period_xp}</div>
                        <div className="text-[10px] text-gray-400 uppercase">period</div>
                        <div className="text-[10px] text-gray-400 tabular-nums">total {p.total_xp}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* My recent XP */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle><Icon.Award className="h-4 w-4 text-gray-600" />My recent XP</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {!myXP || myXP.recent_events.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">No XP yet. Complete a task or check in on time!</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {myXP.recent_events.map(e => {
                  const meta = EVENT_LABELS[e.event_type] ?? { label: e.event_type, emoji: "⭐" };
                  return (
                    <li key={e.id} className="flex items-start gap-2.5 px-5 py-3 text-sm">
                      <span className="text-lg leading-none mt-0.5 shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{e.reason ?? meta.label}</div>
                        <div className="text-xs text-gray-400">{fmtDateTime(e.created_at)}</div>
                      </div>
                      <Badge variant={e.points < 0 ? "destructive" : "secondary"} className="shrink-0 font-bold">
                        {e.points > 0 ? "+" : ""}{e.points}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <XPContent />
    </ProtectedRoute>
  );
}