"use client";
 
import { useState, useEffect } from "react";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";
 
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
 
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
 
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (!res.ok) throw await res.json();
  if (res.status === 204) return null;
  return res.json();
}
 
function cn(...classes) { return classes.filter(Boolean).join(" "); }
 
// ─── Color definitions ────────────────────────────────────────────────────────
const COLORS = {
  yellow: { bg: "bg-yellow-100", border: "border-yellow-200", swatch: "bg-yellow-200" },
  pink: { bg: "bg-pink-100", border: "border-pink-200", swatch: "bg-pink-200" },
  blue: { bg: "bg-blue-100", border: "border-blue-200", swatch: "bg-blue-200" },
  mint: { bg: "bg-teal-100", border: "border-teal-200", swatch: "bg-teal-200" },
  purple: { bg: "bg-purple-100", border: "border-purple-200", swatch: "bg-purple-200" },
  peach: { bg: "bg-orange-100", border: "border-orange-200", swatch: "bg-orange-200" },
};
 
const COLOR_KEYS = Object.keys(COLORS);
 
function formatNoteDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
 
// ─── Individual Note Card ─────────────────────────────────────────────────────
function NoteCard({ note, onUpdate, onDelete }) {
  const color = COLORS[note.color] || COLORS.yellow;
 
  return (
    <div className={cn(
      "flex flex-col rounded-2xl border shadow-sm transition-shadow hover:shadow-md",
      color.bg, color.border
    )}>
      {/* Header row: title + pin toggle */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-1">
        <input
          className={cn(
            "flex-1 bg-transparent text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 min-w-0 shadow-sm rounded-2xl",
            color.bg
          )}
          value={note.title}
          placeholder="Untitled"
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
        />
        <button
          onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
          title={note.pinned ? "Unpin" : "Pin"}
          className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {note.pinned ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-900"
            >
              <path d="M9 3a1 1 0 0 0-1 1v5L5 12v1h6v8h2v-8h6v-1l-3-3V4a1 1 0 0 0-1-1H9z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M14 4v5l3 3H7l3-3V4" />
              <path d="M12 12v8" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          )}
        </button>
      </div>
 
      {/* Text area */}
      <textarea
        rows={6}
        className={cn(
          "mx-5 my-2 h-[145px] w-[calc(100%-40px)] resize-none overflow-y-auto rounded-2xl bg-transparent px-3 py-2 text-sm text-gray-700 outline-none shadow-sm",
          color.bg
        )}
        value={note.content}
        placeholder="Write here..."
        onChange={(e) => onUpdate(note.id, { content: e.target.value })}
      />
 
      {/* Footer: color swatches + date + delete */}
      <div className={cn(
        "flex items-center justify-between gap-2 px-3 py-2.5 mt-2 border-t",
        color.border
      )}>
        {/* Color swatches */}
        <div className="flex items-center gap-1.5">
          {COLOR_KEYS.map((c, i) => {
            const isActive = note.color === c;
            const swatchColor = COLORS[c].swatch;
            return (
              <button
                key={c}
                onClick={() => onUpdate(note.id, { color: c })}
                title={c}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-all",
                  swatchColor,
                  isActive
                    ? "border-gray-800 scale-110"
                    : "border-transparent hover:border-gray-400 hover:scale-105"
                )}
              />
            );
          })}
        </div>
 
        {/* Date + delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-gray-400">{formatNoteDate(note.updated_at)}</span>
          <button
            onClick={() => onDelete(note.id)}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Delete note"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
 
  // Load notes from backend on mount
  useEffect(() => {
    apiFetch("/api/v1/notes")
      .then((data) => setNotes(data.notes ?? []))
      .catch(console.error);
  }, []);
 
  const create = async () => {
    try {
      const newNote = await apiFetch("/api/v1/notes", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled", content: "", color: "yellow", pinned: false }),
      });
      setNotes((prev) => [newNote, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };
 
  const update = (id, patch) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
      )
    );
    // Debounced auto-save
    clearTimeout(window.__noteSaveTimer?.[id]);
    if (!window.__noteSaveTimer) window.__noteSaveTimer = {};
    window.__noteSaveTimer[id] = setTimeout(() => {
      apiFetch(`/api/v1/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }).catch(console.error);
    }, 800);
  };
 
  const remove = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await apiFetch(`/api/v1/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };
 
  const filtered = notes
    .filter((n) => {
      const q = search.toLowerCase();
      return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
 
  return (
    <div className="min-h-screen bg-transparent px-6 py-6 pb-24">
      <div className="mx-auto max-w-7xl space-y-6">
 
        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Personal Notes
            </h1>
            <p className="mt-1 text-sm text-gray-400">Private notes — only you can see these.</p>
          </div>
          <button
            onClick={create}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New note
          </button>
        </div>
 
        {/* ── Search ── */}
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 shadow-sm"
          />
        </div>
 
        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-gray-400">
              {search ? `No notes match "${search}".` : 'No notes yet. Click "New note" to create one.'}
            </p>
          </div>
        )}
 
        {/* ── Notes grid ── */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onUpdate={update}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>
 
      {/* ── FAB ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
        title="Add a quick task"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
 
      {/* Quick Task Drawer */}
      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}