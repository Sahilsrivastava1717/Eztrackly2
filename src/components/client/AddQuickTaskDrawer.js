"use client";

import { useState, useEffect, useRef } from "react";
import { useTasks } from "./TaskContext";

// ── helpers ────────────────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low",    dot: "bg-green-400" },
  { value: "medium", label: "Medium", dot: "bg-yellow-400" },
  { value: "high",   label: "High",   dot: "bg-orange-500" },
  { value: "urgent", label: "Urgent", dot: "bg-red-500" },
];

const TODAY_ISO = new Date().toISOString().substring(0, 10);

// ── Component ──────────────────────────────────────────────────────────────────
export default function AddQuickTaskDrawer({ open, onClose }) {
  const { addTask } = useTasks();

  const [form, setForm] = useState({
    title: "",
    notes: "",
    assignTo: "myself",
    category: "",
    priority: "medium",
    due_date: TODAY_ISO,
    link: "",
    file: null,
  });
  const [saving, setSaving] = useState(false);
  const [prioOpen, setPrioOpen] = useState(false);

  const titleRef = useRef(null);
  const prioRef  = useRef(null);

  // Reset form whenever drawer opens
  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        notes: "",
        assignTo: "myself",
        category: "",
        priority: "medium",
        due_date: TODAY_ISO,
        link: "",
        file: null,
      });
      setSaving(false);
      setPrioOpen(false);
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close priority dropdown on outside click
  useEffect(() => {
    if (!prioOpen) return;
    const handler = (e) => {
      if (prioRef.current && !prioRef.current.contains(e.target)) {
        setPrioOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [prioOpen]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) { titleRef.current?.focus(); return; }
    setSaving(true);
    addTask({
      title: form.title.trim(),
      description: form.notes.trim(),
      priority: form.priority,
      due_date: form.due_date ? new Date(`${form.due_date}T23:59:59`).toISOString() : null,
      category: form.category.trim() || null,
      link_url: form.link.trim() || null,
      assigned_to: "self",
      assigned_by: "self",
    });
    setSaving(false);
    onClose();
  };

  const selectedPrio = PRIORITY_OPTIONS.find((p) => p.value === form.priority);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="
          fixed left-1/2 top-1/2 z-[101]
          w-full max-w-[450px]
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl bg-white shadow-2xl
          max-h-[90vh] flex flex-col
          animate-in fade-in zoom-in-95
        "
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-2 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Add a quick task</h2>
            </div>
            <p className="mt-1.5 text-sm text-gray-500">
              Captures a personal to-do for your day. Tasks appear in{" "}
              <span className="font-semibold text-gray-700">My Tasks</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Title</label>
            <input
              ref={titleRef}
              type="text"
              placeholder="e.g. Follow up with Acme Corp"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              maxLength={200}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Notes{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-blue-500 hover:bg-blue-50 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01L12 2z"/>
                </svg>
                AI refine
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Any details, links or context..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors"
            />
          </div>

          {/* Assign to */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <label className="text-sm font-semibold text-gray-800">Assign to</label>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <select
                value={form.assignTo}
                onChange={(e) => set("assignTo", e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 pl-10 pr-10 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white transition-colors"
              >
                <option value="myself">Myself</option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">

            {/* Category */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                <label className="text-sm font-semibold text-gray-800">
                  Category{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Sales, Follow-up"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors"
              />
            </div>

            {/* Priority — custom dropdown */}
            <div ref={prioRef} className="relative">
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <label className="text-sm font-semibold text-gray-800">Priority</label>
              </div>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => setPrioOpen((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 bg-white transition-colors outline-none",
                  prioOpen
                    ? "border-blue-400 ring-2 ring-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn("h-3 w-3 rounded-full inline-block flex-shrink-0", selectedPrio?.dot)} />
                  {selectedPrio?.label}
                </span>
                <svg
                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  className={cn("text-gray-400 transition-transform duration-150 flex-shrink-0", prioOpen && "rotate-180")}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown panel */}
              {prioOpen && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-100 bg-white shadow-lg py-1 overflow-hidden">
                  {PRIORITY_OPTIONS.map((p) => {
                    const isSelected = form.priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => { set("priority", p.value); setPrioOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                          isSelected
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-gray-800 hover:bg-gray-50"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={cn("h-3.5 w-3.5 rounded-full inline-block flex-shrink-0", p.dot)} />
                          {p.label}
                        </span>
                        {isSelected && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Due date */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <label className="text-sm font-semibold text-gray-800">Due date</label>
            </div>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
              className="w-full rounded-xl border border-blue-400 ring-2 ring-blue-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors bg-white"
            />
          </div>

          {/* Link */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <label className="text-sm font-semibold text-gray-800">
                Link{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
            </div>
            <input
              type="url"
              placeholder="https://..."
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors"
            />
          </div>

          {/* Attach file */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <label className="text-sm font-semibold text-gray-800">
                Attach file{" "}
                <span className="font-normal text-gray-400">(optional, max 10MB)</span>
              </label>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 bg-white">
              <label className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap">
                Choose File
                <input
                  type="file"
                  className="hidden"
                  accept="*/*"
                  onChange={(e) => set("file", e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-sm text-gray-400 truncate">
                {form.file ? form.file.name : "No file chosen"}
              </span>
            </div>
          </div>

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-white">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || saving}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-md"
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