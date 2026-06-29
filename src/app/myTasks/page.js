"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTasks, isToday, isOverdue, isUpcoming, friendlyDate, dueLabel, PRIO_COLORS, STATUS_META } from "../../components/client/TaskContext";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";
import { useAuth } from "../../components/client/AuthContext";

function cn(...classes) { return classes.filter(Boolean).join(" "); }

function Badge({ children, className = "" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// ─── Custom Select Dropdown ───────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, width = "w-44" }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 240) {
        setStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: rect.width, zIndex: 9999 });
      } else {
        setStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: rect.width, zIndex: 9999 });
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
        <button
          key={opt.value}
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => { onChange(opt.value); setOpen(false); }}
          className={cn(
            "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
            opt.value === value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
          )}
        >
          {opt.dot && (
            <span className="inline-block h-3.5 w-3.5 rounded-full shrink-0 border border-white/60" style={{ background: opt.dot }} />
          )}
          <span className="flex-1 text-left">{opt.label}</span>
          {opt.value === value && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium text-gray-700 bg-white transition-colors",
          open ? "border-blue-400 ring-2 ring-blue-50" : "border-gray-200 hover:border-gray-300",
          width
        )}
      >
        {selected?.dot && (
          <span className="inline-block h-3.5 w-3.5 rounded-full shrink-0 border border-white/60" style={{ background: selected.dot }} />
        )}
        <span className="flex-1 text-left">{selected?.label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && createPortal(dropdown, document.body)}
    </div>
  );
}

const PRIORITY_FILTER_OPTIONS = [
  { value: "all",    label: "All priorities" },
  { value: "urgent", label: "Urgent",  dot: "#ef4444" },
  { value: "high",   label: "High",    dot: "#f97316" },
  { value: "medium", label: "Medium",  dot: "#3b82f6" },
  { value: "low",    label: "Low",     dot: "#d1d5db" },
];

const SORT_OPTIONS = [
  { value: "due_asc",      label: "Due date ↑" },
  { value: "due_desc",     label: "Due date ↓" },
  { value: "priority",     label: "Priority" },
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc",  label: "Oldest first" },
  { value: "title",        label: "Title (A–Z)" },
];

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ open, onClose, editTask, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "self",
  });
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const priorityRef = useRef(null);
  const assignRef = useRef(null);

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || "",
        description: editTask.description || "",
        priority: editTask.priority || "medium",
        due_date: editTask.due_date ? editTask.due_date.substring(0, 10) : "",
        assigned_to: editTask.assigned_to || "self",
      });
    } else {
      setForm({ title: "", description: "", priority: "medium", due_date: "", assigned_to: "self" });
    }
  }, [editTask, open]);

  useEffect(() => {
    const handler = (e) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target)) setPriorityOpen(false);
      if (assignRef.current && !assignRef.current.contains(e.target)) setAssignOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!open) return null;

  const PRIORITY_OPTIONS = [
    { value: "low",    label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high",   label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const ASSIGN_OPTIONS = [
    { value: "self",       label: "Myself" },
    { value: "teammate1",  label: "Teammate 1" },
    { value: "teammate2",  label: "Teammate 2" },
  ];

  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === form.priority);
  const selectedAssign = ASSIGN_OPTIONS.find((a) => a.value === form.assigned_to) || ASSIGN_OPTIONS[0];

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      due_date: form.due_date ? new Date(`${form.due_date}T23:59:59`).toISOString() : null,
      assigned_to: form.assigned_to,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900">{editTask ? "Edit task" : "New daily task"}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{editTask ? "Update the details of your task." : "Capture something you need to get done."}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Title *</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-blue-400 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-50"
              placeholder="What do you need to get done?"
              value={form.title}
              maxLength={200}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Description</label>
              <button type="button" className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-blue-500 hover:bg-blue-50 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
                AI refine
              </button>
            </div>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
              placeholder="Optional details, links, context…"
              value={form.description}
              maxLength={2000}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Priority</label>
              <div className="relative" ref={priorityRef}>
                <button
                  type="button"
                  onClick={() => setPriorityOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 hover:border-gray-300 focus:outline-none focus:border-blue-400"
                >
                  <span>{selectedPriority?.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {priorityOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm({ ...form, priority: opt.value }); setPriorityOpen(false); }}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors",
                          form.priority === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span>{opt.label}</span>
                        {form.priority === opt.value && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Due (optional)</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Assign to</label>
            <div className="relative" ref={assignRef}>
              <button
                type="button"
                onClick={() => setAssignOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 hover:border-gray-300 focus:outline-none focus:border-blue-400"
              >
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {selectedAssign.label}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {assignOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {ASSIGN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setForm({ ...form, assigned_to: opt.value }); setAssignOpen(false); }}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors",
                        form.assigned_to === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        {opt.label}
                      </span>
                      {form.assigned_to === opt.value && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {editTask ? "Save changes" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DoneModal({ open, task, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState("");
  useEffect(() => { if (open) setRemarks(""); }, [open]);
  if (!open || !task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Mark as done</h2>
        <p className="mt-0.5 text-sm text-gray-500">Add an optional remark about how "{task.title}" was completed.</p>
        <textarea
          autoFocus
          rows={4}
          className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
          placeholder="e.g. Shipped fix in PR #123, verified on staging."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-400">Remarks are visible on the completed task.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => { onConfirm(remarks); onClose(); }} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
            Mark as done
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ open, task, onClose, onConfirm }) {
  if (!open || !task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Delete this task?</h2>
        <p className="mt-2 text-sm text-gray-500">"{task.title}" will be permanently removed. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => { onConfirm(task.id); onClose(); }} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({ t, onEdit, onDelete, onMarkDone, onSetStatus }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const statusRef = useRef(null);
  const buttonRef = useRef(null);

  const overdue = isOverdue(t);
  const isDone = t.status === "done";
  const due = dueLabel(t.due_date, t.status);
  const dueTone = due.tone === "danger" ? "text-red-500" : due.tone === "warning" ? "text-amber-500" : "text-gray-400";

  const STATUS_OPTIONS = [
    { value: "pending",     label: "Pending" },
    { value: "in_progress", label: "In progress" },
    { value: "done",        label: "Done" },
    { value: "cancelled",   label: "Cancelled" },
  ];

  useEffect(() => {
    const handler = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!statusOpen) return;
    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 160) {
        setDropdownStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, width: 144, zIndex: 9999 });
      } else {
        setDropdownStyle({ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, width: 144, zIndex: 9999 });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [statusOpen]);

  const accent = isDone
    ? "border-l-4 border-l-emerald-500 bg-emerald-50/40"
    : overdue
    ? "border-l-4 border-l-red-500 bg-red-50/60"
    : t.status === "in_progress"
    ? "border-l-4 border-l-blue-500 bg-blue-50/40"
    : t.status === "cancelled"
    ? "border-l-4 border-l-gray-300 bg-gray-50/40"
    : "border-l-4 border-l-amber-400 bg-amber-50/30";

  const dropdown = (
    <div style={dropdownStyle} className="overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => { setStatusOpen(false); onSetStatus(t.id, opt.value); }}
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
            t.status === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <span>{opt.label}</span>
          {t.status === opt.value && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("border-b border-gray-100 px-5 py-4 last:border-0 transition-colors hover:bg-gray-50/60", accent, isDone && "opacity-75")}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => isDone ? onSetStatus(t.id, "pending") : onMarkDone(t)}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            isDone ? "border-emerald-500 bg-emerald-500" : "border-gray-300 hover:border-blue-400"
          )}
          aria-label={isDone ? "Reopen" : "Mark done"}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="2 6 5 9 10 3"/>
            </svg>
          )}
        </button>

        <div className="flex flex-1 flex-wrap items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn("font-medium text-gray-900", isDone && "line-through text-gray-400")}>{t.title}</span>
              <Badge className={cn("capitalize", PRIO_COLORS[t.priority])}>{t.priority}</Badge>
              <Badge className={STATUS_META[t.status]?.color}>{STATUS_META[t.status]?.label}</Badge>
              <Badge className="bg-gray-50 text-gray-500 border-gray-200">Self</Badge>
            </div>

            {t.description && <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{t.description}</p>}

            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
              {due.label && (
                <span className={cn("flex items-center gap-1 font-medium", dueTone)}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {due.label}
                </span>
              )}
              {t.completed_at && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Done {friendlyDate(t.completed_at)}
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-400">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Created {friendlyDate(t.created_at)}
              </span>
            </div>

            {t.completion_remarks && (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                <span className="font-semibold">Remarks:</span> {t.completion_remarks}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5" ref={statusRef}>
            {!isDone && (
              <>
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => setStatusOpen((o) => !o)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white pl-3 pr-2 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:border-blue-400"
                >
                  {STATUS_OPTIONS.find((s) => s.value === t.status)?.label ?? "Pending"}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {statusOpen && createPortal(dropdown, document.body)}
              </>
            )}

            {isDone && (
              <button
                onClick={() => onSetStatus(t.id, "pending")}
                className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.87"/>
                </svg>
                Reopen
              </button>
            )}

            <button onClick={() => onEdit(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            <button onClick={() => onDelete(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ items, empty, onEdit, onDelete, onMarkDone, onSetStatus, showAdd, onAdd }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col items-center px-5 py-14 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="mb-3">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <p className="text-sm text-gray-400">{empty}</p>
          {showAdd && (
            <button onClick={onAdd} className="mt-4 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add a task
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {items.map((t) => (
        <TaskRow key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} onMarkDone={onMarkDone} onSetStatus={onSetStatus} />
      ))}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overdue",   label: "Due / Overdue", icon: "🔥" },
  { id: "today",     label: "Today",         icon: "📅" },
  { id: "upcoming",  label: "Upcoming",      icon: "🕐" },
  { id: "all",       label: "All open",      icon: "☰"  },
  { id: "history",   label: "History",       icon: "🕑" },
  { id: "delegated", label: "Assigned by me",icon: "📤" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, loaded, addTask, updateTask, deleteTask, markDone, setStatus } = useTasks();

  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState("overdue");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due_asc");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [doneTarget, setDoneTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false); // ← ADDED for FAB
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowForm(true); setEditTask(null); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setSearch(""); setShowForm(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const PRIO_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tasks.filter((t) => t.assigned_to === "self" || t.assigned_to === currentUser?.id);
    if (q) list = list.filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    list = [...list].sort((a, b) => {
      if (sortBy === "due_asc") { const ax = a.due_date ? new Date(a.due_date).getTime() : Infinity; const bx = b.due_date ? new Date(b.due_date).getTime() : Infinity; return ax - bx; }
      if (sortBy === "due_desc") { const ax = a.due_date ? new Date(a.due_date).getTime() : -Infinity; const bx = b.due_date ? new Date(b.due_date).getTime() : -Infinity; return bx - ax; }
      if (sortBy === "priority") return (PRIO_RANK[a.priority] ?? 9) - (PRIO_RANK[b.priority] ?? 9);
      if (sortBy === "created_desc") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "created_asc") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "title") return (a.title ?? "").localeCompare(b.title ?? "");
      return 0;
    });
    return list;
  }, [tasks, search, priorityFilter, sortBy]);

  const buckets = useMemo(() => {
    const open = filtered.filter((t) => t.status !== "done" && t.status !== "cancelled");
    return {
      overdue:   open.filter((t) => isOverdue(t) && !isToday(t.due_date)),
      today:     open.filter((t) => isToday(t.due_date)),
      upcoming:  open.filter((t) => isUpcoming(t) && !isToday(t.due_date)),
      all:       open,
      history:   filtered.filter((t) => t.status === "done" || t.status === "cancelled"),
      delegated: tasks.filter((t) => t.assigned_to !== "self" && t.assigned_to !== currentUser?.id),
    };
  }, [filtered, tasks, currentUser]);

  const totals = useMemo(() => {
    const mine = tasks.filter((t) => t.assigned_to === "self");
    return {
      open:       mine.filter((t) => t.status !== "done" && t.status !== "cancelled").length,
      inProgress: mine.filter((t) => t.status === "in_progress").length,
      overdue:    mine.filter((t) => isOverdue(t)).length,
      done:       mine.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  const handleSave = (payload) => { if (editTask) { updateTask(editTask.id, payload); } else { addTask(payload); } };
  const handleMarkDone = (task) => { if (!task) return; setDoneTarget(task); };
  const handleConfirmDone = async (remarks) => {
    if (!doneTarget) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/tasks/${doneTarget.id}/mark-done`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completion_remarks: remarks || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local task state
        setStatus(doneTarget.id, "done");
      }
    } catch (err) {
      console.error("Failed to mark done:", err);
    }
    setDoneTarget(null);
  };
  const handleSetStatus = (id, status) => {
    if (status === "done") { const t = tasks.find((x) => x.id === id); if (t) setDoneTarget(t); }
    else { setStatus(id, status); }
  };
  const openEdit = (t) => { setEditTask(t); setShowForm(true); };
  const openNew  = () => { setEditTask(null); setShowForm(true); };

  const EMPTY_MSGS = {
    overdue:   "🎉 Nothing overdue. Great job staying on top of things!",
    today:     "Nothing scheduled for today. Plan your day in 30 seconds.",
    upcoming:  "No upcoming tasks. You're all clear ahead.",
    all:       "No open tasks. Inbox zero!",
    history:   "No completed tasks yet — your wins will show up here.",
    delegated: "You haven't assigned any tasks to teammates yet.",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold text-gray-900">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            My tasks
          </h1>
          <p className="mt-1 text-sm text-gray-400">Plan your day, track progress, keep a full history.</p>
        </div>
        {/* "Add task" header button → opens TaskModal (full form) */}
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add task
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open" value={totals.open} accent="text-blue-500"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
        />
        <StatCard label="In Progress" value={totals.inProgress} accent="text-blue-400"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Overdue" value={totals.overdue} accent="text-red-500"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
        />
        <StatCard label="Completed" value={totals.done} accent="text-emerald-500"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border text-gray-700 border-gray-200 bg-white pl-9 pr-12 text-sm outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-50"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">/</kbd>
        </div>
        <CustomSelect value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_FILTER_OPTIONS} width="w-44" />
        <CustomSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} width="w-40" />
        {(priorityFilter !== "all" || sortBy !== "due_asc" || search) && (
          <button
            onClick={() => { setPriorityFilter("all"); setSortBy("due_asc"); setSearch(""); }}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-100 bg-gray-100/60 p-1">
          {TABS.map((t) => {
            const count = buckets[t.id]?.length ?? 0;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all", active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                <span>{t.icon}</span>
                {t.label}
                <span className={cn("ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-500")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <Section
            items={buckets[tab] ?? []}
            empty={EMPTY_MSGS[tab]}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onMarkDone={handleMarkDone}
            onSetStatus={handleSetStatus}
            showAdd={["today", "upcoming", "all"].includes(tab)}
            onAdd={openNew}
          />
        </div>
      </div>

      {/* Hotkey hints */}
      <div className="flex justify-end gap-3 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono">N</kbd> new</span>
        <span className="flex items-center gap-1"><kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono">/</kbd> search</span>
        <span className="flex items-center gap-1"><kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono">Esc</kbd> close</span>
      </div>

      {/* ── FAB → opens AddQuickTaskDrawer ── */}
      <button
        onClick={() => setDrawerOpen(true)} // ← CHANGED (was: onClick={openNew})
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
        title="Add a quick task"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Modals */}
      <TaskModal open={showForm} onClose={() => { setShowForm(false); setEditTask(null); }} editTask={editTask} onSave={handleSave} />
      <DoneModal open={!!doneTarget} task={doneTarget} onClose={() => setDoneTarget(null)} onConfirm={handleConfirmDone} />
      <DeleteModal open={!!deleteTarget} task={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteTask} />

      {/* ── Quick Task Drawer (FAB) ── */}
      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> {/* ← ADDED */}
    </div>
  );
}