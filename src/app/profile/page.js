"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../components/client/AuthContext";

// ─── API helpers ────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(extra = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
  return res.json();
}
async function apiUpload(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: formData,
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
  return res.json();
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }

// ─── Avatar color ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-pink-500","bg-emerald-500","bg-orange-500","bg-red-500","bg-teal-500","bg-indigo-500"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Toast (inline) ───────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return {
    toasts,
    success: (m) => add(m, "success"),
    error: (m) => add(m, "error"),
  };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          "flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg text-white transition-all",
          t.type === "success" ? "bg-emerald-500" : "bg-red-500"
        )}>
          {t.type === "success"
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Custom Select Dropdown ────────────────────────────────────────────────────
function CustomSelect({ value, onChange, placeholder = "Select…", options = [] }) {
  const [open, setOpen] = useState(false);
  const [dropStyle, setDropStyle] = useState({});
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
      if (spaceBelow < 220) {
        setDropStyle({ position: "fixed", bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, zIndex: 9999 });
      } else {
        setDropStyle({ position: "fixed", top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
      }
    }
    setOpen(o => !o);
  };

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white transition-colors outline-none",
          open ? "border-blue-400 ring-2 ring-blue-50" : "border-gray-200 hover:border-gray-300",
          !selected && "text-gray-400"
        )}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={cn("text-gray-400 transition-transform", open && "rotate-180")}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={dropStyle} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg py-1">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-sm text-left transition-colors",
                value === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-800 hover:bg-gray-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return <div className={cn("rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>{children}</div>;
}
function CardHeader({ children }) { return <div className="px-6 pt-6 pb-2">{children}</div>; }
function CardTitle({ children, className = "" }) { return <h2 className={cn("text-base font-semibold text-gray-900 flex items-center gap-2", className)}>{children}</h2>; }
function CardDescription({ children }) { return <p className="mt-0.5 text-sm text-gray-500">{children}</p>; }
function CardContent({ children, className = "" }) { return <div className={cn("px-6 pb-6", className)}>{children}</div>; }

// ─── Label + Input ────────────────────────────────────────────────────────────
function Label({ children, htmlFor, className = "" }) {
  return <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-gray-700 mb-1.5", className)}>{children}</label>;
}
function Input({ className = "", disabled = false, readOnly = false, ...props }) {
  return (
    <input
      disabled={disabled}
      readOnly={readOnly}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400",
        "focus:border-blue-400 focus:ring-2 focus:ring-blue-50",
        (disabled || readOnly) && "bg-gray-50 text-gray-500 cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 resize-none",
        "focus:border-blue-400 focus:ring-2 focus:ring-blue-50",
        className
      )}
      {...props}
    />
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
  Camera: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Save: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Loader: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Phone: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>,
  Heart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  MapPin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Cake: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>,
  Mail: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Briefcase: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Building: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  Star: (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
};

// Most of these now persist via PUT /api/v1/auth/me (see auth_models.py /
// auth_endpoints.py extended fields). avatar_url and company are still NOT
// user-editable/persisted — avatar needs a dedicated upload endpoint, and
// company is admin-set.
const EXTRA_FIELD_DEFAULTS = {
  personal_email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  job_title: "",
  designation: "",
  company: "",
  address: "",
  bio: "",
  avatar_url: null,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const fileRef = useRef(null);
  const toast = useToast();
  const { user, refreshUser } = useAuth(); // refreshUser may not exist on every AuthContext — guarded below
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [p, setP] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/v1/auth/me");
        if (!cancelled) setP({ ...EXTRA_FIELD_DEFAULTS, ...data });
      } catch (e) {
        if (!cancelled) {
          toast.error("Failed to load profile");
          // Fall back to whatever AuthContext already has, so the page isn't empty
          if (user) setP({ ...EXTRA_FIELD_DEFAULTS, ...user });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = p?.role || user?.role || "member";

  const update = (k, v) => { if (!p) return; setP({ ...p, [k]: v }); };

  const handleSave = async () => {
    if (!p) return;
    if (!p.full_name?.trim()) return toast.error("Name is required");
    if (p.full_name.length > 100) return toast.error("Name too long");
    if (p.username && (p.username.length < 3 || p.username.length > 50)) {
      return toast.error("Username must be 3–50 characters");
    }
    setSaving(true);
    try {
      const updated = await apiFetch("/api/v1/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          full_name: p.full_name,
          username: p.username,
          personal_email: p.personal_email || null,
          phone: p.phone || null,
          date_of_birth: p.date_of_birth || null,
          gender: p.gender || null,
          job_title: p.job_title || null,
          designation: p.designation || null,
          address: p.address || null,
          bio: p.bio || null,
          emergency_contact_name: p.emergency_contact_name || null,
          emergency_contact_phone: p.emergency_contact_phone || null,
          emergency_contact_relation: p.emergency_contact_relation || null,
        }),
      });
      setP(prev => ({ ...prev, ...updated }));
      if (typeof refreshUser === "function") await refreshUser();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Avatar upload has no backend endpoint yet — preview locally only.
  const handleAvatarUpload = async (file) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image");
    setUploading(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setP(prev => prev ? { ...prev, avatar_url: localUrl } : prev);
      toast.error("Avatar upload isn't saved yet — backend endpoint needed");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !p) {
    return (
      <div className="mx-auto max-w-4xl py-16 flex items-center justify-center">
        <Icon.Loader className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const displayName = p.full_name ?? "";
  const initial = (displayName || p.email)?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <ToastContainer toasts={toast.toasts} />

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your personal details. The team admins will see this information on your profile card.
        </p>
      </div>

      {/* ── Avatar Card ── */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-6">
          <div className="relative shrink-0">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={displayName} className="h-28 w-28 rounded-full object-cover border-4 border-blue-100 shadow-lg" />
            ) : (
              <div className={cn("h-28 w-28 rounded-full flex items-center justify-center border-4 border-blue-100 shadow-lg text-white text-4xl font-bold", avatarColor(displayName))}>
                {initial}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:scale-105 transition disabled:opacity-50"
              aria-label="Change picture"
            >
              {uploading
                ? <Icon.Loader className="h-4 w-4 animate-spin" />
                : <Icon.Camera className="h-4 w-4" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{displayName || "Unnamed"}</h2>
            <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Icon.Mail className="h-3.5 w-3.5" /> {p.email}
            </p>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Personal Information ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Icon.User className="h-5 w-5 text-blue-500" />
            Personal information
          </CardTitle>
          <CardDescription>Your basic identity details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                value={p.full_name ?? ""}
                maxLength={100}
                onChange={e => update("full_name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">
                <span className="inline-flex items-center gap-1"><Icon.Mail className="h-3.5 w-3.5 inline" /> Company email</span>
              </Label>
              <Input id="email" value={p.email ?? ""} disabled />
              <p className="mt-1 text-xs text-gray-400">Set by admin. Used to sign in.</p>
            </div>

            <div>
              <Label htmlFor="personal_email">
                <span className="inline-flex items-center gap-1"><Icon.Mail className="h-3.5 w-3.5 inline" /> Personal email</span>
              </Label>
              <Input id="personal_email" type="email" maxLength={150} value={p.personal_email ?? ""} onChange={e => update("personal_email", e.target.value)} placeholder="you@gmail.com" />
              <p className="mt-1 text-xs text-gray-400">For personal communication & emergencies.</p>
            </div>

            <div>
              <Label htmlFor="phone">
                <span className="inline-flex items-center gap-1"><Icon.Phone className="h-3.5 w-3.5 inline" /> Phone number</span>
              </Label>
              <Input id="phone" type="tel" maxLength={30} value={p.phone ?? ""} onChange={e => update("phone", e.target.value)} placeholder="+1 555 0000" />
            </div>

            <div>
              <Label htmlFor="dob">
                <span className="inline-flex items-center gap-1"><Icon.Cake className="h-3.5 w-3.5 inline" /> Date of birth</span>
              </Label>
              <Input id="dob" type="date" value={p.date_of_birth ?? ""} onChange={e => update("date_of_birth", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <CustomSelect
                value={p.gender ?? ""}
                onChange={v => update("gender", v)}
                placeholder="Select…"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "non_binary", label: "Non-binary" },
                  { value: "prefer_not", label: "Prefer not to say" },
                ]}
              />
            </div>

            <div>
              <Label htmlFor="job">
                <span className="inline-flex items-center gap-1"><Icon.Briefcase className="h-3.5 w-3.5 inline" /> Job title</span>
              </Label>
              <Input id="job" maxLength={100} value={p.job_title ?? ""} onChange={e => update("job_title", e.target.value)} placeholder="e.g. Sales Executive" />
            </div>

            <div>
              <Label htmlFor="designation">
                <span className="inline-flex items-center gap-1"><Icon.Briefcase className="h-3.5 w-3.5 inline" /> Designation</span>
              </Label>
              <Input id="designation" maxLength={100} value={p.designation ?? ""} onChange={e => update("designation", e.target.value)} placeholder="e.g. Senior SEO Specialist" />
              <p className="mt-1 text-xs text-gray-400">Your custom title — visible to your team.</p>
            </div>

            <div>
              <Label>
                <span className="inline-flex items-center gap-1"><Icon.User className="h-3.5 w-3.5 inline" /> Role</span>
              </Label>
              <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                  {role ? role.replace("_", " ") : "—"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Set by your admin.</p>
            </div>

            <div>
              <Label htmlFor="company">
                <span className="inline-flex items-center gap-1"><Icon.Building className="h-3.5 w-3.5 inline" /> Company</span>
              </Label>
              <Input id="company" value={p.company ?? ""} readOnly disabled />
              <p className="mt-1 text-xs text-gray-400">Set by your admin.</p>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="addr">
                <span className="inline-flex items-center gap-1"><Icon.MapPin className="h-3.5 w-3.5 inline" /> Address</span>
              </Label>
              <Textarea id="addr" rows={2} maxLength={500} value={p.address ?? ""} onChange={e => update("address", e.target.value)} placeholder="Street, City, State, ZIP" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea id="bio" rows={3} maxLength={500} value={p.bio ?? ""} onChange={e => update("bio", e.target.value)} placeholder="Tell your team a bit about yourself…" />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── Emergency Contact ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Icon.Heart className="h-5 w-5 text-rose-500" />
            Emergency contact
          </CardTitle>
          <CardDescription>Who should we contact in case of an emergency?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="ec-name">Contact name</Label>
              <Input id="ec-name" maxLength={100} value={p.emergency_contact_name ?? ""} onChange={e => update("emergency_contact_name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ec-phone">Contact phone</Label>
              <Input id="ec-phone" type="tel" maxLength={30} value={p.emergency_contact_phone ?? ""} onChange={e => update("emergency_contact_phone", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ec-rel">Relationship</Label>
              <CustomSelect
                value={p.emergency_contact_relation ?? ""}
                onChange={v => update("emergency_contact_relation", v)}
                placeholder="Select…"
                options={[
                  { value: "parent", label: "Parent" },
                  { value: "spouse", label: "Spouse" },
                  { value: "sibling", label: "Sibling" },
                  { value: "child", label: "Child" },
                  { value: "friend", label: "Friend" },
                  { value: "partner", label: "Partner" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <ChangePasswordCard toast={toast} />

      {/* ── Sticky Save ── */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-600 disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
          {saving
            ? <><Icon.Loader className="h-4 w-4 animate-spin" /> Saving…</>
            : <><Icon.Save className="h-4 w-4" /> Save changes</>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Change Password Card ─────────────────────────────────────────────────────
function ChangePasswordCard({ toast }) {
  const [pwCurrent, setPwCurrent] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!pwCurrent) return toast.error("Enter your current password");
    if (pw1.length < 6) return toast.error("New password must be at least 6 characters");
    if (pw1 !== pw2) return toast.error("Passwords do not match");
    setSaving(true);
    try {
      await apiFetch("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: pwCurrent, new_password: pw1 }),
      });
      toast.success("Password updated");
      setPwCurrent(""); setPw1(""); setPw2("");
    } catch (e) {
      toast.error(e?.detail || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Icon.User className="h-5 w-5 text-blue-500" />
          Change password
        </CardTitle>
        <CardDescription>Update your sign-in password. No email will be sent.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pw-current">Current password</Label>
            <Input id="pw-current" type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw1">New password</Label>
            <Input id="pw1" type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div>
            <Label htmlFor="pw2">Confirm new password</Label>
            <Input id="pw2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={onSave}
              disabled={saving || !pwCurrent || !pw1 || !pw2}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving
                ? <><Icon.Loader className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Icon.Save className="h-4 w-4" /> Update password</>
              }
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}