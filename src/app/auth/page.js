"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
    alert("Login button clicked");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6"
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
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-gray-700">
            Sign in to your EzTrackly workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border-0 bg-gray-100 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-500 py-3 text-sm text-white font-semibold hover:bg-blue-600 transition-colors mt-1"
            >
              Sign in
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