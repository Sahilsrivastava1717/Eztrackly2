"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";
import { useAuth } from "../../components/client/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
  if (res.status === 204) return null;
  return res.json();
}

function cn(...classes) { return classes.filter(Boolean).join(" "); }

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return new Date(ts).toLocaleDateString();
}
function lastSeenText(ts) {
  if (!ts) return "offline";
  const diff = (Date.now() - new Date(ts).getTime()) / 60000;
  if (diff < 2) return "online";
  if (diff < 60) return `last seen ${Math.floor(diff)}m ago`;
  return `last seen ${Math.floor(diff / 60)}h ago`;
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-pink-500","bg-emerald-500","bg-orange-500","bg-red-500","bg-teal-500","bg-indigo-500"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ src, name, size = "10" }) {
  const sz = size === "10" ? "h-10 w-10 text-sm" : size === "8" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";
  if (src) return <img src={src} alt={name || ""} className={cn("rounded-full object-cover shrink-0", sz)} />;
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sz, avatarColor(name))}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}
function PresenceDot({ lastSeen }) {
  const online = lastSeen && (Date.now() - new Date(lastSeen).getTime()) / 60000 < 2;
  return <span className={cn("block h-3 w-3 rounded-full border-2 border-white", online ? "bg-emerald-500" : "bg-gray-300")} />;
}

// ── Emoji Pickers ─────────────────────────────────────────────────────────────
const REACTIONS = ["👍","❤️","😂","🎉","😮","🙏"];
const EMOJI_PALETTE = ["😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳","😢","😭","😡","🤔","👍","👎","🙏","🎉","🔥","💯","❤️","💔","✅","❌","⭐","🚀","💡","📌","🎯","💪"];

function MiniReactionPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const btnRef = useRef(null); const panelRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = () => {
    if (!open && btnRef.current) { const r = btnRef.current.getBoundingClientRect(); setStyle({ position:"fixed", bottom: window.innerHeight-r.top+4, left: r.left, zIndex:9999 }); }
    setOpen(o => !o);
  };
  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      </button>
      {open && createPortal(
        <div ref={panelRef} style={style} className="rounded-xl border border-gray-100 bg-white shadow-lg p-2 flex gap-1">
          {REACTIONS.map(e => <button key={e} type="button" onClick={() => { onSelect(e); setOpen(false); }} className="text-lg hover:scale-125 transition-transform px-0.5">{e}</button>)}
        </div>, document.body
      )}
    </>
  );
}
function FullEmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const btnRef = useRef(null); const panelRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = () => {
    if (!open && btnRef.current) { const r = btnRef.current.getBoundingClientRect(); setStyle({ position:"fixed", bottom: window.innerHeight-r.top+8, left: r.left, zIndex:9999 }); }
    setOpen(o => !o);
  };
  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      </button>
      {open && createPortal(
        <div ref={panelRef} style={style} className="rounded-xl border border-gray-100 bg-white shadow-lg p-2 w-64">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_PALETTE.map(e => <button key={e} type="button" onClick={() => { onSelect(e); setOpen(false); }} className="text-xl hover:bg-gray-100 rounded p-1">{e}</button>)}
          </div>
        </div>, document.body
      )}
    </>
  );
}

// ── New Chat Dialog ───────────────────────────────────────────────────────────
function NewChatDialog({ open, onClose, onCreated }) {
  const [tab, setTab] = useState("dm");
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) { setSearch(""); setGroupName(""); setSelectedMembers([]); setTab("dm"); return; }
    setLoading(true);
    apiFetch("/api/v1/chat/teammates").then(d => setTeammates(Array.isArray(d) ? d : [])).catch(() => setTeammates([])).finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = teammates.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const startDM = async (person) => {
    setCreating(true);
    try {
      const conv = await apiFetch("/api/v1/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ type: "dm", member_ids: [person.id] }),
      });
      onCreated(conv);
      onClose();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const startGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setCreating(true);
    try {
      const conv = await apiFetch("/api/v1/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ type: "group", name: groupName.trim(), member_ids: selectedMembers.map(m => m.id) }),
      });
      onCreated(conv);
      onClose();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const toggleMember = (person) => setSelectedMembers(prev =>
    prev.find(m => m.id === person.id) ? prev.filter(m => m.id !== person.id) : [...prev, person]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New chat</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {["dm","group"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                tab === t ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
              {t === "dm" ? "💬 Direct message" : "👥 Group chat"}
            </button>
          ))}
        </div>

        {tab === "group" && (
          <div className="px-5 pt-3">
            <input placeholder="Group name..." value={groupName} onChange={e => setGroupName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            {selectedMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedMembers.map(m => (
                  <span key={m.id} className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {m.name}
                    <button onClick={() => toggleMember(m)} className="ml-0.5 text-blue-400 hover:text-blue-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 pt-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teammates..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50" />
          </div>
        </div>

        <div className="mx-5 my-3 max-h-64 overflow-y-auto rounded-xl border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-400">
              <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Loading teammates...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-gray-400">{search ? "No teammates found" : "No @ezsignly.com teammates yet"}</p>
            </div>
          ) : filtered.map(person => {
            const isSelected = selectedMembers.find(m => m.id === person.id);
            return (
              <button key={person.id}
                onClick={() => tab === "dm" ? startDM(person) : toggleMember(person)}
                disabled={creating}
                className={cn("flex w-full items-center gap-3 px-3 py-3 text-left transition-colors border-b border-gray-50 last:border-0",
                  tab === "group" && isSelected ? "bg-blue-50" : "hover:bg-gray-50")}>
                <div className="relative shrink-0">
                  <Avatar src={person.avatar_url} name={person.name} size="10" />
                  <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot lastSeen={person.last_seen} /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{person.name}</div>
                  <div className="truncate text-xs text-gray-400">{person.email}</div>
                  {person.role && <div className="mt-0.5 text-[10px] font-medium text-blue-500">{person.role}</div>}
                </div>
                {tab === "group" ? (
                  <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300")}>
                    {isSelected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5"><polyline points="2 6 5 9 10 3"/></svg>}
                  </div>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                )}
              </button>
            );
          })}
        </div>

        {tab === "group" && (
          <div className="flex justify-end gap-2 px-5 pb-5">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button onClick={startGroup} disabled={!groupName.trim() || selectedMembers.length === 0 || creating}
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
              {creating ? "Creating…" : `Create group (${selectedMembers.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, sender, grouped, isGroup, replyTarget, replyTargetSender,
  onReaction, onReply, onEdit, onDelete, onPin, currentUserId }) {

  const repsByEmoji = {};
  (msg.reactions || []).forEach(r => { (repsByEmoji[r.emoji] = repsByEmoji[r.emoji] || []).push(r.user_id); });
  const readCount = (msg.reads || []).length;
  const canEdit = isMine && !msg.deleted_at && (Date.now() - new Date(msg.created_at).getTime() < 15 * 60_000);

  if (msg.is_system) return <div className="my-2 text-center text-xs text-gray-400">{msg.content}</div>;

  return (
    <div className={cn("group flex gap-2", isMine && "flex-row-reverse", grouped && "mt-0.5")}>
      <div className="w-8 shrink-0 flex items-end">
        {!grouped && <Avatar src={sender?.avatar_url} name={sender?.name} size="8" />}
      </div>
      <div className={cn("max-w-[70%]", isMine && "items-end flex flex-col")}>
        {!grouped && !isMine && isGroup && (
          <div className="mb-0.5 px-1 text-xs font-medium text-gray-500">{sender?.name}</div>
        )}
        <div className="flex items-end gap-1">
          {/* Hover actions */}
          <div className={cn("flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", isMine ? "order-first" : "order-last")}>
            <MiniReactionPicker onSelect={e => onReaction(msg.id, e)} />
            <button type="button" onClick={() => onReply(msg)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            </button>
            <button type="button" onClick={() => onPin(msg)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="Pin">
              📌
            </button>
            {canEdit && (
              <button type="button" onClick={() => onEdit(msg)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            )}
            {isMine && !msg.deleted_at && (
              <button type="button" onClick={() => onDelete(msg)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            )}
          </div>

          {/* Bubble */}
          <div className={cn("rounded-2xl px-3 py-2 text-sm break-words shadow-sm",
            isMine ? "bg-blue-500 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm border border-gray-200",
            msg.is_pinned && "ring-2 ring-amber-400")}>
            {/* Reply context */}
            {replyTarget && (
              <div className={cn("mb-2 rounded-lg border-l-2 pl-2 py-1 text-xs opacity-90",
                isMine ? "border-white/60 bg-white/10" : "border-blue-400 bg-blue-50")}>
                <div className="font-semibold mb-0.5" style={{ color: isMine ? "rgba(255,255,255,0.9)" : "#2563eb" }}>
                  ↩ {replyTargetSender?.name ?? "Unknown"}
                </div>
                <div className="max-w-xs truncate" style={{ color: isMine ? "rgba(255,255,255,0.75)" : "#6b7280" }}>
                  {replyTarget.content || "📎 Attachment"}
                </div>
              </div>
            )}
            {msg.deleted_at ? (
              <em className="text-xs opacity-60">Message deleted</em>
            ) : (
              <>
                {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                {msg.edited_at && <span className="ml-1 text-[10px] opacity-60">(edited)</span>}
              </>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(repsByEmoji).length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", isMine && "justify-end")}>
            {Object.entries(repsByEmoji).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReaction(msg.id, emoji)}
                className={cn("rounded-full border px-2 py-0.5 text-xs transition-colors",
                  users.includes(currentUserId) ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}

        {/* Time + read */}
        <div className={cn("mt-0.5 flex items-center gap-1 px-1 text-[10px] text-gray-400", isMine && "justify-end")}>
          {formatTime(msg.created_at)}
          {isMine && (
            readCount > 0
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M18 7l-8 8-4-4"/><path d="M22 7l-8 8"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat Thread ───────────────────────────────────────────────────────────────
function ChatThread({ conversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const pollRef = useRef(null);
  const lastMsgId = useRef(null);

  const display = conversation.type === "dm"
    ? (conversation.otherUser?.name ?? "Unknown")
    : (conversation.name ?? "Group");

  const subtitle = conversation.type === "dm"
    ? lastSeenText(conversation.otherUser?.last_seen)
    : `${(conversation.members ?? []).length} members`;

  // Build profiles map from conversation
  const profilesById = useMemo(() => {
    const map = {};
    if (conversation.otherUser) map[conversation.otherUser.id] = conversation.otherUser;
    (conversation.members || []).forEach(m => { if (m) map[m.id] = m; });
    // Add current user
    map[currentUser.id] = { id: currentUser.id, name: currentUser.name, avatar_url: null };
    return map;
  }, [conversation, currentUser]);

  const mentionCandidates = useMemo(() => {
    if (conversation.type === "dm") return conversation.otherUser ? [conversation.otherUser] : [];
    return (conversation.members ?? []).filter(m => m?.id !== currentUser.id);
  }, [conversation, currentUser.id]);

  const filteredMentions = mentionCandidates
    .filter(p => p?.name?.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 6);

  // Load messages
  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const msgs = await apiFetch(`/api/v1/chat/conversations/${conversation.id}/messages`);
      setMessages(msgs || []);
      if (msgs?.length > 0) lastMsgId.current = msgs[msgs.length - 1].id;
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  }, [conversation.id]);

  useEffect(() => {
    loadMessages();
    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(() => loadMessages(true), 3000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { setReplyTo(null); setEditingId(null); setText(""); }, [conversation.id]);

  const handleTextChange = (val) => {
    setText(val);
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? val.length;
    const m = val.slice(0, pos).match(/(?:^|\s)@(\w*)$/);
    if (m) { setMentionOpen(true); setMentionQuery(m[1]); setMentionIndex(0); }
    else setMentionOpen(false);
  };

  const insertMention = (p) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? text.length;
    const before = text.slice(0, pos).replace(/@(\w*)$/, `@${p.name} `);
    setText(before + text.slice(pos));
    setMentionOpen(false);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(before.length, before.length); });
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText(""); setReplyTo(null);
    try {
      const msg = await apiFetch(`/api/v1/chat/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, reply_to_id: replyTo?.id ?? null }),
      });
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
    } catch (e) { setText(content); console.error(e); }
    finally { setSending(false); }
  };

  const handleReaction = async (msgId, emoji) => {
    try {
      await apiFetch(`/api/v1/chat/messages/${msgId}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      });
      await loadMessages(true);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await apiFetch(`/api/v1/chat/messages/${msg.id}`, { method: "DELETE" });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, deleted_at: new Date().toISOString(), content: null } : m));
    } catch (e) { console.error(e); }
  };

  const handlePin = async (msg) => {
    try {
      await apiFetch(`/api/v1/chat/messages/${msg.id}/pin`, { method: "POST" });
      await loadMessages(true);
    } catch (e) { console.error(e); }
  };

  const saveEdit = async () => {
    try {
      const updated = await apiFetch(`/api/v1/chat/messages/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({ content: editText }),
      });
      setMessages(prev => prev.map(m => m.id === editingId ? updated : m));
    } catch (e) { console.error(e); }
    setEditingId(null); setEditText("");
  };

  const visibleMessages = searchTerm
    ? messages.filter(m => m.content?.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const pinned = messages.filter(m => m.is_pinned && !m.deleted_at);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <div className="relative shrink-0">
          <Avatar src={conversation.type === "dm" ? conversation.otherUser?.avatar_url : null} name={display} size="10" />
          {conversation.type === "dm" && <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot lastSeen={conversation.otherUser?.last_seen} /></span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-gray-900">{display}</div>
          <div className="truncate text-xs text-gray-400">
            {conversation.type === "dm" && conversation.otherUser?.email && <span className="mr-2 text-blue-400 text-[11px]">{conversation.otherUser.email}</span>}
            {subtitle}
          </div>
        </div>
        {pinned.length > 0 && (
          <button onClick={() => setPinnedOpen(o => !o)}
            className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
            📌 {pinned.length}
          </button>
        )}
        <button onClick={() => setSearchOpen(o => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
          <input autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search in conversation..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50" />
        </div>
      )}

      {/* Pinned messages */}
      {pinnedOpen && pinned.length > 0 && (
        <div className="max-h-36 overflow-y-auto border-b border-amber-200 bg-amber-50 p-2 space-y-1">
          {pinned.map(m => (
            <div key={m.id} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-white p-2 text-xs">
              <span className="mt-0.5 shrink-0">📌</span>
              <div>
                <span className="font-semibold text-gray-700">{profilesById[m.sender_id]?.name ?? "Unknown"}: </span>
                <span className="text-gray-600">{m.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50/30 px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg className="animate-spin mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading messages…
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-sm font-medium">Start the conversation!</p>
              {conversation.type === "dm" && conversation.otherUser?.name && (
                <p className="text-xs mt-1 text-gray-400">Send a message to {conversation.otherUser.name}</p>
              )}
            </div>
          </div>
        ) : visibleMessages.map((msg, i) => {
          const isMine = msg.sender_id === currentUser.id;
          const sender = msg.sender || profilesById[msg.sender_id];
          const prev = visibleMessages[i - 1];
          const grouped = prev && prev.sender_id === msg.sender_id && !prev.is_system
            && (new Date(msg.created_at) - new Date(prev.created_at) < 5 * 60_000);
          const replyTarget = msg.reply_to_id ? messages.find(x => x.id === msg.reply_to_id) : null;
          const replyTargetSender = replyTarget ? (profilesById[replyTarget.sender_id] ?? null) : null;

          if (editingId === msg.id) {
            return (
              <div key={msg.id} className={cn("flex gap-2", isMine && "flex-row-reverse")}>
                <div className="w-8 shrink-0" />
                <div className="max-w-[70%] flex-1 space-y-1">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)}
                    className="w-full rounded-xl border border-blue-400 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-50 resize-none"
                    rows={2} autoFocus
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditingId(null); }} />
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600">Save</button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <MessageBubble key={msg.id} msg={msg} isMine={isMine} sender={sender} grouped={grouped}
              isGroup={conversation.type === "group"} replyTarget={replyTarget} replyTargetSender={replyTargetSender}
              onReaction={handleReaction} onReply={setReplyTo}
              onEdit={m => { setEditingId(m.id); setEditText(m.content ?? ""); }}
              onDelete={handleDelete} onPin={handlePin} currentUserId={currentUser.id} />
          );
        })}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-gray-100 bg-blue-50 px-4 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-semibold text-blue-700">Replying to {profilesById[replyTo.sender_id]?.name ?? "Unknown"}</div>
            <div className="truncate text-gray-500">{replyTo.content}</div>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 border-t border-gray-100 bg-white px-3 py-3">
        <input ref={fileRef} type="file" hidden />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>

        <FullEmojiPicker onSelect={e => setText(t => t + e)} />

        <div className="relative flex-1">
          {mentionOpen && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              {filteredMentions.map((p, i) => (
                <button key={p.id} type="button"
                  onMouseDown={e => { e.preventDefault(); insertMention(p); }}
                  className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors", i === mentionIndex && "bg-gray-50")}>
                  <Avatar src={p.avatar_url} name={p.name} size="6" />
                  <span className="truncate text-gray-700">{p.name}</span>
                </button>
              ))}
            </div>
          )}
          <textarea ref={textareaRef} value={text} onChange={e => handleTextChange(e.target.value)}
            onKeyDown={e => {
              if (mentionOpen && filteredMentions.length > 0) {
                if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => (i + 1) % filteredMentions.length); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length); return; }
                if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredMentions[mentionIndex]); return; }
                if (e.key === "Escape") { e.preventDefault(); setMentionOpen(false); return; }
              }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              if (e.key === "Escape") setReplyTo(null);
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
            style={{ minHeight: "40px", maxHeight: "8rem" }} />
        </div>

        <button type="button" onClick={send} disabled={!text.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-all">
          {sending
            ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          }
        </button>
      </div>
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [convLoading, setConvLoading] = useState(true);
  const pollConvRef = useRef(null);

  const currentUser = {
    id: user?.id || "me",
    name: user?.full_name || user?.username || "You",
  };

  // Load conversations
  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setConvLoading(true);
    try {
      const data = await apiFetch("/api/v1/chat/conversations");
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { if (!silent) setConvLoading(false); }
  }, []);

  useEffect(() => {
    loadConversations();
    pollConvRef.current = setInterval(() => loadConversations(true), 5000);
    return () => clearInterval(pollConvRef.current);
  }, [loadConversations]);

  const activeConv = conversations.find(c => c.id === activeId);

  const filteredConvs = conversations.filter(c => {
    if (!filter) return true;
    const name = c.type === "dm" ? c.otherUser?.name : c.name;
    return name?.toLowerCase().includes(filter.toLowerCase());
  });

  const handleNewChat = (conv) => {
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });
    setActiveId(conv.id);
  };

  return (
    <div className="flex h-full bg-white overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>

      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <h2 className="flex-1 text-base font-bold text-gray-900">Chats</h2>
          <button onClick={() => setNewChatOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New chat
          </button>
        </div>

        <div className="px-3 py-2.5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search"
              className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Loading…
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-gray-400 mb-3">No chats yet.</p>
              <button onClick={() => setNewChatOpen(true)}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
                Start a chat
              </button>
            </div>
          ) : filteredConvs.map(c => {
            const display = c.type === "dm" ? (c.otherUser?.name ?? "Unknown") : (c.name ?? "Group");
            const active = activeId === c.id;
            const preview = c.last_message_preview || (c.type === "group" ? "Group created" : "Start the conversation");
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={cn("flex w-full items-center gap-3 border-b border-gray-50 px-3 py-3 text-left transition-colors hover:bg-gray-50",
                  active && "bg-blue-50 hover:bg-blue-50")}>
                <div className="relative shrink-0">
                  <Avatar src={c.type === "dm" ? c.otherUser?.avatar_url : c.avatar_url} name={display} size="10" />
                  {c.type === "dm" && <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot lastSeen={c.otherUser?.last_seen} /></span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={cn("flex-1 truncate text-sm", active ? "font-semibold text-blue-700" : "font-medium text-gray-900")}>
                      {c.emoji && <span className="mr-1">{c.emoji}</span>}
                      {display}
                    </span>
                    {c.last_message_at && <span className="shrink-0 text-[11px] text-gray-400">{relativeTime(c.last_message_at)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="flex-1 truncate text-xs text-gray-400">{preview}</span>
                    {c.unread > 0 && (
                      <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#F5F7FB]">
        {activeConv ? (
          <ChatThread key={activeConv.id} conversation={activeConv} currentUser={currentUser} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="8" cy="11" r="0.8" fill="#d1d5db"/><circle cx="12" cy="11" r="0.8" fill="#d1d5db"/><circle cx="16" cy="11" r="0.8" fill="#d1d5db"/>
            </svg>
            <p className="text-sm font-medium text-gray-400">Select a chat or start a new one</p>
            <button onClick={() => setNewChatOpen(true)}
              className="mt-1 rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
              + New chat
            </button>
          </div>
        )}
      </div>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} onCreated={handleNewChat} />

      <button onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
