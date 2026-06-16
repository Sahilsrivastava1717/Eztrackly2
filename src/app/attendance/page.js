"use client";

import { useState, useEffect, useMemo } from "react";
import AddQuickTaskDrawer from "../../components/client/AddQuickTaskDrawer";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour:"numeric", minute:"2-digit", hour12:true });
}
function fmtDur(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h}h ${m}m`;
}
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseHM(t) {
  const [h, m] = (t||"09:00").split(":").map(Number);
  return { h: h||0, m: m||0 };
}
function startOfWeek(d) {
  const x = new Date(d); x.setHours(0,0,0,0);
  const diff = (x.getDay()+6)%7;
  x.setDate(x.getDate()-diff);
  return x;
}

// ── mock data ─────────────────────────────────────────────────────────────────
function genMockSessions() {
  const now = new Date();
  const sessions = [];
  for (let i = 1; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), i);
    if (d.getDay()===0||d.getDay()===6) continue;
    const login = new Date(d);
    login.setHours(9, 20+Math.floor(Math.random()*30), 0, 0);
    const logout = new Date(login);
    logout.setHours(logout.getHours()+7, logout.getMinutes()+Math.floor(Math.random()*60), 0, 0);
    sessions.push({
      id: String(i),
      user_id: "mock",
      login_at: login.toISOString(),
      logout_at: i===11 ? null : logout.toISOString(),
      checkin_photo_url: null,
      checkout_photo_url: null,
    });
  }
  return sessions;
}
const MOCK_SESSIONS = genMockSessions();

// ── icons ─────────────────────────────────────────────────────────────────────
const Ic = {
  Download: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ChevL:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Cal:      ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  LogIn:    ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  LogOut:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock:    ({c})=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Flame:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Trend:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Activity: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Timer:    ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Sparkle:  ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>,
  AIIcon:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>,
};

// ── tint map ──────────────────────────────────────────────────────────────────
const TINTS = {
  emerald: { bg:"rgba(16,185,129,.12)", color:"#059669" },
  sky:     { bg:"rgba(14,165,233,.12)", color:"#0284c7" },
  violet:  { bg:"rgba(139,92,246,.12)", color:"#7c3aed" },
  orange:  { bg:"rgba(249,115,22,.12)", color:"#ea580c" },
  rose:    { bg:"rgba(244,63,94,.12)",  color:"#e11d48" },
};

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ Icon, label, value, tint }) {
  const t = TINTS[tint];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
      padding:"14px 16px", boxShadow:"0 1px 3px rgba(0,0,0,.04)"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:t.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:t.color }}><Icon /></span>
        </div>
        <span style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", color:"#9ca3af" }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:"#111827" }}>{value}</div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Bdg({ children, style }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px", borderRadius:999, fontSize:12, fontWeight:500,
      border:"1px solid #e5e7eb", background:"#f9fafb", color:"#374151",
      ...style
    }}>{children}</span>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function MyAttendancePage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [loading,  setLoading]  = useState(false);
  const [tab, setTab]           = useState("daily");
  const [now, setNow]           = useState(()=>new Date());
  const [cursor, setCursor]     = useState(()=>{ const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const workStart = { h:9, m:0 };

  useEffect(()=>{
    const id = setInterval(()=>setNow(new Date()), 60000);
    return ()=>clearInterval(id);
  },[]);

  const isOnTime = (iso)=>{
    const d = new Date(iso);
    const cutoff = new Date(d); cutoff.setHours(workStart.h, workStart.m+15, 0, 0);
    return d<=cutoff;
  };

  const monthLabel = cursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const isCurrentMonth = now.getFullYear()===cursor.getFullYear() && now.getMonth()===cursor.getMonth();

  // group by day
  const byDay = useMemo(()=>{
    const map = new Map();
    sessions.forEach(s=>{
      const k = ymd(new Date(s.login_at));
      if(!map.has(k)) map.set(k,[]);
      map.get(k).push(s);
    });
    return Array.from(map.entries())
      .sort((a,b)=>a[0]<b[0]?1:-1)
      .map(([day,list])=>{
        const sorted = [...list].sort((a,b)=>a.login_at.localeCompare(b.login_at));
        const checkIn = sorted[0].login_at;
        const checkInPhoto = sorted[0].checkin_photo_url??null;
        const last = sorted[sorted.length-1];
        const checkOut = last.logout_at;
        const checkOutPhoto = last.checkout_photo_url??null;
        let totalMin=0;
        sorted.forEach(s=>{
          const end = s.logout_at?new Date(s.logout_at):new Date();
          totalMin+=Math.max(0,Math.round((end-new Date(s.login_at))/60000));
        });
        return {day,checkIn,checkInPhoto,checkOut,checkOutPhoto,totalMin,sessions:sorted,isOpen:!checkOut};
      });
  },[sessions]);

  const totalMonthMin = byDay.reduce((s,d)=>s+d.totalMin,0);

  const stats = useMemo(()=>{
    if(!byDay.length) return {streak:0,onTimeDays:0,avgCheckIn:null};
    const sortedAsc = [...byDay].sort((a,b)=>a.day<b.day?-1:1);
    let longest=0, current=0, prev=null;
    sortedAsc.forEach(d=>{
      const dt=new Date(d.day+"T00:00:00");
      if(prev){ const diff=Math.round((dt-prev)/86400000); current=diff===1?current+1:1; }
      else current=1;
      if(current>longest) longest=current;
      prev=dt;
    });
    const onTimeDays = byDay.filter(d=>isOnTime(d.checkIn)).length;
    const avgMin = Math.round(byDay.reduce((s,d)=>{
      const t=new Date(d.checkIn); return s+t.getHours()*60+t.getMinutes();
    },0)/byDay.length);
    const ah=Math.floor(avgMin/60),am=avgMin%60;
    const ampm=ah>=12?"PM":"AM", hh=((ah+11)%12)+1;
    return {streak:longest,onTimeDays,avgCheckIn:`${hh}:${String(am).padStart(2,"0")} ${ampm}`};
  },[byDay]);

  const weekly = useMemo(()=>{
    const weeks=new Map();
    byDay.forEach(d=>{
      const dt=new Date(d.day+"T00:00:00");
      const ws=startOfWeek(dt), key=ymd(ws);
      if(!weeks.has(key)) weeks.set(key,{start:ws,days:[],total:0});
      const w=weeks.get(key); w.days.push(d); w.total+=d.totalMin;
    });
    return Array.from(weeks.values()).sort((a,b)=>a.start>b.start?-1:1);
  },[byDay]);

  const todayKey=ymd(now);
  const todayData=byDay.find(d=>d.day===todayKey)??null;

  const exportCSV = ()=>{
    const rows=[
      ["Date","Check in","Check out","Total","On time"],
      ...[...byDay].sort((a,b)=>a.day<b.day?-1:1).map(d=>[
        d.day, fmtTime(d.checkIn),
        d.isOpen?"Active":fmtTime(d.checkOut),
        fmtDur(d.totalMin), isOnTime(d.checkIn)?"Yes":"No"
      ])
    ];
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`attendance-${ymd(cursor).slice(0,7)}.csv`; a.click();
  };

  const exportPDF = ()=>{
    const w=window.open("","_blank"); if(!w) return;
    const rows=[...byDay].sort((a,b)=>a.day<b.day?-1:1).map(d=>`
      <tr><td>${new Date(d.day+"T00:00:00").toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</td>
      <td>${fmtTime(d.checkIn)}</td><td>${d.isOpen?"Active":fmtTime(d.checkOut)}</td>
      <td>${fmtDur(d.totalMin)}</td><td>${isOnTime(d.checkIn)?"✓":"—"}</td></tr>`).join("");
    w.document.write(`<html><head><title>Attendance ${monthLabel}</title>
    <style>body{font-family:-apple-system,sans-serif;padding:32px}table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border-bottom:1px solid #e5e7eb;padding:8px 10px;text-align:left}th{background:#f9fafb;font-size:11px;font-weight:600;text-transform:uppercase;color:#666}
    @media print{button{display:none}}</style></head><body>
    <h2>Attendance — ${monthLabel}</h2>
    <table><thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Total</th><th>On time</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <button onclick="window.print()" style="margin-top:20px;padding:8px 16px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer">Print / Save PDF</button>
    </body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  };

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .fab{position:fixed;bottom:32px;right:32px;width:52px;height:52px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 4px 14px rgba(37,99,235,.45)}
        .fab:hover{background:#1d4ed8}
        .tab-btn{padding:7px 18px;border-radius:8px;border:none;font-size:14px;font-weight:500;cursor:pointer;background:transparent;color:#6b7280}
        .tab-btn.active{background:#fff;color:#111827;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}
        .action-btn{
        display:flex;
        align-items:center;
        gap:6px;
        padding:7px 14px;
        border-radius:8px;
        border:1px solid #e5e7eb;
        background:#fff;
        font-size:13px;
        font-weight:600;
        color:#374151;
        cursor:pointer;
        transition:all .25s ease;
        box-shadow:0 2px 8px rgba(0,0,0,.12);
      }
      .action-btn:hover{
        background:#eff6ff;
        border-color:#93c5fd;
        color:#2563eb;
        box-shadow:0 8px 20px rgba(0,0,0,.18);
        transform:translateY(-2px);
      }
      .arrow-btn{
        width:33px;
        height:33px;
        border-radius:10px;
        border:1px solid #e5e7eb;
        background:#f8fafc;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#374151;
        cursor:pointer;
        box-shadow:0 1px 3px rgba(0,0,0,.06);
        transition:all .2s ease;
      }
      .arrow-btn:hover{
        background:#eff6ff;
        border-color:#93c5fd;
        color:#2563eb;
        box-shadow:0 8px 20px rgba(0,0,0,.18);
        transform:translateY(-1px);
      }
      `}</style>

      <div style={{maxWidth:960,margin:"0 auto",paddingBottom:48}}>

        {/* ── Header card ── */}
        <div style={{
          background:"linear-gradient(135deg,rgba(14,165,233,.08) 0%,#fff 60%)",
          border:"1px solid #e5e7eb", borderRadius:16, padding:"24px 28px",
          marginBottom:20, boxShadow:"0 1px 3px rgba(0,0,0,.04)", position:"relative", overflow:"hidden"
        }}>
          <div style={{
            position:"absolute",top:-60,right:-60,width:200,height:200,
            borderRadius:"50%",background:"rgba(14,165,233,.08)",filter:"blur(40px)"
          }}/>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,position:"relative"}}>
            <div>
              <h1 style={{fontSize:28,fontWeight:700,color:"#0f172a",letterSpacing:"-0.3px"}}>My Attendance</h1>
              <p style={{fontSize:14,color:"#6b7280",marginTop:4}}>Your daily check-in and check-out times</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {/* CSV */}
              <button onClick={exportCSV} className="action-btn">
                <Ic.Download/> CSV
              </button>
              {/* PDF */}
              <button onClick={exportPDF} className="action-btn">
                <Ic.Download/> PDF
              </button>
              {/* Prev */}
              <button className="arrow-btn"><Ic.ChevL /></button>
              {/* Month label */}
              <div style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",
                fontSize:14,fontWeight:500,color:"#111827",minWidth:140,justifyContent:"center"
              }}>
                <Ic.Cal/> {monthLabel}
              </div>
              {/* Next */}
              <button 
              disabled={isCurrentMonth}
                onClick={()=>{const d=new Date(cursor);d.setMonth(d.getMonth()+1);setCursor(d);}} className="arrow-btn"><Ic.ChevR /></button>
              
            </div>
          </div>
        </div>

        {/* ── AI Weekly Summary card ── */}
        <div style={{
          background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,
          padding:"18px 24px",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,.04)"
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{
                width:40,height:40,borderRadius:"50%",
                background:"linear-gradient(135deg,#a855f7,#6366f1)",
                display:"flex",alignItems:"center",justifyContent:"center"
              }}>
                <Ic.AIIcon/>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"#111827"}}>AI Weekly Summary</div>
                <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>
                  {(()=>{
                    const ws=startOfWeek(now);
                    const we=new Date(ws); we.setDate(we.getDate()+6);
                    const fmt=d=>d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
                    return `${fmt(ws)} — ${fmt(we)} (this week)`;
                  })()}
                </div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="arrow-btn"><Ic.ChevL /></button>
              <button className="arrow-btn"><Ic.ChevR /></button>
              <button style={{
                display:"flex",
                alignItems:"center",
                gap:7,
                padding:"8px 18px",
                borderRadius:8,
                border:"none",
                background:"#2563eb",
                color:"#fff",
                fontSize:13,
                fontWeight:600,
                cursor:"pointer",
                boxShadow:"0 4px 12px rgba(0,0,0,0.15)",
                transition:"all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              <Ic.AIIcon /> Generate
            </button>
            </div>
          </div>
          <div style={{
            marginTop:20,padding:"32px 20px",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10
          }}>
            <Ic.Sparkle/>
            <div style={{fontSize:14,fontWeight:500,color:"#374151",textAlign:"center"}}>Generate an AI-powered weekly performance summary.</div>
            <div style={{fontSize:13,color:"#9ca3af",textAlign:"center"}}>Tailored to role-specific KPIs · attendance · activities · output.</div>
          </div>
        </div>

        {/* ── Today card ── */}
        {isCurrentMonth && (
          <div style={{
            background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,
            padding:"18px 24px",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,.04)"
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{
                  width:40,height:40,borderRadius:"50%",
                  background:"rgba(14,165,233,.1)",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"#0284c7"
                }}>
                  <Ic.Activity/>
                </div>
                <div>
                  <div style={{fontSize:13,color:"#9ca3af"}}>
                    Today, {now.toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"short"})}
                  </div>
                  <div style={{fontSize:17,fontWeight:600,color:"#111827",marginTop:2}}>
                    {todayData
                      ? todayData.isOpen
                        ? <>Active — checked in at <span style={{color:"#2563eb"}}>{fmtTime(todayData.checkIn)}</span></>
                        : <>Checked out at <span style={{color:"#6b7280"}}>{fmtTime(todayData.checkOut)}</span></>
                      : "Not checked in yet"
                    }
                  </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {todayData && (
                  <Bdg style={todayData.isOpen
                    ?{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}
                    :{background:"#f3f4f6",color:"#6b7280",border:"1px solid #e5e7eb"}
                  }>
                    {todayData.isOpen && <span className="pulse" style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>}
                    {todayData.isOpen?"Active":"Done for the day"}
                  </Bdg>
                )}
                {todayData && (
                  <Bdg style={isOnTime(todayData.checkIn)
                    ?{background:"#eff6ff",color:"#0284c7",border:"1px solid #bae6fd"}
                    :{background:"#fffbeb",color:"#d97706",border:"1px solid #fde68a"}
                  }>
                    {isOnTime(todayData.checkIn)?"On time":"Late"}
                  </Bdg>
                )}
                <div style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"6px 12px",borderRadius:8,
                  background:"#f9fafb",border:"1px solid #e5e7eb",
                  fontSize:14,fontWeight:600,color:"#374151"
                }}>
                  <Ic.Timer/> {todayData?fmtDur(todayData.totalMin):"0h 0m"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats grid ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:20}}>
          <StatCard Icon={Ic.Check}    label="Days Present"    value={String(byDay.length)}                                                  tint="emerald"/>
          <StatCard Icon={()=><Ic.Clock c="#0284c7"/>} label="Total Time"     value={fmtDur(totalMonthMin)}                                  tint="sky"/>
          <StatCard Icon={Ic.Trend}    label="Avg / Day"       value={byDay.length?fmtDur(Math.round(totalMonthMin/byDay.length)):"—"}       tint="violet"/>
          <StatCard Icon={Ic.Flame}    label="Longest Streak"  value={`${stats.streak}d`}                                                    tint="orange"/>
          <StatCard Icon={()=><Ic.LogIn/>} label="Avg Check-In" value={stats.avgCheckIn??"—"}                                               tint="rose"/>
        </div>

        {/* ── Tabs ── */}
        <div style={{display:"flex",gap:4,background:"#f3f4f6",borderRadius:10,padding:3,width:"fit-content",marginBottom:16}}>
          {["daily","weekly"].map(t=>(
            <button key={t} className={`tab-btn${tab===t?" active":""}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Daily table ── */}
        {tab==="daily" && (
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
            {/* header row */}
            <div style={{
              display:"grid",gridTemplateColumns:"3fr 2fr 2fr 1.5fr",gap:8,
              background:"#f9fafb",padding:"10px 20px",
              fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",color:"#9ca3af",
              borderBottom:"1px solid #f3f4f6"
            }}>
              <div>Date</div><div>Check in</div><div>Check out</div><div style={{textAlign:"right"}}>Total</div>
            </div>
            {loading
              ? <div style={{padding:"48px 20px",textAlign:"center",fontSize:14,color:"#9ca3af"}}>Loading…</div>
              : byDay.length===0
                ? <div style={{padding:"48px 20px",textAlign:"center",fontSize:14,color:"#9ca3af"}}>No attendance records for {monthLabel}.</div>
                : byDay.map((d,i)=>{
                    const dateObj=new Date(d.day+"T00:00:00");
                    const isToday=ymd(new Date())===d.day;
                    const onTime=isOnTime(d.checkIn);
                    return (
                      <div key={d.day} style={{
                        display:"grid",gridTemplateColumns:"3fr 2fr 2fr 1.5fr",gap:8,
                        alignItems:"center",padding:"12px 20px",
                        background:isToday?"rgba(37,99,235,.03)":"#fff",
                        borderTop:i===0?"none":"1px solid #f3f4f6"
                      }}>
                        <div>
                          <div style={{fontSize:14,fontWeight:500,color:"#111827",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            {dateObj.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}
                            {isToday&&<Bdg style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",fontSize:10}}>Today</Bdg>}
                            {!onTime&&<Bdg style={{background:"#fffbeb",color:"#d97706",border:"1px solid #fde68a",fontSize:10}}>Late</Bdg>}
                          </div>
                          <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{d.sessions.length} session{d.sessions.length===1?"":"s"}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:14,color:"#111827"}}>
                          <Ic.LogIn/> {fmtTime(d.checkIn)}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:14,color:"#111827"}}>
                          <Ic.LogOut/>
                          {d.isOpen
                            ? <Bdg style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>Active</Bdg>
                            : fmtTime(d.checkOut)
                          }
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5,fontSize:14,fontWeight:600,color:"#111827"}}>
                          <Ic.Clock c="#9ca3af"/> {fmtDur(d.totalMin)}
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        )}

        {/* ── Weekly table ── */}
        {tab==="weekly" && (
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
            <div style={{
              display:"grid",gridTemplateColumns:"3fr 2.5fr 1.5fr 1.5fr",gap:8,
              background:"#f9fafb",padding:"10px 20px",
              fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",color:"#9ca3af",
              borderBottom:"1px solid #f3f4f6"
            }}>
              <div>Week</div><div style={{textAlign:"center"}}>Days</div><div style={{textAlign:"right"}}>Avg/Day</div><div style={{textAlign:"right"}}>Total</div>
            </div>
            {weekly.length===0
              ? <div style={{padding:"48px 20px",textAlign:"center",fontSize:14,color:"#9ca3af"}}>No weekly data.</div>
              : weekly.map((w,i)=>{
                  const end=new Date(w.start); end.setDate(end.getDate()+6);
                  const fmt=d=>d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
                  return (
                    <div key={w.start.toISOString()} style={{
                      display:"grid",gridTemplateColumns:"3fr 2.5fr 1.5fr 1.5fr",gap:8,
                      alignItems:"center",padding:"12px 20px",
                      borderTop:i===0?"none":"1px solid #f3f4f6"
                    }}>
                      <div>
                        <div style={{fontSize:14,fontWeight:500,color:"#111827"}}>{fmt(w.start)} — {fmt(end)}</div>
                        <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{w.days.length} day{w.days.length===1?"":"s"} present</div>
                      </div>
                      <div style={{display:"flex",justifyContent:"center",gap:4}}>
                        {Array.from({length:7}).map((_,idx)=>{
                          const dt=new Date(w.start); dt.setDate(dt.getDate()+idx);
                          const present=w.days.find(d=>d.day===ymd(dt));
                          return (
                            <div key={idx} title={dt.toLocaleDateString()} style={{
                              width:24,height:24,borderRadius:6,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:10,fontWeight:600,border:"1px solid",
                              ...(present
                                ?{background:"rgba(16,185,129,.15)",color:"#059669",borderColor:"rgba(16,185,129,.3)"}
                                :{background:"#f9fafb",color:"#9ca3af",borderColor:"#e5e7eb"}
                              )
                            }}>
                              {["M","T","W","T","F","S","S"][idx]}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{fontSize:14,color:"#9ca3af",textAlign:"right"}}>
                        {w.days.length?fmtDur(Math.round(w.total/w.days.length)):"—"}
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:"#111827",textAlign:"right"}}>{fmtDur(w.total)}</div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
       

      <button
              onClick={() => setDrawerOpen(true)}
              className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
              title="Add a quick task"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
       
            {/* Quick Task Drawer */}
            <AddQuickTaskDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
