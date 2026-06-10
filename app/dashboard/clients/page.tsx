
"use client";
import { useState, useEffect } from "react";

const tableWrap: React.CSSProperties = { overflowX: "auto", WebkitOverflowScrolling: "touch" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: "'Plus Jakarta Sans', sans-serif" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const badge = (active: boolean, pending = false): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", background: active ? "rgba(16,185,129,0.15)" : pending ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)", color: active ? "#34D399" : pending ? "#FCD34D" : "#F87171" });

function fmtN(n: number) { return "N" + Number(n).toLocaleString("en-NG"); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }); }
const PCOL: Record<string,string> = { faithdesk:"#8B5CF6", detaildesk:"#F59E0B", schooldesk:"#10B981" };
const PLBL: Record<string,string> = { faithdesk:"FaithDesk", detaildesk:"DetailDesk", schooldesk:"SchoolDesk" };

export default function ClientsPage() {
  const [orgs, setOrgs] = useState<Record<string,unknown>[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients?status=${filter}`)
      .then(r => r.json()).then(d => { setOrgs(d.orgs||[]); setLoading(false); });
  }, [filter]);

  const filtered = orgs.filter(o =>
    (o.org_name as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (o.owner_email as string)?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:1400 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Clients</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>All organisations on the Desk platform</p>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          style={{ padding:"9px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#fff", fontSize:"0.85rem", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", width:"100%", maxWidth:280 }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["all","active","pending_payment","suspended"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding:"8px 14px", borderRadius:8, fontSize:"0.72rem", fontWeight:600, border:"none", cursor:"pointer", textTransform:"capitalize" as const, transition:"all 0.15s",
                background: filter===s ? "#C9A84C" : "rgba(255,255,255,0.06)",
                color: filter===s ? "#060E2A" : "rgba(226,232,240,0.55)" }}>
              {s==="pending_payment"?"Pending":s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, overflow:"hidden" }}>
        <div style={tableWrap}>
          <table style={table}>
            <thead><tr>
              <th style={th}>Organisation</th><th style={th}>Product</th><th style={th}>Plan</th>
              <th style={th}>Subdomain</th><th style={th}>Setup</th><th style={th}>Monthly</th>
              <th style={th}>Status</th><th style={th}>Joined</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{...td, textAlign:"center", padding:"32px", color:"rgba(226,232,240,0.3)", fontStyle:"italic"}}>Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} style={{...td, textAlign:"center", padding:"32px", color:"rgba(226,232,240,0.3)", fontStyle:"italic"}}>No clients found</td></tr>
              : filtered.map(org => (
                <tr key={org.id as string}>
                  <td style={td}>
                    <p style={{ fontWeight:600, color:"#fff", fontSize:"0.85rem" }}>{org.org_name as string}</p>
                    <p style={{ fontSize:"0.72rem", color:"rgba(226,232,240,0.35)", marginTop:2 }}>{org.owner_email as string}</p>
                  </td>
                  <td style={td}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.68rem", fontWeight:700, padding:"2px 8px", borderRadius:4, background:(PCOL[org.product as string]||"#666")+"20", color:PCOL[org.product as string]||"#666" }}>
                      {PLBL[org.product as string]||org.product as string}
                    </span>
                  </td>
                  <td style={{...td, textTransform:"capitalize" as const}}>{org.plan as string}</td>
                  <td style={td}><span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.75rem", color:"rgba(226,232,240,0.5)" }}>{org.subdomain as string}.jktl.com.ng</span></td>
                  <td style={{...td, fontWeight:600}}>{fmtN(Number(org.setup_fee))}</td>
                  <td style={td}>{fmtN(Number(org.monthly_fee))}/mo</td>
                  <td style={td}><span style={badge(org.status==="active", org.status==="pending_payment")}>{(org.status as string).replace("_"," ")}</span></td>
                  <td style={{...td, fontSize:"0.75rem"}}>{fmtDate(org.created_at as string)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
