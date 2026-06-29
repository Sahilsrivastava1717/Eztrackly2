"use client";

import { useState, useEffect } from "react";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";
import { useAuth } from "../../components/client/AuthContext";
import ProtectedRoute from "../../components/client/ProtectedRoute";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
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

// ── tiny helpers ──────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function diffHours(a, b) {
  return Math.floor((new Date(a) - new Date(b)) / 3600000);
}
function isNew(d) {
  return diffHours(new Date(), new Date(d.created_at)) < 48;
}

// ── icons ─────────────────────────────────────────────────────────────────────
function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
function IconFile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function IconExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/>
    </svg>
  );
}

// ── custom select ─────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, padding: "8px 14px", borderRadius: 8,
          border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          background: "#fff", fontSize: 14, color: "#111827",
          cursor: "pointer", minWidth: 160, outline: "none",
          boxShadow: open ? "0 0 0 3px #dbeafe" : "none",
        }}
      >
        <span>{current?.label}</span>
        <IconChevron />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 20,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.10)", minWidth: 180, overflow: "hidden"
          }}>
            {options.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", fontSize: 14, cursor: "pointer",
                  background: value === o.value ? "#eff6ff" : "transparent",
                  color: value === o.value ? "#2563eb" : "#111827",
                }}
              >
                {o.label}
                {value === o.value && (
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

// ── modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, onSaveFile, onSaveLink, submitting }) {
  const [title, setTitle] = useState("");
  const [desc,  setDesc]  = useState("");
  const [link,  setLink]  = useState("");
  const [file,  setFile]  = useState(null);

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim()) { alert("Title is required"); return; }
    if (!file && !link.trim()) { alert("Provide a file or a link"); return; }
    if (file) onSaveFile({ title, desc, file });
    else onSaveLink({ title, desc, link });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
        padding: "28px 28px 24px", position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,.18)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Add a document or link</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#6b7280", padding: 4, borderRadius: 6 }}>
            <IconClose />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 6 }}>Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Q4 Sales Playbook"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid #2563eb", fontSize: 14, outline: "none",
              boxSizing: "border-box", color: "#111827", boxShadow: "0 0 0 3px #dbeafe"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 6 }}>Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid #e5e7eb", fontSize: 14, resize: "vertical",
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 6 }}>
            File (PDF, DOCX, XLSX, image, etc.)
          </label>
          <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px 14px", fontSize: 14, color: "#374151", background: "#fafafa" }}>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ fontSize: 14 }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 6 }}>
            Or Link (Google Docs, Sheets, Drive, etc.)
          </label>
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none",
              boxSizing: "border-box", color: "#111827"
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: "9px 22px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={submitting} style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── document card ─────────────────────────────────────────────────────────────
function DocCard({ doc, currentUserId, onDelete }) {
  const newDoc = isNew(doc);
  const canDelete = doc.uploaded_by === currentUserId;
  const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : null;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
      padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,.04)"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {doc.file_url ? <IconFile /> : <IconLink />}
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{doc.title}</span>
          {newDoc && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#2563eb", background: "#eff6ff", borderRadius: 999, padding: "2px 8px" }}>
              <IconSparkle /> NEW
            </span>
          )}
        </div>
        {canDelete && (
          <button onClick={() => onDelete(doc)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <IconTrash />
          </button>
        )}
      </div>

      {doc.description && (
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {doc.description}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {doc.file_type && (
          <span style={{ fontSize: 11, background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "3px 9px", fontWeight: 500 }}>{doc.file_type}</span>
        )}
        {doc.link_url && (
          <span style={{ fontSize: 11, border: "1px solid #e5e7eb", color: "#374151", borderRadius: 6, padding: "3px 9px", fontWeight: 500, background: "#fff" }}>Link</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginTop: "auto", paddingTop: 4 }}>
        <span>By {doc.uploader_name || "Unknown"}</span>
        <span>{fmtDate(doc.created_at)}</span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {fileUrl && (
          <a href={`${fileUrl}?token=${localStorage.getItem("token")}`} target="_blank" rel="noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", background: "#fff" }}>
            <IconDownload /> Download
          </a>
        )}
        {doc.link_url && (
          <a href={doc.link_url} target="_blank" rel="noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", background: "#fff" }}>
            <IconExternal /> Open
          </a>
        )}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
function DocumentsContent() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy,     setSortBy]     = useState("newest");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load documents on mount
  useEffect(() => {
    apiFetch("/api/v1/documents")
      .then(data => setDocs(data.documents ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Upload file
  const handleSaveFile = async ({ title, desc, file }) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      if (desc) formData.append("description", desc);
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw await res.json();
      const newDoc = await res.json();
      setDocs(prev => [newDoc, ...prev]);
      setModalOpen(false);
    } catch (err) {
      alert(err.detail || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Save link
  const handleSaveLink = async ({ title, desc, link }) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      if (desc) formData.append("description", desc);
      formData.append("link_url", link);

      const res = await fetch(`${API_BASE}/api/v1/documents/link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw await res.json();
      const newDoc = await res.json();
      setDocs(prev => [newDoc, ...prev]);
      setModalOpen(false);
    } catch (err) {
      alert(err.detail || "Failed to save link");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    try {
      await apiFetch(`/api/v1/documents/${doc.id}`, { method: "DELETE" });
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      alert(err.detail || "Delete failed");
    }
  };

  const filtered = docs
    .filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q) || (d.uploader_name || "").toLowerCase().includes(q);
      const matchType = typeFilter === "all" || (typeFilter === "file" && d.file_url) || (typeFilter === "link" && d.link_url && !d.file_url) || (typeFilter === "new" && isNew(d));
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "title")  return a.title.localeCompare(b.title);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const TYPE_OPTIONS = [
    { value: "all",  label: "All types"      },
    { value: "file", label: "Files only"     },
    { value: "link", label: "Links only"     },
    { value: "new",  label: "New (last 48h)" },
  ];
  const SORT_OPTIONS = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "title",  label: "Title (A–Z)"  },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .docs-page { padding: 24px; min-height: 100vh; background: transparent; }
        .docs-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
        .docs-title { font-size: 24px; font-weight: 700; color: #111827; }
        .docs-sub   { font-size: 14px; color: #6b7280; margin-top: 3px; }
        .btn-add { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; border: none; background: #2563eb; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(37,99,235,.35); white-space: nowrap; }
        .btn-add:hover { background: #1d4ed8; }
        .filters-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 24px; }
        .search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 480px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .search-input { width: 100%; padding: 9px 14px 9px 38px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: 14px; outline: none; color: #111827; }
        .search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
        .search-input::placeholder { color: #9ca3af; }
        .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .empty-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 60px 24px; text-align: center; color: #9ca3af; font-size: 14px; grid-column: 1 / -1; }
        @media(max-width: 600px) { .docs-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="docs-page">
        <div className="docs-header">
          <div>
            <div className="docs-title">Team Documents</div>
            <div className="docs-sub">Shared files and links visible to the whole team.</div>
          </div>
          <button className="btn-add" onClick={() => setModalOpen(true)}>
            <IconUpload /> Add Document
          </button>
        </div>

        <div className="filters-row">
          <div className="search-wrap">
            <span className="search-icon"><IconSearch /></span>
            <input className="search-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <CustomSelect value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
          <CustomSelect value={sortBy}     onChange={setSortBy}     options={SORT_OPTIONS} />
        </div>

        {loading ? (
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="docs-grid"><div className="empty-card">No documents yet.</div></div>
        ) : (
          <div className="docs-grid">
            {filtered.map(d => (
              <DocCard key={d.id} doc={d} currentUserId={user?.id} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveFile={handleSaveFile}
        onSaveLink={handleSaveLink}
        submitting={submitting}
      />

      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
        title="Add a quick task"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsContent />
    </ProtectedRoute>
  );
}