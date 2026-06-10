
"use client";
import { useState, useEffect } from "react";

const tableWrap: React.CSSProperties = { overflowX: "auto", WebkitOverflowScrolling: "touch" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: "'Plus Jakarta Sans', sans-serif" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const badge = (active: boolean, pending = false): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", background: active ? "rgba(16,185,129,0.15)" : pending ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)", color: active ? "#34D399" : pending ? "#FCD34D" : "#F87171" });

function fmtN(n: number) { return "N" + Number(n).toLocaleString("en-NG"); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }); }

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string|null>(null);
  const [msg, setMsg] = useState("");
  const sans = "'Plus Jakarta Sans',sans-serif";

  function load() {
    setLoading(true);
    fetch("/api/affiliates/list?type=payouts")
      .then(r => r.json()).then(d => { setPayouts(d.payouts||[]); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function markPaid(id: string) {
    setMarking(id); setMsg("");
    const res = await fetch("/api/affiliates/approve-payout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"mark-paid", id }) });
    const data = await res.json();
    setMsg(data.ok ? "Marked as paid" : data.error||"Error");
    setMarking(null); load();
  }

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:sans, maxWidth:1400 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Payout Requests</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>Affiliate payout requests pending processing</p>
      </div>
      {msg && <div style={{ padding:"12px 16px", borderRadius:8, marginBottom:16, fontSize:"0.82rem", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", color:"#34D399" }}>{msg}</div>}
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, overflow:"hidden" }}>
        <div style={tableWrap}>
          <table style={table}>
            <thead><tr>
              <th style={th}>Affiliate</th><th style={th}>Amount</th><th style={th}>Bank</th>
              <th style={th}>Account</th><th style={th}>Requested</th><th style={th}>Status</th><th style={th}>Action</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{...td, textAlign:"center", padding:"32px", color:"rgba(226,232,240,0.3)"}}>Loading...</td></tr>
              : payouts.length===0 ? <tr><td colSpan={7} style={{...td, textAlign:"center", padding:"32px", color:"rgba(226,232,240,0.3)", fontStyle:"italic"}}>No pending payouts</td></tr>
              : payouts.map(p => (
                <tr key={p.id as string}>
                  <td style={td}>
                    <p style={{ fontWeight:600, color:"#fff" }}>{p.first_name as string} {p.last_name as string}</p>
                    <p style={{ fontSize:"0.72rem", color:"rgba(226,232,240,0.35)", marginTop:2 }}>{p.email as string}</p>
                  </td>
                  <td style={{...td, fontWeight:700, color:"#34D399"}}>{fmtN(Number(p.amount))}</td>
                  <td style={td}>{p.bank_name as string}</td>
                  <td style={td}><span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.75rem" }}>{p.bank_account as string}</span></td>
                  <td style={{...td, fontSize:"0.75rem"}}>{fmtDate(p.created_at as string)}</td>
                  <td style={td}>
                    <span style={badge(p.status==="paid")}>{p.status as string}</span>
                  </td>
                  <td style={td}>
                    {p.status !== "paid" && (
                      <button onClick={() => markPaid(p.id as string)} disabled={marking===p.id as string}
                        style={{ padding:"7px 14px", borderRadius:6, fontWeight:700, fontSize:"0.7rem", textTransform:"uppercase" as const, background:"#C9A84C", color:"#060E2A", border:"none", cursor:"pointer", opacity:marking===p.id as string?0.5:1 }}>
                        {marking===p.id ? "..." : "Mark Paid"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
