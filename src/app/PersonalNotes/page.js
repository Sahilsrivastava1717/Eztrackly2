"use client";

import { useState } from "react";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";

function cn(...classes) { return classes.filter(Boolean).join(" "); }

// ─── Color definitions ────────────────────────────────────────────────────────
const COLORS = {
  yellow:  { bg: "bg-yellow-100",  border: "border-yellow-200",  swatch: "bg-yellow-200"  },
  pink:    { bg: "bg-pink-100",    border: "border-pink-200",    swatch: "bg-pink-200"    },
  blue:    { bg: "bg-blue-100",    border: "border-blue-200",    swatch: "bg-blue-200"    },
  mint:    { bg: "bg-teal-100",    border: "border-teal-200",    swatch: "bg-teal-200"    },
  purple:  { bg: "bg-purple-100",  border: "border-purple-200",  swatch: "bg-purple-200"  },
  peach:   { bg: "bg-orange-100",  border: "border-orange-200",  swatch: "bg-orange-200"  },
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
            "flex-1 bg-transparent text-lg font-bold text-gray-900 outline-none placeholder:text-gray-400 min-w-0",
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
            /* Filled pin */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="text-gray-700">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          ) : (
            /* Unpin / pin-off icon matching the reference image */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
              <line x1="2" y1="2" x2="22" y2="22"/>
              <path d="M16.5 16.5L12 21l-7-7 4.5-4.5"/>
              <path d="M8.4 8.4L5 5l4-4 3.4 3.4"/>
              <path d="M17.8 11.8L20 14l-3 3-2.2-2.2"/>
              <path d="M12 12l-1.5-1.5"/>
            </svg>
          )}
        </button>
      </div>

      {/* Text area */}
      <textarea
        rows={6}
        className={cn(
          "mx-4 resize-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400",
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
            // First swatch (yellow/active default) shows as dark outlined circle matching reference
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
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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

  const create = () => {
    const newNote = {
      id: Date.now().toString(),
      title: "Untitled",
      content: "",
      color: "yellow",
      pinned: false,
      updated_at: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const update = (id, patch) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
      )
    );
  };

  const remove = (id) => {
    if (!window.confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
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
              {/* Sticky note / file icon matching reference */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
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
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New note
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
       
            {/* Quick Task Drawer */}
            <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          </div>
  );
}