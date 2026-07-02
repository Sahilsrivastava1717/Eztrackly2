"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";
import ProtectedRoute from "../../components/client/ProtectedRoute";
import { useAuth } from "../../components/client/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  if (!res.ok) throw await res.json();
  if (res.status === 204) return null;
  return res.json();
}

function cn(...classes) { return classes.filter(Boolean).join(" "); }

// ─── Category & Status meta ───────────────────────────────────────────────────
const CATEGORY_META = {
  blog_post: {
    label: "Blog post",
    color: "bg-blue-50 border-blue-200 text-blue-600",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  social_post: {
    label: "Social post",
    color: "bg-pink-50 border-pink-200 text-pink-600",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  website_copy: {
    label: "Website copy",
    color: "bg-emerald-50 border-emerald-200 text-emerald-600",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  other: {
    label: "Other",
    color: "bg-purple-50 border-purple-200 text-purple-600",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
};

const STATUS_META = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600 border-gray-200" },
  in_review: { label: "In review", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700 border-blue-200" },
  published: { label: "Published", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "title", label: "Title (A–Z)" },
  { value: "words", label: "Word count" },
];

const PLATFORMS = [
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
];

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, className = "" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function CustomDropdown({ value, onChange, options, prefix, width = "w-44" }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (false) {
        setStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: rect.width, zIndex: 9999 });
      } else {
        setStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: rect.width, zIndex: 9999 });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const dropdown = (
    <div style={style} className="overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
      {options.map((opt) => (
        <button key={opt.value} type="button" onMouseDown={(e) => e.stopPropagation()}
          onClick={() => { onChange(opt.value); setOpen(false); }}
          className={cn("flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors",
            opt.value === value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50")}>
          <span className="flex-1 text-left">{opt.label}</span>
          {opt.value === value && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button ref={btnRef} type="button" onClick={() => setOpen((o) => !o)}
        className={cn("flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium text-gray-700 bg-white transition-colors",
          open ? "border-blue-400 ring-2 ring-blue-50" : "border-gray-200 hover:border-gray-300", width)}>
        {prefix && <span className="text-gray-400 shrink-0">{prefix}</span>}
        <span className="flex-1 text-left truncate">{selected?.label}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-blue-100">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </span>
  );
}

// ─── New Document Modal ───────────────────────────────────────────────────────
function NewDocModal({ open, onClose, onCreate }) {
  const [category, setCategory] = useState("blog_post");
  const [catOpen, setCatOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("twitter");
  const [customCategory, setCustomCategory] = useState("");
  const [brief, setBrief] = useState("");
  const [creating, setCreating] = useState(false);
  const catRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (!open) { setTitle(""); setBrief(""); setCustomCategory(""); setCategory("blog_post"); } }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onCreate({ category, title: title.trim(), platform, customCategory, brief });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900">Create content</h2>
        <p className="mt-0.5 text-sm text-gray-500">Choose the content type and add the key details before opening the editor.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Content type</label>
            <div className="relative" ref={catRef}>
              <button type="button" onClick={() => setCatOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 hover:border-gray-300 focus:outline-none">
                <span>{CATEGORY_META[category]?.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {catOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <button key={key} type="button" onClick={() => { setCategory(key); setCatOpen(false); }}
                      className={cn("flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors",
                        category === key ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50")}>
                      <span>{meta.label}</span>
                      {category === key && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Title</label>
            <input autoFocus
              className="w-full rounded-lg border border-blue-400 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-50"
              placeholder="Enter title" value={title} maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {category === "blog_post" && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Creation date: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}

          {category === "social_post" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400">
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          )}

          {category === "other" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Content type name</label>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400"
                placeholder="e.g. Case study" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Brief</label>
              <button type="button" className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-blue-500 hover:bg-blue-50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                AI refine
              </button>
            </div>
            <textarea rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
              placeholder="Audience, goal, keywords, or notes" value={brief} onChange={(e) => setBrief(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim() || creating}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {creating ? "Creating…" : "Open editor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Delete this document?</h2>
        <p className="mt-2 text-sm text-gray-500">This permanently removes the document. This action can't be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} disabled={deleting} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Doc Row (list view) ──────────────────────────────────────────────────────
function DocRow({ doc, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const meta = CATEGORY_META[doc.category];
  const sm = STATUS_META[doc.status];
  const Icon = meta?.icon;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 9999 });
    setMenuOpen(true);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:shadow-md hover:border-gray-200">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-blue-400 opacity-0 transition-opacity group-hover:opacity-100 rounded-l-xl" />
      <div className="flex items-center gap-4 px-4 py-4">
        <Link href={`/content/${doc.id}`} className="flex flex-1 items-center gap-4 min-w-0">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105", meta?.color)}>
            {Icon && <Icon />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-gray-900">{doc.title}</span>
              {doc.share_enabled && (
                <Badge className="bg-blue-50 text-blue-600 border-blue-200 gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Shared
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <Badge className={cn("text-[11px]", sm?.color)}>{sm?.label}</Badge>
              <span>{doc.word_count ?? 0} words</span>
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDate(doc.created_at)}
              </span>
              <span>· Updated {timeAgo(doc.updated_at)}</span>
            </div>
          </div>
        </Link>
        <div ref={menuRef}>
          <button ref={btnRef} onClick={openMenu}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && createPortal(
            <div style={menuStyle} className="overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg w-36">
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => { setMenuOpen(false); onDelete(doc.id); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Delete
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Doc Card (grid view) ─────────────────────────────────────────────────────
function DocCard({ doc, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const meta = CATEGORY_META[doc.category];
  const sm = STATUS_META[doc.status];
  const Icon = meta?.icon;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setMenuStyle({ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 9999 });
    setMenuOpen(true);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="px-3 pb-3 pt-2">
        <Link href={`/content/${doc.id}`} className="block">
          <div className="flex items-start justify-between gap-2">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border transition-transform group-hover:scale-105", meta?.color)}>
              {Icon && <Icon />}
            </div>
            <Badge className={cn("text-[11px]", sm?.color)}>{sm?.label}</Badge>
          </div>
          <h3 className="mt-3 line-clamp-2 font-semibold text-gray-900">{doc.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            <span>{doc.word_count ?? 0} words</span>
            <span>· {formatDate(doc.created_at)}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">Updated {timeAgo(doc.updated_at)}</div>
        </Link>
        <div className="mt-3 flex justify-end border-t border-gray-100 pt-2" ref={menuRef}>
          <button ref={btnRef} onClick={openMenu}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && createPortal(
            <div style={menuStyle} className="overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg w-36">
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => { setMenuOpen(false); onDelete(doc.id); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                </svg>
                Delete
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ContentPageContent() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scope, setScope] = useState("mine");
  const [sortBy, setSortBy] = useState("updated");
  const [view, setView] = useState("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);

  // Date Picker States
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("any");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dateRef = useRef(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope, sort_by: sortBy });
      if (catFilter !== "all") params.set("category", catFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const data = await apiFetch(`/api/v1/content?${params}`);
      setDocs(data.documents ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [scope, sortBy, catFilter, statusFilter, search]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setCreateOpen(true); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setSearch(""); setCreateOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const closePopup = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateOpen(false);
      }
    };

    document.addEventListener("mousedown", closePopup);

    return () => document.removeEventListener("mousedown", closePopup);
  }, []);

  const handleCreate = async (details) => {
    try {
      const newDoc = await apiFetch("/api/v1/content", {
        method: "POST",
        body: JSON.stringify({
          title: details.title,
          category: details.category,
          platform: details.platform,
          custom_category: details.customCategory,
          brief: details.brief,
        }),
      });
      setCreateOpen(false);
      await loadDocs();
    } catch (err) {
      alert(err.detail || "Failed to create document");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/content/${deleteId}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.detail || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const activeFilterCount = (catFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (search ? 1 : 0);
  const clearFilters = () => { setCatFilter("all"); setStatusFilter("all"); setSearch(""); };

  const categoryCounts = Object.keys(CATEGORY_META).reduce((acc, cat) => {
    acc[cat] = docs.filter((d) => d.category === cat).length;
    return acc;
  }, {});

  const reviewCount = docs.filter((d) => d.assigned_reviewer_id === user?.id && d.owner_id !== user?.id).length;

  const SCOPE_TABS = [
    { v: "mine", label: "My docs" },
    { v: "review", label: "📥 To review", badge: reviewCount },
    { v: "shared", label: "🤝 Shared with me" },
    { v: "all", label: "All" },
  ];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const totalDays = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const previousMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  const isSameDate = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const handleToday = () => {
    const today = new Date();

    setSelectedPreset("today");
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleLast7 = () => {
    setSelectedPreset("last7");
  };

  const handleLast30 = () => {
    setSelectedPreset("last30");
  };

  const handleAnyDate = () => {
    setSelectedPreset("any");
  };

  const handleDateSelect = (day) => {
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    setSelectedDate(d);
    setSelectedPreset("custom");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-sm">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-800">Workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Content <span className="text-blue-500">studio</span>
            </h1>
            <p className="mt-1 text-sm text-gray-800">
              {docs.length} {docs.length === 1 ? "document" : "documents"} · drafts, social posts and website copy.
            </p>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 hover:-translate-y-0.5 transition-all">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New document
          </button>
        </div>
      </div>

      {/* ── Category cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const Icon = meta.icon;
          const count = categoryCounts[cat] ?? 0;
          const active = catFilter === cat;
          return (
            <button key={cat} onClick={() => setCatFilter(active ? "all" : cat)}
              className={cn("group relative overflow-hidden text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-gray-100 bg-white hover:border-blue-200")}>
              <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 transition-opacity",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
              <div className="flex items-start justify-between">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border transition-transform group-hover:scale-110", meta.color)}>
                  <Icon />
                </div>
                <span className="text-xl font-bold text-gray-300">{count}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-800">{meta.label}</div>
              <div className="text-xs text-gray-400">{count === 1 ? "document" : "documents"}</div>
            </button>
          );
        })}
      </div>

      {/* ── Scope tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {SCOPE_TABS.map((t) => (
          <button key={t.v} onClick={() => setScope(t.v)}
            className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
              scope === t.v
                ? "border-blue-300 bg-blue-50 text-blue-600 shadow-sm"
                : "border-gray-200 bg-white text-black-800 hover:bg-blue-200 hover:border-blue-200")}>
            {t.label}
            {t.badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold text-amber-700">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title…"
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={dateRef}>
              <button
                onClick={() => setDateOpen(!dateOpen)}
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 hover:border-blue-300"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>

                {selectedPreset === "today"
                  ? "Today"
                  : selectedPreset === "last7"
                    ? "Last 7 Days"
                    : selectedPreset === "last30"
                      ? "Last 30 Days"
                      : selectedPreset === "custom"
                        ? selectedDate.toLocaleDateString()
                        : "Any date"}

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dateOpen && (
                <div className="absolute left-0 top-12 z-50 w-[285px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-200 p-3">
                    <button
                      onClick={handleAnyDate}
                      className={cn(
                        "mb-1 flex h-10 w-full items-center rounded-xl px-4 text-sm transition",
                        selectedPreset === "any"
                          ? "bg-blue-100 font-medium text-blue-600"
                          : "hover:bg-gray-100 hover:rounded-full"
                      )}
                    >
                      Any date
                    </button>

                    <button
                      onClick={handleToday}
                      className={cn(
                        "mb-1 flex h-10 w-full items-center rounded-xl px-4 text-sm transition",
                        selectedPreset === "today"
                          ? "bg-blue-100 font-medium text-blue-600"
                          : "hover:bg-gray-100 hover:rounded-full"
                      )}
                    >
                      Today
                    </button>

                    <button
                      onClick={handleLast7}
                      className={cn(
                        "mb-1 flex h-10 w-full items-center rounded-xl px-4 text-sm transition",
                        selectedPreset === "last7"
                          ? "border-2 border-blue-500 bg-blue-50 font-medium text-blue-600"
                          : "hover:bg-gray-100 hover:rounded-full"
                      )}
                    >
                      Last 7 Days
                    </button>

                    <button
                      onClick={handleLast30}
                      className={cn(
                        "flex w-full items-center rounded-lg px-3 py-2 text-sm",
                        selectedPreset === "last30"
                          ? "bg-blue-100 font-semibold text-blue-600"
                          : "hover:bg-gray-100 hover:rounded-full"
                      )}
                    >
                      Last 30 Days
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        onClick={previousMonth}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      </button>

                      <h3 className="font-semibold">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>

                      <button
                        onClick={nextMonth}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium text-gray-500 mb-2">
                      {weekDays.map(day => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={"blank" + i}></div>
                      ))}

                      {Array.from({ length: totalDays }).map((_, index) => {
                        const day = index + 1;

                        const date = new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth(),
                          day
                        );

                        const today = new Date();

                        const diff =
                          Math.floor(
                            (today.setHours(0, 0, 0, 0) -
                              new Date(date).setHours(0, 0, 0, 0))
                            / 86400000
                          );

                        let range = false;

                        if (selectedPreset === "last7")
                          range = diff >= 0 && diff < 7;

                        if (selectedPreset === "last30")
                          range = diff >= 0 && diff < 30;

                        const active =
                          selectedPreset === "today"
                            ? isSameDate(date, new Date())
                            : selectedPreset === "custom"
                              ? isSameDate(date, selectedDate)
                              : false;

                        return (
                          <button
                            key={day}
                            onClick={() => handleDateSelect(day)}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",

                              active &&
                              "bg-blue-500 text-white font-semibold",

                              !active &&
                              range &&
                              "bg-blue-100 text-blue-600",

                              !active &&
                              !range &&
                              "hover:bg-gray-100"
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <CustomDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} width="w-36" />
            <CustomDropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS}
              prefix={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>}
              width="w-44" />
            <div className="inline-flex items-center rounded-lg border border-gray-600 bg-white p-0.5 shadow-sm">
              <button onClick={() => setView("list")}
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  view === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-800")} title="List view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button onClick={() => setView("grid")}
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  view === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600")} title="Grid view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
            <svg className="text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Filters:</span>
            {search && <FilterChip label={`"${search}"`} onClear={() => setSearch("")} />}
            {catFilter !== "all" && <FilterChip label={CATEGORY_META[catFilter]?.label} onClear={() => setCatFilter("all")} />}
            {statusFilter !== "all" && <FilterChip label={STATUS_META[statusFilter]?.label} onClear={() => setStatusFilter("all")} />}
            <button onClick={clearFilters} className="ml-1 text-[11px] font-medium text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Doc list / grid ── */}
      <div className={cn("gap-3", view === "list" ? "grid" : "grid sm:grid-cols-2 lg:grid-cols-3")}>
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && docs.length === 0 && (
          <div className={cn(view === "grid" && "sm:col-span-2 lg:col-span-3",
            "rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-16 text-center")}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-800">
              {activeFilterCount > 0 ? "No documents match your filters" : "No documents yet"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {activeFilterCount > 0 ? "Try clearing filters." : "Click New document to get started."}
            </p>
            {activeFilterCount > 0 ? (
              <button onClick={clearFilters} className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Clear filters
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New document
              </button>
            )}
          </div>
        )}

        {!loading && docs.map((doc) =>
          view === "list"
            ? <DocRow key={doc.id} doc={doc} onDelete={setDeleteId} />
            : <DocCard key={doc.id} doc={doc} onDelete={setDeleteId} />
        )}
      </div>

      {/* ── FAB ── */}
      <button onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
        title="Add a quick task">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <NewDocModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />

      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} deleting={deleting} />
    </div>
  );
}

export default function ContentPage() {
  return (
    <ProtectedRoute>
      <ContentPageContent />
    </ProtectedRoute>
  );
}