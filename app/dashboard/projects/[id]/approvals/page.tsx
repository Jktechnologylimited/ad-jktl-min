"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Approval { id: string; item_name: string; type: string; submitted_by_name?: string; status: string; submitted_at: string; }
const STATUS_COLOR: Record<string, string> = { pending: "#94A3B8", in_review: "#60A5FA", approved: "#34D399", rejected: "#F87171" };
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }); }
const inputStyle: React.CSSProperties = { padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };

export default function ProjectApprovalsPage() {
  const { id } = useParams<{ id: string }>();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newApproval, setNewApproval] = useState({ itemName: "", type: "design" });

  function load() {
    fetch(`/api/projects/${id}/approvals`).then(r => r.json()).then(d => { setApprovals(d.approvals || []); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(approvalId: string, status: string) {
    await fetch(`/api/projects/${id}/approvals/${approvalId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function addApproval() {
    if (!newApproval.itemName.trim()) return;
    await fetch(`/api/projects/${id}/approvals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newApproval) });
    setNewApproval({ itemName: "", type: "design" }); setShowNew(false); load();
  }

  const counts = { pending: 0, in_review: 0, approved: 0, rejected: 0 };
  approvals.forEach(a => { if (a.status in counts) counts[a.status as keyof typeof counts]++; });

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 900 }}>
      <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, margin: "14px 0 20px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Approvals</h1>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>+ Submit for Approval</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 20 }}>
        {(["pending", "in_review", "approved", "rejected"] as const).map(k => (
          <div key={k} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: "0.7rem", color: colors.textLow, marginBottom: 6, textTransform: "capitalize" }}>{k.replace("_", " ")}</p>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, color: STATUS_COLOR[k] }}>{counts[k]}</p>
          </div>
        ))}
      </div>

      {showNew && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={newApproval.itemName} onChange={e => setNewApproval(a => ({ ...a, itemName: e.target.value }))} placeholder="Item name" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
          <select value={newApproval.type} onChange={e => setNewApproval(a => ({ ...a, type: e.target.value }))} style={inputStyle}>
            {["design", "content", "development"].map(t => <option key={t} value={t}>{label(t)}</option>)}
          </select>
          <button onClick={addApproval} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Submit</button>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
        {loading ? <p style={{ textAlign: "center", color: colors.textFaint, padding: 20 }}>Loading...</p> : approvals.length === 0 ? (
          <p style={{ textAlign: "center", color: colors.textFaint, padding: 20, fontSize: "0.82rem", fontStyle: "italic" }}>Nothing submitted for approval yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Item", "Type", "Submitted By", "Submitted On", "Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{approvals.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${colors.border}` }}>{a.item_name}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{label(a.type)}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{a.submitted_by_name || "\u2014"}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtDate(a.submitted_at)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}>
                    <select value={a.status} onChange={e => setStatus(a.id, e.target.value)} style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "4px 8px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[a.status] || colors.textFaint) + "20", color: STATUS_COLOR[a.status] || colors.textFaint, border: "none" }}>
                      {["pending", "in_review", "approved", "rejected"].map(s => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
