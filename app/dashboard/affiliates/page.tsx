
"use client";
import { useState, useEffect } from "react";

function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }); }

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Record<string,unknown>[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string|null>(null);
  const sans = "'Plus Jakarta Sans',sans-serif";

  function load() {
    setLoading(true);
    fetch(`/api/affiliates/list?status=${filter}`)
      .then(r => r.json()).then(d => { setAffiliates(d.affiliates||[]); setLoading(false); });
  }
  useEffect(() => { load(); }, [filter]);

  async function action(id: string, act: string) {
    setActioning(id);
    await fetch("/api/affiliates/approve-payout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:act, id }) });
    setActioning(null); load();
  }

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:sans, maxWidth:1400 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Affiliates</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>Manage affiliate applications and accounts</p>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" as const }}>
        {["pending","active","rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:"8px 16px", borderRadius:8, fontSize:"0.75rem", fontWeight:600, border:"none", cursor:"pointer", textTransform:"capitalize" as const,
              background: filter===s ? "#C9A84C" : "rgba(255,255,255,0.06)",
              color: filter===s ? "#060E2A" : "rgba(226,232,240,0.55)" }}>
            {s}
          </button>
        ))}
      </div>
      {loading ? <p style={{ color:"rgba(226,232,240,0.3)", textAlign:"center", padding:32 }}>Loading...</p>
      : affiliates.length === 0 ? <p style={{ color:"rgba(226,232,240,0.3)", textAlign:"center", padding:32, fontStyle:"italic" }}>No {filter} affiliates</p>
      : <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
          {affiliates.map(aff => (
            <div key={aff.id as string} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"20px 24px" }}>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" as const }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" as const }}>
                      <p style={{ fontWeight:700, color:"#fff", fontSize:"0.95rem" }}>{aff.first_name as string} {aff.last_name as string}</p>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.6rem", fontWeight:700, padding:"2px 8px", borderRadius:4,
                        background: aff.status==="active" ? "rgba(16,185,129,0.15)" : aff.status==="pending" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)",
                        color: aff.status==="active" ? "#34D399" : aff.status==="pending" ? "#FCD34D" : "#F87171" }}>
                        {aff.status as string}
                      </span>
                    </div>
                    <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.55)" }}>{aff.email as string}</p>
                    {Boolean(aff.phone) && <p style={{ fontSize:"0.78rem", color:"rgba(226,232,240,0.35)", marginTop:2 }}>{String(aff.phone || "")}</p>}
                    {Boolean(aff.how_promote) && (
                      <div style={{ marginTop:10, padding:"10px 12px", borderRadius:6, background:"rgba(255,255,255,0.04)", fontSize:"0.78rem", color:"rgba(226,232,240,0.6)", lineHeight:1.5 }}>
                        <span style={{ fontWeight:600, color:"rgba(226,232,240,0.4)" }}>Plan: </span>{String(aff.how_promote || "")}
                      </div>
                    )}
                    <p style={{ fontSize:"0.68rem", color:"rgba(226,232,240,0.25)", marginTop:8, fontFamily:"'JetBrains Mono',monospace" }}>
                      Applied {fmtDate(aff.created_at as string)} - Code: {aff.referral_code as string}
                    </p>
                  </div>
                  {filter==="pending" && (
                    <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                      <button onClick={() => action(aff.id as string, "approve")} disabled={actioning===aff.id as string}
                        style={{ padding:"9px 18px", borderRadius:8, fontWeight:700, fontSize:"0.72rem", textTransform:"uppercase" as const, background:"#C9A84C", color:"#060E2A", border:"none", cursor:"pointer", opacity:actioning===aff.id as string?0.5:1 }}>
                        {actioning===aff.id ? "..." : "Approve"}
                      </button>
                      <button onClick={() => action(aff.id as string, "reject")} disabled={actioning===aff.id as string}
                        style={{ padding:"9px 18px", borderRadius:8, fontWeight:700, fontSize:"0.72rem", textTransform:"uppercase" as const, background:"rgba(239,68,68,0.1)", color:"#F87171", border:"1px solid rgba(239,68,68,0.2)", cursor:"pointer", opacity:actioning===aff.id as string?0.5:1 }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
