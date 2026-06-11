"use client";
import { useState, useEffect } from "react";

const sans = "'Plus Jakarta Sans',sans-serif";
const mono = "'JetBrains Mono',monospace";

function fmtN(n: number) { return "N" + Number(n||0).toLocaleString("en-NG"); }

interface MonthData {
  month: string;
  new_clients: number;
  setup_revenue: number;
  monthly_revenue: number;
}

interface Summary {
  mrr: number;
  faithdeskMrr: number;
  detaildeskMrr: number;
  orgs: { active: number; pending: number; total: number; faithdesk: number; detaildesk: number };
  affiliates: { active: number; pending: number };
  pendingPayoutCount: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [months,  setMonths]    = useState<MonthData[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/summary").then(r => r.json()),
      fetch("/api/analytics/monthly").then(r => r.json()),
    ]).then(([s, m]) => {
      setSummary(s);
      setMonths(m.months || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const maxSetup = Math.max(...months.map(m => Number(m.setup_revenue || 0)), 1);
  const maxMRR   = Math.max(...months.map(m => Number(m.monthly_revenue || 0)), 1);

  const totalSetup    = months.reduce((a, m) => a + Number(m.setup_revenue || 0), 0);
  const totalMonthly  = months.reduce((a, m) => a + Number(m.monthly_revenue || 0), 0);
  const totalClients  = months.reduce((a, m) => a + Number(m.new_clients || 0), 0);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ textAlign:"center", fontFamily:sans }}>
        <div style={{ width:28, height:28, border:"2px solid rgba(201,168,76,0.2)", borderTop:"2px solid #C9A84C", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
        <p style={{ color:"rgba(226,232,240,0.3)", fontSize:"0.82rem" }}>Loading analytics...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:sans, maxWidth:1200 }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Analytics</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>Revenue trends, client growth, and business performance.</p>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:28 }}>
        {[
          { label:"Current MRR",        value: fmtN(summary?.mrr||0),                  color:"#34D399" },
          { label:"Active Clients",      value: summary?.orgs?.active||0,               color:"#60A5FA" },
          { label:"Total Clients",       value: summary?.orgs?.total||0,                color:"rgba(226,232,240,0.5)" },
          { label:"FaithDesk MRR",       value: fmtN(summary?.faithdeskMrr||0),         color:"#8B5CF6" },
          { label:"DetailDesk MRR",      value: fmtN(summary?.detaildeskMrr||0),        color:"#F59E0B" },
          { label:"Active Affiliates",   value: summary?.affiliates?.active||0,         color:"#A78BFA" },
          { label:"12-mo Setup Revenue", value: fmtN(totalSetup),                       color:"#34D399" },
          { label:"12-mo New Clients",   value: totalClients,                           color:"#60A5FA" },
        ].map(k => (
          <div key={k.label} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 18px", borderTop:`2px solid ${k.color}` }}>
            <p style={{ fontWeight:700, fontSize:"1.3rem", color:"#fff", lineHeight:1, marginBottom:4 }}>{k.value}</p>
            <p style={{ fontSize:"0.72rem", color:k.color, fontWeight:600 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      {months.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"48px 32px", textAlign:"center" }}>
          <p style={{ color:"rgba(226,232,240,0.3)", fontSize:"0.9rem" }}>No monthly data yet -- data will appear once clients activate.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))", gap:16 }}>

          {/* Setup revenue chart */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"20px" }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem", marginBottom:4 }}>Setup Revenue by Month</p>
            <p style={{ fontSize:"0.72rem", color:"rgba(226,232,240,0.3)", marginBottom:20 }}>One-time setup fees collected</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[...months].reverse().map(m => (
                <div key={m.month}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:mono, fontSize:"0.68rem", color:"rgba(226,232,240,0.5)" }}>{m.month}</span>
                    <span style={{ fontFamily:mono, fontSize:"0.68rem", color:"#34D399", fontWeight:700 }}>{fmtN(Number(m.setup_revenue||0))}</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:3, background:"#34D399", width:`${(Number(m.setup_revenue||0)/maxSetup)*100}%`, transition:"width 0.4s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MRR chart */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"20px" }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem", marginBottom:4 }}>Monthly Subscription Revenue</p>
            <p style={{ fontSize:"0.72rem", color:"rgba(226,232,240,0.3)", marginBottom:20 }}>Recurring fees by activation month</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[...months].reverse().map(m => (
                <div key={m.month}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:mono, fontSize:"0.68rem", color:"rgba(226,232,240,0.5)" }}>{m.month}</span>
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontFamily:mono, fontSize:"0.62rem", color:"rgba(226,232,240,0.3)" }}>{Number(m.new_clients||0)} clients</span>
                      <span style={{ fontFamily:mono, fontSize:"0.68rem", color:"#C9A84C", fontWeight:700 }}>{fmtN(Number(m.monthly_revenue||0))}/mo</span>
                    </div>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:3, background:"#C9A84C", width:`${(Number(m.monthly_revenue||0)/maxMRR)*100}%`, transition:"width 0.4s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product split */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"20px" }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem", marginBottom:4 }}>Product Split</p>
            <p style={{ fontSize:"0.72rem", color:"rgba(226,232,240,0.3)", marginBottom:20 }}>Current active clients by product</p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { label:"FaithDesk",  value:summary?.orgs?.faithdesk||0,  mrr:summary?.faithdeskMrr||0,  color:"#8B5CF6" },
                { label:"DetailDesk", value:summary?.orgs?.detaildesk||0, mrr:summary?.detaildeskMrr||0, color:"#F59E0B" },
              ].map(p => {
                const total = (summary?.orgs?.active||0) || 1;
                return (
                  <div key={p.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:"0.85rem", color:p.color }}>{p.label}</span>
                        <span style={{ fontSize:"0.72rem", color:"rgba(226,232,240,0.3)", marginLeft:8 }}>{p.value} clients</span>
                      </div>
                      <span style={{ fontFamily:mono, fontSize:"0.75rem", color:"#fff", fontWeight:700 }}>{fmtN(p.mrr)}/mo</span>
                    </div>
                    <div style={{ height:8, borderRadius:4, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:4, background:p.color, width:`${(p.value/total)*100}%`, transition:"width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <p style={{ fontFamily:mono, fontSize:"0.6rem", color:"rgba(226,232,240,0.25)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>12-mo Setup Total</p>
                  <p style={{ fontWeight:700, fontSize:"0.95rem", color:"#fff" }}>{fmtN(totalSetup)}</p>
                </div>
                <div>
                  <p style={{ fontFamily:mono, fontSize:"0.6rem", color:"rgba(226,232,240,0.25)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Projected Annual MRR</p>
                  <p style={{ fontWeight:700, fontSize:"0.95rem", color:"#34D399" }}>{fmtN((summary?.mrr||0)*12)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"20px" }}>
            <p style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem", marginBottom:16 }}>Business Summary</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"Monthly Recurring Revenue", value:fmtN(summary?.mrr||0), note:"current MRR", color:"#34D399" },
                { label:"Annual Run Rate",            value:fmtN((summary?.mrr||0)*12), note:"MRR x 12", color:"#60A5FA" },
                { label:"Avg Revenue per Client",     value:summary?.orgs?.active ? fmtN(Math.round((summary.mrr)/(summary.orgs.active))) : "N/A", note:"MRR / active clients", color:"#C9A84C" },
                { label:"Pending Applications",       value:summary?.affiliates?.pending||0, note:"affiliates awaiting review", color:"#A78BFA" },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
                  <div>
                    <p style={{ fontSize:"0.78rem", fontWeight:600, color:"rgba(226,232,240,0.7)" }}>{s.label}</p>
                    <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:2 }}>{s.note}</p>
                  </div>
                  <p style={{ fontFamily:mono, fontSize:"0.88rem", fontWeight:700, color:s.color }}>{String(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
