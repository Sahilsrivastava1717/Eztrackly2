"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // TODO: replace with your actual auth logic
      if (!email || !password) throw new Error("Please fill in all fields.");
      alert("Welcome, Admin");
    } catch (err) {
      alert(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4"
      style={{ background: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 40%, #ede9fe 100%)" }}
    >
      {/* Glow blob */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-400/20 blur-[120px]" />

      {/* Back button */}
      <div className="absolute left-6 top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-900">Ez</span>
            <span className="text-blue-500">Trackly</span>
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-2xl shadow-blue-200/40">

          {/* Admin Portal badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin Portal
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Admin sign in</h2>
          <p className="mt-0 text-sm text-gray-500">
            Restricted access. Team members should use the standard login.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Admin email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eztrackly.com"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm text-gray-900 shadow-md outline-none focus:shadow-lg transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm text-gray-900 shadow-md outline-none focus:shadow-lg transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-500 py-2 text-sm text-white font-semibold shadow-lg hover:shadow-2xl hover:bg-blue-600 transition"
            >
              {submitting ? "Please wait..." : "Sign in to admin"}
            </button>

          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Not an admin?{" "}
            <Link href="/auth" className="text-blue-700 font-medium hover:underline">
              Team login
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}