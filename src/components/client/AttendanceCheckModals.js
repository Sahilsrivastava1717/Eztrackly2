"use client";

import { useState, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════════════
   StandupModal — shown right after Check In
   ════════════════════════════════════════════════════════════════════════ */
export function StandupModal({ open, onSubmit, onSkip }) {
  const [priorities, setPriorities] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const updateAt = (idx, val) => {
    setPriorities((prev) => prev.map((p, i) => (i === idx ? val : p)));
  };
  const removeAt = (idx) => {
    setPriorities((prev) => prev.filter((_, i) => i !== idx));
  };
  const addMore = () => setPriorities((prev) => [...prev, ""]);

  const handleSubmit = async () => {
    const cleaned = priorities.map((p) => p.trim()).filter(Boolean);
    setSaving(true);
    try {
      await onSubmit(cleaned);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#f8fafc", borderRadius: 18, padding: "28px 26px 22px",
        width: "100%", maxWidth: 440,
        boxShadow: "0 30px 70px rgba(0,0,0,0.3)", position: "relative",
      }}>
        <button onClick={onSkip} style={{
          position: "absolute", top: 16, right: 16,
          background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
            background: "linear-gradient(135deg,#a855f7,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: "#111827", margin: 0 }}>
            Morning standup 🌟
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            What are your top priorities for today? Keep it focused — pick 3.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {priorities.map((val, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, background: "#ede9fe",
                color: "#7c3aed", fontWeight: 700, fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {idx + 1}
              </div>
              <input
                value={val}
                onChange={(e) => updateAt(idx, e.target.value)}
                placeholder={idx === 0 ? "Most important task today…" : `Priority ${idx + 1}`}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 10,
                  border: "1.5px solid " + (idx === 1 ? "#93c5fd" : "#e5e7eb"),
                  fontSize: 14, color: "#070c16", outline: "none",
                }}
              />
              {priorities.length > 1 && (
                <button onClick={() => removeAt(idx)} style={{
                  background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", flexShrink: 0,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addMore} style={{
          display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
          color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20, padding: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add another
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onSkip} disabled={saving} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: saving ? "not-allowed" : "pointer",
          }}>
            Skip for now
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex: 1.4, padding: "12px", borderRadius: 10, border: "none",
            background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />
            </svg>
            {saving ? "Saving…" : "Lock in priorities"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   WrapUpModal — shown right before Check Out completes
   ════════════════════════════════════════════════════════════════════════ */
const MOODS = [
  { val: "great", emoji: "😍", label: "Great" },
  { val: "good", emoji: "🙂", label: "Good" },
  { val: "okay", emoji: "😐", label: "Okay" },
  { val: "tough", emoji: "😟", label: "Tough" },
  { val: "rough", emoji: "😣", label: "Rough" },
];

// `dueTasks` = array of { id, title, priority, due_date, status }
// `standupPriorities` = array of strings the user set this morning (optional, shown as "Set by you")
export function WrapUpModal({ open, dueTasks = [], standupPriorities = [], onToggleTask, onSubmit, onSkip }) {
  const [completed, setCompleted] = useState([""]);
  const [blockers, setBlockers] = useState("");
  const [mood, setMood] = useState("good");
  const [saving, setSaving] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());

  const tasksByOrigin = useMemo(() => {
    // Prefer the reliable backend-tagged source over guessing by title text.
    // Tasks created from the morning standup are tagged source === "standup"
    // by the /api/v1/attendance/standup endpoint.
    const setByYou = dueTasks.filter((t) => t.source === "standup");
    const other = dueTasks.filter((t) => t.source !== "standup");
    if (setByYou.length > 0 || !standupPriorities?.length) return { setByYou, other };

    // Fallback for older tasks created before the source field existed —
    // fuzzy-match by title against this morning's typed priorities.
    const lower = standupPriorities.map((p) => p.toLowerCase().trim());
    const fallbackSetByYou = dueTasks.filter((t) => lower.includes((t.title || "").toLowerCase().trim()));
    const fallbackOther = dueTasks.filter((t) => !fallbackSetByYou.includes(t));
    return { setByYou: fallbackSetByYou, other: fallbackOther };
  }, [dueTasks, standupPriorities]);

  if (!open) return null;

  const toggleTask = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    onToggleTask?.(id);
  };

  const updateAt = (idx, val) => setCompleted((p) => p.map((c, i) => (i === idx ? val : c)));
  const removeAt = (idx) => setCompleted((p) => p.filter((_, i) => i !== idx));
  const addMore = () => setCompleted((p) => [...p, ""]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        completed: completed.map((c) => c.trim()).filter(Boolean),
        blockers: blockers.trim(),
        mood,
        completed_task_ids: Array.from(checkedIds),
      });
    } finally {
      setSaving(false);
    }
  };

  const renderTaskRow = (t) => (
    <label key={t.id} style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "10px 12px",
      cursor: "pointer",
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
    }}>
      <input
        type="checkbox"
        checked={checkedIds.has(t.id)}
        onChange={() => toggleTask(t.id)}
        style={{
          marginTop: 4,
          width: 16,
          height: 16,
          accentColor: "#2563eb",
          cursor: "pointer",
          flexShrink: 0,
        }} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, color: "#111827",
          textDecoration: checkedIds.has(t.id) ? "line-through" : "none",
          opacity: checkedIds.has(t.id) ? 0.55 : 1,
        }}>
          {t.title}
        </div>
        <div style={{ fontSize: 11, color: "black", marginTop: 1, textTransform: "capitalize" }}>
          {t.priority || "medium"}
          {t.due_date ? ` · due ${new Date(t.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}` : ""}
        </div>
      </div>
    </label>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#f8fafc", borderRadius: "24px",
        width: "100%", maxWidth: 460, maxHeight: "88vh", overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,0.3)", position: "relative",
      }}>
        <div
          style={{
            padding: "26px 18px 22px 24px",
            maxHeight: "88vh",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#9ca3af transparent",
          }}
        >
          <button onClick={onSkip} style={{
            position: "absolute", top: 16, right: 16,
            background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: "0 auto 12px",
              background: "linear-gradient(135deg,#10b981,#059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M8 21h8M12 17v4M17 3H7a2 2 0 0 0-2 2v3a7 7 0 0 0 14 0V5a2 2 0 0 0-2-2z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "#111827", margin: 0 }}>
              Wrap up your day 🌙
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Quick recap before you check out. Takes 30 seconds.
            </p>
          </div>


          {/* Today's plan — every task due today, whichever page it was added from
              (morning standup or the standalone My Tasks / quick-add drawer) */}
          {dueTasks.length > 0 && (
            <div style={{
              border: "1.5px dashed #c4b5fd", background: "#f5f3ff", borderRadius: 12,
              padding: "12px 14px", marginBottom: 14,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8,
              }}>
                <span>🎯 Today's plan</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dueTasks.map((t, i) => (
                  <div key={t.id ?? i} style={{
                    fontSize: 13.5, color: "#374151",
                    textDecoration: t.status === "done" ? "line-through" : "none",
                    opacity: t.status === "done" ? 0.55 : 1,
                  }}>
                    {i + 1}. {t.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks due today */}
          {dueTasks.length > 0 && (
            <div style={{
              border: "1.5px dashed #93c5fd", background: "#eff6ff", borderRadius: 12,
              padding: "12px 14px", marginBottom: 18,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8,
              }}>
                <span>📋 Tasks for today</span>
                <span style={{ fontWeight: 500, color: "#6b7280", textTransform: "none" }}>tap to mark done</span>
              </div>

              {tasksByOrigin.setByYou.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginTop: 4 }}>
                    Set by you ({tasksByOrigin.setByYou.length})
                  </div>
                  <div>{tasksByOrigin.setByYou.map(renderTaskRow)}</div>
                </>
              )}
              {tasksByOrigin.other.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginTop: 8 }}>
                    Other due today ({tasksByOrigin.other.length})
                  </div>
                  <div>{tasksByOrigin.other.map(renderTaskRow)}</div>
                </>
              )}
            </div>
          )}

          {/* What did you complete */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              🏆 What did you complete?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {completed.map((val, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <input
                    value={val}
                    onChange={(e) => updateAt(idx, e.target.value)}
                    placeholder="What got done today…"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #dbd6d6", placeholder: { color: "black", opacity: 1 }, fontSize: 14, outline: "none" }}
                  />
                  {completed.length > 1 && (
                    <button onClick={() => removeAt(idx)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addMore} style={{
              display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
              color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8, padding: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add another
            </button>
          </div>

          {/* Blockers */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              ⚠️ Any blockers? <span style={{ fontWeight: 500, color: "#9ca3af" }}>(optional)</span>
            </div>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="What's slowing you down or what you need help with…"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Mood */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              How was your day?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {MOODS.map((m) => (
                <button
                  key={m.val}
                  onClick={() => setMood(m.val)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "10px 4px", borderRadius: 10,
                    border: mood === m.val ? "2px solid #2563eb" : "1.5px solid #e5e7eb",
                    background: mood === m.val ? "#eff6ff" : "#fff",
                    cursor: "pointer", transition: "all .15s",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: mood === m.val ? "#2563eb" : "#6b7280" }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onSkip}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Skip
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 0.95, // changed from 1.6
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#007BFF",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              🏆 {saving ? "Submitting…" : "Submit & check out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}