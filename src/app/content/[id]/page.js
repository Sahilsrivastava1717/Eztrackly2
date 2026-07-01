"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../components/client/ProtectedRoute";
import AddQuickTaskDrawer from "../../../components/client/AddQuickTaskDrawer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const CATEGORY_OPTIONS = [
  { value: "blog_post", label: "Blog post" },
  { value: "social_post", label: "Social post" },
  { value: "website_copy", label: "Website copy" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36", "48"];
const FONT_FAMILIES = ["Default", "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana"];
const TEXT_COLORS = ["black", "dimgray", "gray", "lightgray", "white", "red", "orange", "green", "blue", "purple", "coral", "teal",];
const HIGHLIGHT_COLORS = ["transparent", "yellow", "greenyellow", "aquamarine", "lightblue", "lightskyblue", "plum", "pink", "salmon", "burlywood", "gainsboro", "black",];

// ─── Top bar button style (matches image 3) ───────────────────────────────────
const topBtnCls = "flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors";

// ─── Toolbar helpers ──────────────────────────────────────────────────────────
function ToolbarDivider() { return <div className="h-8 w-px bg-gray-200 mx-2 shrink-0" />; }

function ToolbarBtn({ onClick, title, active, children }) {
  return (
    <button type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      className={`flex h-9 min-w-[34px] items-center justify-center rounded-md px-2 text-sm transition-colors shrink-0
        ${active ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
      {children}
    </button>
  );
}

function exec(cmd, value = null) { document.execCommand(cmd, false, value); }

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-gray-300"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ─── Share with teammates modal (image 1) ─────────────────────────────────────
function ShareModal({ onClose, docId }) {
  const [teammate, setTeammate] = useState("");
  const [collaborators] = useState([]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Share with teammates</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Add teammates to view or edit this document and leave comments.</p>

        {/* Add teammate input */}
        <div className="flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 px-3 py-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <input value={teammate} onChange={e => setTeammate(e.target.value)}
            placeholder="Add teammate..."
            className="flex-1 bg-transparent text-sm text-blue-600 placeholder:text-blue-400 outline-none font-medium" />
        </div>

        {/* No collaborators */}
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 mb-5">
          No collaborators yet.
        </div>

        <div className="flex justify-end">
          <button onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Public link / Share for review modal (image 2) ───────────────────────────
function PublicLinkModal({ onClose, docId, shareEnabled, onToggleShare }) {
  const [publicLink, setPublicLink] = useState(shareEnabled);
  const [allowComments, setAllowComments] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/share/${docId}`;

  const handleTogglePublic = async (val) => {
    setPublicLink(val);
    onToggleShare(val);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Share for review</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Anyone with the link can view this draft and leave comments.</p>

        {/* Public link toggle */}
        <div className="rounded-xl border border-gray-200 px-4 py-3.5 flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Public link</p>
            <p className="text-xs text-gray-500 mt-0.5">Turn on to enable the share URL</p>
          </div>
          <Toggle checked={publicLink} onChange={handleTogglePublic} />
        </div>

        {/* Allow comments toggle */}
        <div className="rounded-xl border border-gray-200 px-4 py-3.5 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-900">Allow comments</p>
              <p className="text-xs text-gray-500 mt-0.5">Reviewers can leave feedback</p>
            </div>
          </div>
          <Toggle checked={allowComments} onChange={setAllowComments} />
        </div>

        {/* Share URL */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Share URL</p>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="flex-1 text-sm text-gray-600 truncate">{shareUrl}</span>
            <button onClick={copyUrl}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 shrink-0">
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Request Review Panel ─────────────────────────────────────────────────────
function RequestReviewPanel({ onClose }) {
  const [search, setSearch] = useState("");
  return (
    <div className="absolute top-full left-0 mt-1 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teammates by name or email"
            className="w-full pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="py-8 text-center text-sm font-medium text-gray-700">No teammates found.</div>
      <div className="border-t border-gray-100 px-4 py-3">
        <button className="text-sm text-gray-500 hover:text-gray-700">Assign reviewer</button>
      </div>
    </div>
  );
}

// ─── Comments Panel ───────────────────────────────────────────────────────────
function CommentsPanel({ onClose }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  return (
    <div className="fixed right-0 top-0 h-full w-80 z-50 border-l border-gray-200 bg-white shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-semibold text-gray-900">Comments</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-semibold text-sm text-gray-900">Comments</span>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">{comments.length} open</span>
      </div>
      <div className="p-4 border-b border-gray-100">
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Leave feedback..." rows={4}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white resize-none" />
        <button onClick={() => { if (comment.trim()) { setComments(p => [...p, { id: Date.now(), text: comment, time: new Date() }]); setComment(""); } }}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-400 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Post comment
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <div className="rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">No open comments yet</div>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm text-gray-700">{c.text}</p>
                <p className="mt-1 text-xs text-gray-400">{c.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Outline Panel ────────────────────────────────────────────────────────────
function OutlinePanel({ editorRef, onClose }) {
  const [headings, setHeadings] = useState([]);
  useEffect(() => {
    if (!editorRef.current) return;
    const els = editorRef.current.querySelectorAll("h1,h2,h3,h4,h5,h6");
    setHeadings(Array.from(els).map(el => ({ level: parseInt(el.tagName[1]), text: el.innerText, el })));
  }, [editorRef]);
  return (
    <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
          </svg>
          <span className="font-semibold text-sm text-gray-900">Document outline</span>
        </div>
        <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="p-3 max-h-80 overflow-y-auto">
        {headings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No headings found</p>
        ) : (
          <ul className="space-y-1">
            {headings.map((h, i) => (
              <li key={i}>
                <button onClick={() => h.el.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-50"
                  style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}>
                  {h.level === 1 && <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">BLOG</span>}
                  <span className={h.level === 1 ? "font-semibold text-gray-900" : "text-gray-600 text-xs"}>{h.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Find & Replace Modal ─────────────────────────────────────────────────────
function FindReplaceModal({ editorRef, onClose }) {
  const [tab, setTab] = useState("find");
  const [query, setQuery] = useState("");
  const [replace, setReplace] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState([]);

  const doSearch = useCallback(() => {
    if (!query.trim() || !editorRef.current) { setResults([]); return; }
    const text = editorRef.current.innerText;
    const flags = matchCase ? "g" : "gi";
    const pattern = wholeWord ? `\\b${query}\\b` : query;
    try {
      const regex = new RegExp(pattern, flags);
      const matches = [...text.matchAll(regex)];
      setResults(matches.map(m => ({ text: m[0], index: m.index, context: text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30) })));
    } catch { setResults([]); }
  }, [query, matchCase, wholeWord, editorRef]);

  useEffect(() => { doSearch(); }, [doSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="font-bold text-gray-900">Find & replace</span>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex rounded-xl bg-gray-200/70 p-1 mb-5">
            <button onClick={() => setTab("find")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === "find" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Find
            </button>
            <button onClick={() => setTab("replace")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === "replace" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Replace
            </button>
          </div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Find in document</label>
          <div className="flex gap-2 mb-3">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
              className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm placeholder:text-gray-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-6 mb-5">
            {[["matchCase", matchCase, setMatchCase, "Match case"], ["wholeWord", wholeWord, setWholeWord, "Whole word"]].map(([key, val, setter, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer" onClick={() => setter(!val)}>
                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${val ? "border-blue-500" : "border-gray-400"}`}>
                  {val && <span className="h-2 w-2 rounded-full bg-blue-500 block" />}
                </span>
                {label}
              </label>
            ))}
          </div>
          {tab === "replace" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Replace with</label>
              <input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Replace..."
                className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-400 mb-2" />
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Replace</button>
                <button className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600">Replace all</button>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Results</span>
            </div>
            <div className="min-h-[160px] max-h-48 overflow-y-auto">
              {!query ? (
                <p className="text-sm text-gray-500 text-center py-10">Type to search the document.</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">No results found.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {results.map((r, i) => (
                    <li key={i} className="px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer">
                      …{r.context.slice(0, 30)}<span className="bg-yellow-200 font-medium text-gray-900">{r.text}</span>{r.context.slice(30 + r.text.length)}…
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6 pb-5">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── Word Count Modal ─────────────────────────────────────────────────────────
function WordCountModal({ editorRef, onClose }) {
  const [stats, setStats] = useState({ docWords: 0, docChars: 0, selWords: 0, selChars: 0, selCharsNoSpace: 0 });
  useEffect(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const docWords = text.trim().split(/\s+/).filter(Boolean).length;
    const docChars = text.length;
    let selWords = 0, selChars = 0, selCharsNoSpace = 0;
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      const s = sel.toString();
      selWords = s.trim().split(/\s+/).filter(Boolean).length;
      selChars = s.length;
      selCharsNoSpace = s.replace(/\s/g, "").length;
    }
    setStats({ docWords, docChars, selWords, selChars, selCharsNoSpace });
  }, [editorRef]);
  const Row = ({ label, value }) => (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <span className="font-bold text-gray-900">Word count</span>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-2">
          <Row label="Words (document)" value={stats.docWords} />
          <Row label="Characters (document)" value={stats.docChars} />
          <div className="pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-1">Selection</p>
            <div className="space-y-2">
              <Row label="Words" value={stats.selWords} />
              <Row label="Characters" value={stats.selChars} />
              <Row label="Characters (no spaces)" value={stats.selCharsNoSpace} />
            </div>
          </div>
        </div>
        <div className="flex justify-end px-5 pb-5">
          <button onClick={onClose} className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ onClose }) {
  return (
    <div className="fixed right-0 top-0 h-full w-72 z-50 border-l border-gray-200 bg-white shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-semibold text-sm text-gray-900">Version history</span>
        </div>
        <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Current version</span>
            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">Current</span>
          </div>
          <p className="text-xs text-blue-500 mt-1">{new Date().toLocaleString()}</p>
        </div>
        <p className="text-xs text-gray-400 text-center py-4">Auto-saves appear here</p>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
function EditorContent() {
  const { id } = useParams();
  const editorRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("blog_post");
  const [status, setStatus] = useState("draft");
  const [shareEnabled, setShareEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [timeToday, setTimeToday] = useState("0m today");
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Default");
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  const [showReview, setShowReview] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPublicLink, setShowPublicLink] = useState(false);

  const startTime = useRef(Date.now());

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/content/${id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || "");
        setCategory(data.category || "blog_post");
        setStatus(data.status || "draft");
        setShareEnabled(data.share_enabled || false);
        setWordCount(data.word_count || 0);
        if (editorRef.current && data.content_html) {
          editorRef.current.innerHTML = data.content_html;
        }
      })
      .catch(console.error);
  }, [id]);

  const updateWordCount = useCallback(() => {
    if (!editorRef.current) return;
    setWordCount((editorRef.current.innerText || "").trim().split(/\s+/).filter(Boolean).length);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const mins = Math.floor((Date.now() - startTime.current) / 60000);
      setTimeToday(mins < 1 ? "0m today" : `${mins}m today`);
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const save = useCallback(async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText || "";
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      await fetch(`${API_BASE}/api/v1/content/${id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ title, content_html: html, word_count: words, char_count: text.length }),
      });
      setLastSaved(new Date());
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }, [id, title]);

  useEffect(() => { const iv = setInterval(save, 30000); return () => clearInterval(iv); }, [save]);

  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  const updateStatus = async (s) => {
    setStatus(s);
    try { await fetch(`${API_BASE}/api/v1/content/${id}/status?new_status=${s}`, { method: "PATCH", headers: authHeaders() }); } catch { }
  };

  const updateCategory = async (c) => {
    setCategory(c);
    try {
      await fetch(`${API_BASE}/api/v1/content/${id}`, {
        method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ category: c }),
      });
    } catch { }
  };

  const handleToggleShare = async (val) => {
    setShareEnabled(val);
    try { await fetch(`${API_BASE}/api/v1/content/${id}/share`, { method: "PATCH", headers: authHeaders() }); } catch { }
  };

  // Export .docx — download HTML as a file
  const exportDocx = () => {
    if (!editorRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${editorRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFont = (font) => { exec("fontName", font === "Default" ? "inherit" : font); setFontFamily(font); setFontOpen(false); };
  const applySize = (size) => {
    const map = { "12": "1", "14": "2", "16": "3", "18": "4", "20": "4", "24": "5", "28": "5", "32": "6", "36": "6", "48": "7" };
    exec("fontSize", map[size] || "3"); setFontSize(size); setSizeOpen(false);
  };

  const savedLabel = lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Auto-save on";

  return (
    <div className="min-h-screen bg-white flex flex-col border-none outline-none">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
          <Link href="/content" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mr-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </Link>

          <div className="flex h-8 w-8 gap-3 items-center justify-center rounded-full border-2 border-yellow-300 bg-blue-50 text-blue-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>


          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-1 py-1 text-sm text-gray-600 shadow-sm">
            <input type="checkbox" checked readOnly className="h-3.5 w-3.5 accent-blue-500" />
            <span>Auto-save</span>
          </div>

          <span className="text-sm text-gray-400">{saving ? "Saving…" : savedLabel}</span>
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-1 py-1 text-sm text-gray-600 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {timeToday}
          </div>

          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            {/* Request Review */}
            <div className="relative">
              <button onClick={() => { setShowReview(o => !o); setShowOutline(false); }} className={topBtnCls}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Request review
              </button>
              {showReview && <RequestReviewPanel onClose={() => setShowReview(false)} />}
            </div>

            <button onClick={() => { setShowComments(o => !o); setShowHistory(false); }} className={topBtnCls}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Comments
            </button>

            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>

            <div className="relative">
              <button onClick={() => { setShowOutline(o => !o); setShowReview(false); }} className={topBtnCls}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
                </svg>
                Outline
              </button>
              {showOutline && <OutlinePanel editorRef={editorRef} onClose={() => setShowOutline(false)} />}
            </div>

            <button onClick={() => setShowFind(true)} className={topBtnCls}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Find
            </button>

            <button onClick={() => setShowWordCount(true)} className={topBtnCls}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
              </svg>
              Word count
            </button>

            <button onClick={() => { setShowHistory(o => !o); setShowComments(false); }} className={topBtnCls}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              History
            </button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-2 px-3 py-1 border-t border-gray-100">
          <button onClick={() => setShowShare(true)} className={topBtnCls}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>

          <button onClick={() => setShowPublicLink(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Public link
          </button>

          <button onClick={exportDocx}
            className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export .docx
          </button>
        </div>
      </div>

      {/* ── Document area ── */}
      <div className="bg-gray-50 flex-1">
        {/* Title + category/status */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="flex-1 text-2xl font-bold text-gray-900 outline-none placeholder:text-gray-300 bg-transparent"
            placeholder="Untitled" />F
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <select value={category} onChange={e => updateCategory(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-400 bg-white">
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={status} onChange={e => updateStatus(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-400 bg-white">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Formatting toolbar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 leading-none">
            <ToolbarBtn onClick={() => exec("undo")} title="Undo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.87" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("redo")} title="Redo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.49-3.87" /></svg>
            </ToolbarBtn>
            <ToolbarDivider />

            {/* Font family */}
            <div className="relative">
              <button onMouseDown={e => { e.preventDefault(); setFontOpen(o => !o); setSizeOpen(false); }}
                className="flex h-10 items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 min-w-[170px]">
                <span className="flex-1 text-left truncate">{fontFamily}</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {fontOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {FONT_FAMILIES.map(f => (
                    <button key={f} type="button" onMouseDown={e => { e.preventDefault(); applyFont(f); }}
                      className={`flex w-full items-center px-4 py-2 text-sm ${fontFamily === f ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font size */}
            <div className="relative">
              <button onMouseDown={e => { e.preventDefault(); setSizeOpen(o => !o); setFontOpen(false); }}
                className="flex h-10 items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 min-w-[72px]">
                <span className="flex-1 text-left">{fontSize}</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {sizeOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[72px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {FONT_SIZES.map(s => (
                    <button key={s} type="button" onMouseDown={e => { e.preventDefault(); applySize(s); }}
                      className={`flex w-full items-center px-4 py-2 text-sm ${fontSize === s ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ToolbarDivider />
            {[1, 2, 3, 4, 5, 6].map(n => (
              <ToolbarBtn key={n} onClick={() => exec("formatBlock", `h${n}`)} title={`H${n}`}>
                <span className="text-xs font-semibold">H{n}</span>
              </ToolbarBtn>
            ))}
            <ToolbarDivider />
            <ToolbarBtn onClick={() => exec("bold")} title="Bold"><b className="text-xs">B</b></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("italic")} title="Italic"><i className="text-xs">I</i></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("underline")} title="Underline"><u className="text-xs">U</u></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><s className="text-xs">S</s></ToolbarBtn>
            <div className="relative">
              <ToolbarBtn
                onClick={() => setShowTextColor(!showTextColor)}
                title="Text Color"
              >
                🎨
              </ToolbarBtn>

              {showTextColor && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-xl shadow-lg p-3 w-52 z-50">
                  <div className="grid grid-cols-4 gap-2">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          exec("foreColor", color);
                          setShowTextColor(false);
                        }}
                        className="h-8 w-8 rounded-md border border-gray-200 hover:scale-105 transition"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <ToolbarBtn
                onClick={() => setShowHighlight(!showHighlight)}
                title="Highlight"
              >
                🖍️
              </ToolbarBtn>

              {showHighlight && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-xl shadow-lg p-3 w-52 z-50">
                  <div className="grid grid-cols-4 gap-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          exec("hiliteColor", color);
                          setShowHighlight(false);
                        }}
                        className="h-8 w-8 rounded-md border border-gray-200 hover:scale-105 transition"
                        style={{
                          backgroundColor:
                            color === "transparent" ? "white" : color,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => exec("subscript")} title="Subscript"><span className="text-[10px]">x<sub>2</sub></span></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("superscript")} title="Superscript"><span className="text-[10px]">x<sup>2</sup></span></ToolbarBtn>
            <ToolbarBtn
              onClick={() => {
                document.execCommand("insertHTML", false, '<div style="line-height:1.5"></div>');
              }}
              title="Line spacing"
            >
              ↕
            </ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => exec("removeFormat")} title="Clear format">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /><line x1="3" y1="3" x2="21" y2="21" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "pre")} title="Code">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            </ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => exec("justifyLeft")} title="Left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("justifyCenter")} title="Center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="12" x2="7" y2="12" /><line x1="19" y1="18" x2="5" y2="18" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("justifyRight")} title="Right">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("justifyFull")} title="Justify">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="3" y2="12" /><line x1="21" y1="18" x2="3" y2="18" /></svg>
            </ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered list">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
            </ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => { const url = prompt("URL:"); if (url) exec("createLink", url); }} title="Link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </ToolbarBtn>
            <ToolbarBtn title="Table">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => { const url = prompt("Image URL:"); if (url) exec("insertImage", url); }} title="Image">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </ToolbarBtn>
            <ToolbarBtn title="Emoji">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            </ToolbarBtn>
          </div>
        </div>

        {/* Document canvas */}
        <div className="flex justify-center py-8 px-4 min-h-[calc(100vh-280px)]">
          <div className="w-full max-w-[794px] min-h-[1123px] bg-white shadow-md">
            <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={updateWordCount}
              className="min-h-[1123px] px-[90px] py-[90px] text-base text-gray-800 outline-none leading-relaxed"
              style={{ fontFamily: fontFamily === "Default" ? "inherit" : fontFamily }} />
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-105 transition-all">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Modals & Panels */}
      {showShare && <ShareModal onClose={() => setShowShare(false)} docId={id} />}
      {showPublicLink && <PublicLinkModal onClose={() => setShowPublicLink(false)} docId={id} shareEnabled={shareEnabled} onToggleShare={handleToggleShare} />}
      {showComments && <CommentsPanel onClose={() => setShowComments(false)} />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showFind && <FindReplaceModal editorRef={editorRef} onClose={() => setShowFind(false)} />}
      {showWordCount && <WordCountModal editorRef={editorRef} onClose={() => setShowWordCount(false)} />}
    </div>
  );
}

export default function ContentEditorPage() {
  return (
    <ProtectedRoute>
      <EditorContent />
    </ProtectedRoute>
  );
}