"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const mono = "'JetBrains Mono', monospace";
const sans = "'Plus Jakarta Sans', sans-serif";

function fmtN(n: number) { return "N" + Number(n).toLocaleString("en-NG"); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }); }

const PRODUCT_COLOR: Record<string,string> = { faithdesk:"#8B5CF6", detaildesk:"#F59E0B", schooldesk:"#10B981" };
const PRODUCT_LABEL: Record<string,string> = { faithdesk:"FaithDesk", detaildesk:"DetailDesk", schooldesk:"SchoolDesk" };

interface Summary {
  orgs: { active:number; pending:number; total:number; faithdesk:number; detaildesk:number };
  mrr: number;
  faithdeskMrr: number;
  detaildeskMrr: number;
  recentSignups: Record<string,unknown>[];
  affiliates: { pending:number; active:number; total:number };
  pendingPayoutCount: number;
}

function StatCard({ label, value, sub, color, accent }: { label:string; value:string|number; sub:string; color:string; accent:string }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"18px 20px", borderTop:`2px solid ${accent}` }}>
      <p style={{ fontWeight:700, fontSize:"1.4rem", color:"#fff", lineHeight:1, marginBottom:4 }}>{value}</p>
      <p style={{ fontSize:"0.78rem", fontWeight:600, color:accent, marginBottom:3 }}>{label}</p>
      <p style={{ fontSize:"0.68rem", color:"rgba(226,232,240,0.3)", fontFamily:mono }}>{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:32, height:32, border:"2px solid rgba(201,168,76,0.2)", borderTop:"2px solid #C9A84C", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)", fontFamily:sans }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ padding:"32px", fontFamily:sans }}>
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"40px 32px", textAlign:"center", maxWidth:440, margin:"0 auto" }}>
        <p style={{ fontWeight:700, color:"#fff", marginBottom:8 }}>No database connected</p>
        <p style={{ fontSize:"0.85rem", color:"rgba(226,232,240,0.4)", marginBottom:20 }}>Add DATABASE_URL to .env.local to see live data.</p>
        <a href="https://neon.tech" target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex", padding:"10px 24px", borderRadius:8, fontWeight:700, fontSize:"0.75rem", textTransform:"uppercase" as const, letterSpacing:"0.08em", background:"#C9A84C", color:"#060E2A", textDecoration:"none" }}>
          Create Neon DB
        </a>
      </div>
    </div>
  );

  const stats = [
    { label:"Monthly Recurring Revenue", value:fmtN(data.mrr),               sub:"Active subscriptions",          accent:"#34D399" },
    { label:"Active Clients",             value:data.orgs?.active||0,          sub:`${data.orgs?.total||0} total`,  accent:"#60A5FA" },
    { label:"Pending Onboarding",         value:data.orgs?.pending||0,         sub:"Awaiting payment",              accent:"#F59E0B" },
    { label:"Active Affiliates",          value:data.affiliates?.active||0,    sub:`${data.affiliates?.pending||0} pending`, accent:"#A78BFA" },
    { label:"FaithDesk MRR",              value:fmtN(data.faithdeskMrr),       sub:`${data.orgs?.faithdesk||0} clients`,   accent:"#8B5CF6" },
    { label:"DetailDesk MRR",             value:fmtN(data.detaildeskMrr),      sub:`${data.orgs?.detaildesk||0} clients`,  accent:"#F59E0B" },
    { label:"Pending Payouts",            value:data.pendingPayoutCount||0,    sub:"Affiliate requests",            accent:"#F87171" },
    { label:"Total Organisations",        value:data.orgs?.total||0,           sub:"All time",                      accent:"rgba(226,232,240,0.3)" },
  ];

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:sans, maxWidth:1400 }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Dashboard</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>Welcome back. Here is what is happening with JKTL.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:28 }}>
        {stats.map(s => <StatCard key={s.label} color="" {...s} />)}
      </div>

      {/* Two col */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>

        {/* Recent signups */}
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem" }}>Recent Signups</p>
            <Link href="/dashboard/clients" style={{ fontSize:"0.72rem", color:"#C9A84C", textDecoration:"none" }}>View all</Link>
          </div>
          {!data.recentSignups?.length ? (
            <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.3)", textAlign:"center", padding:"24px 0", fontStyle:"italic" }}>No signups yet</p>
          ) : data.recentSignups.map((org: Record<string,unknown>) => (
            <div key={org.id as string} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:6, marginBottom:4, background:"rgba(255,255,255,0.03)" }}>
              <div style={{ width:32, height:32, borderRadius:6, background:(PRODUCT_COLOR[org.product as string]||"#666")+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontFamily:mono, fontSize:"0.6rem", fontWeight:700, color:PRODUCT_COLOR[org.product as string]||"#666" }}>
                  {(org.product as string)?.slice(0,2).toUpperCase()}
                </span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, fontSize:"0.82rem", color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{org.org_name as string}</p>
                <p style={{ fontSize:"0.7rem", color:"rgba(226,232,240,0.35)" }}>{PRODUCT_LABEL[org.product as string]||org.product as string}</p>
              </div>
              <span style={{ fontFamily:mono, fontSize:"0.6rem", fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0,
                background: org.status==="active" ? "rgba(5,150,105,0.15)" : "rgba(245,158,11,0.15)",
                color: org.status==="active" ? "#34D399" : "#FCD34D" }}>
                {(org.status as string).replace("_"," ")}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Alerts */}
          {((data.affiliates?.pending||0) > 0 || (data.pendingPayoutCount||0) > 0) && (
            <div style={{ background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"18px 20px" }}>
              <p style={{ fontWeight:700, fontSize:"0.85rem", color:"#C9A84C", marginBottom:12 }}>Action Required</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(data.affiliates?.pending||0) > 0 && (
                  <Link href="/dashboard/affiliates" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", textDecoration:"none" }}>
                    <div>
                      <p style={{ fontSize:"0.82rem", fontWeight:600, color:"#fff" }}>Affiliate Applications</p>
                      <p style={{ fontSize:"0.7rem", color:"rgba(226,232,240,0.4)" }}>{data.affiliates.pending} pending approval</p>
                    </div>
                    <span style={{ fontFamily:mono, fontSize:"0.6rem", fontWeight:700, padding:"2px 7px", borderRadius:4, background:"rgba(201,168,76,0.15)", color:"#C9A84C" }}>{data.affiliates.pending}</span>
                  </Link>
                )}
                {(data.pendingPayoutCount||0) > 0 && (
                  <Link href="/dashboard/payouts" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", textDecoration:"none" }}>
                    <div>
                      <p style={{ fontSize:"0.82rem", fontWeight:600, color:"#fff" }}>Payout Requests</p>
                      <p style={{ fontSize:"0.7rem", color:"rgba(226,232,240,0.4)" }}>{data.pendingPayoutCount} awaiting processing</p>
                    </div>
                    <span style={{ fontFamily:mono, fontSize:"0.6rem", fontWeight:700, padding:"2px 7px", borderRadius:4, background:"rgba(239,68,68,0.15)", color:"#F87171" }}>{data.pendingPayoutCount}</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"18px 20px" }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem", marginBottom:14 }}>Quick Actions</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"All Clients",    href:"/dashboard/clients"       },
                { label:"Affiliates",     href:"/dashboard/affiliates"    },
                { label:"Payouts",        href:"/dashboard/payouts"       },
                { label:"Onboarding",     href:"/dashboard/onboarding"    },
                { label:"Subscriptions",  href:"/dashboard/subscriptions" },
                { label:"Services",       href:"/dashboard/services"      },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  style={{ display:"flex", alignItems:"center", padding:"10px 12px", borderRadius:6, fontSize:"0.78rem", fontWeight:600, color:"rgba(226,232,240,0.65)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", textDecoration:"none" }}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* MRR breakdown */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"18px 20px" }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem", marginBottom:14 }}>MRR Breakdown</p>
            {[
              { label:"FaithDesk",  value:data.faithdeskMrr,  color:"#8B5CF6", clients:data.orgs?.faithdesk||0 },
              { label:"DetailDesk", value:data.detaildeskMrr, color:"#F59E0B", clients:data.orgs?.detaildesk||0 },
            ].map(p => (
              <div key={p.label} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:6 }}>
                  <span style={{ fontWeight:600, color:p.color }}>{p.label}</span>
                  <span style={{ fontWeight:700, color:"#fff" }}>{fmtN(p.value)}/mo</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:2, background:p.color, width: data.mrr > 0 ? `${(p.value/data.mrr)*100}%` : "0%", transition:"width 0.4s ease" }} />
                </div>
                <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:4, fontFamily:mono }}>{p.clients} active clients</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
