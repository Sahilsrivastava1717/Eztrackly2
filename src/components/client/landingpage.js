"use client";

import Link from "next/link";

import humanresource from "../../assets/icons/humanresource.svg";
import healthcare    from "../../assets/icons/healthcare.svg";
import greenAid      from "../../assets/icons/greenAid.svg";
import realestate    from "../../assets/icons/realestate.svg";
import legal         from "../../assets/icons/legal.svg";

const modules = [
  { icon: humanresource, title: "Employee Lifecycle",    desc: "Onboarding checklists, visa & document tracking, expiry alerts, and HR requests in one place." },
  { icon: healthcare,    title: "Attendance & Activity", desc: "Real-time check-in/out with presence, idle detection, and live team leaderboard." },
  { icon: greenAid,      title: "Social Media Hub",      desc: "AI-powered post composer, weekly planner, trend radar, and competitor analysis." },
  { icon: legal,         title: "Leads & Outreach",      desc: "Pipeline, saved views, email templates, and AI-assisted next-best actions." },
  { icon: legal,         title: "Team Chat",             desc: "Threads, group settings, and tasks created directly from a message." },
  { icon: humanresource, title: "Docs & Reports",        desc: "Collaborative docs with versioning, weekly reports, and one-click PDF exports." },
  { icon: legal,         title: "Leave & Day Planner",   desc: "Day plans, leave workflow, standups, and meeting scheduling with Google Meet." },
  { icon: realestate,    title: "Admin & Compliance",    desc: "Role-based access, audit-ready records, and tenant-isolated data by company." },
];

const features = [
  "Centralized communication across the company",
  "Document compliance with expiry reminders",
  "Role-aware dashboards for admins, managers, employees",
  "AI built-in — drafting, summaries, recommendations",
  "Realtime presence and activity insights",
  "Tenant-isolated, secure by default",
];

const trustBadges = ["No credit card required", "Setup in minutes", "AI included"];

export default function LandingPage() {
  return (
    <main className="bg-white text-gray-900 font-sans">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100 blur-3xl opacity-60" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-violet-100 blur-3xl opacity-50" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 text-center md:pt-24 md:pb-16">

          {/* Badge */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
              <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
            </svg>
            <span className="text-grey-600">One platform for consulting &amp; staffing teams</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mt-5 max-w-4xl text-3xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Run your entire team from{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              one place
            </span>.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500 md:text-xl">
            EzTrackly unifies attendance, employee lifecycle, social outreach, leads, and reporting —
            so consulting firms ship faster, stay compliant, and grow.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#cta"
              className="w-45 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-indigo-700 hover:to-violet-700 shadow-md transition-all"
            >
              Get started free
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a
              href="#modules"
              className="w-45 inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 active:bg-blue-100 active:border-blue-400 active:text-blue-900 shadow-sm hover:shadow-md transition-all duration-300"
            >
              Explore modules
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
            {trustBadges.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-50 text-indigo-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {t}
              </span>
            ))}
          </div>

          {/* Preview frame */}
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-indigo-100">
              <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {modules.slice(0, 4).map((m) => (
                    <div key={m.title} className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50">
                        <img src={m.icon.src || m.icon} alt={m.title} className="w-5 h-5" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-gray-800">{m.title}</div>
                      <div className="mt-1 text-xs text-gray-400 line-clamp-2">{m.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-400">Active today</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">42</div>
                    <div className="text-xs text-emerald-600 font-medium">+12% this week</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-400">Pending requests</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">7</div>
                    <div className="text-xs text-gray-400">2 overdue</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-400">Compliance</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">98%</div>
                    <div className="text-xs text-emerald-600 font-medium">on track</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Modules</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">Everything your team needs.</h2>
            <p className="mt-4 text-gray-500">Replace a dozen tools with one centralized workspace built for consulting firms.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
              >
                <div className="p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 group-hover:bg-indigo-600 transition-colors duration-200">
                    <img
                      src={m.icon.src || m.icon}
                      alt={m.title}
                      className="h-5 w-5 group-hover:brightness-0 group-hover:invert transition-all duration-200"
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-800">{m.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-400">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Why EzTrackly</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
              Built for the way consulting firms actually work.
            </h2>
            <p className="mt-4 text-gray-500">
              From onboarding a new consultant to closing the next deal, every workflow is wired
              together — with AI doing the heavy lifting.
            </p>
          </div>
          <ul className="grid gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className=" py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-10 text-center text-white shadow-2xl shadow-indigo-200 md:p-14">
            <div className="pointer-events-none absolute inset-0 opacity-25">
              <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white blur-3xl" />
            </div>
            <h2 className="relative text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to centralize your team?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-white/85">
              Start free today. Bring your whole consulting practice into one workspace.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#"
                className="w-40 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-black bg-white hover:bg-gray-100 shadow-sm transition-colors"
              >
                Get started
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a
                href="./auth"
                 className="w-40 inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-white/40 bg-transparent text-white text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}