"use client";

import { useState } from "react";
import { useAuth } from "@/components/client/AuthContext";
import Link from "next/link";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password, form.full_name);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #dbeafe 30%, #e0f2fe 40%, #ede9fe 100%)" }}
    >
      {/* Back button */}
      <div className="absolute top-5 left-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>
      </div>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-900">Ez</span>
            <span className="text-blue-500">Trackly</span>
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-xl shadow-blue-100/50">

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "login" ? "Welcome back" : "Get started"}
          </h2>
          <p className="mt-1.5 text-sm text-gray-700">
            {mode === "login"
              ? "Sign in to your EzTrackly workspace."
              : "Create your free EzTrackly account."}
          </p>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* Register-only fields */}
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Sahil Srivastava"
                    className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    placeholder="sahil123"
                    className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                placeholder={mode === "register" ? "Min. 6 characters" : "Enter password"}
                className="w-full rounded-xl border-0 bg-gray-100 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-500 py-3 text-sm text-white font-semibold hover:bg-blue-600 transition-colors mt-1 disabled:opacity-50"
            >
              {loading
                ? (mode === "login" ? "Signing in..." : "Creating account...")
                : (mode === "login" ? "Sign in" : "Create account")}
            </button>

          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Admin?{" "}
            <a href="./adminLogin" className="text-blue-700 hover:underline">
              Use the admin portal
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}