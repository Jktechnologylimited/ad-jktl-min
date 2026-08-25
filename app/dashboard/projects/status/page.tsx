"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Data { counts: { on_track: number; at_risk: number; delayed: number; completed: number }; atRiskDelayed: { id: string; name: string; customer_name?: string; issue: string; updated_at: string }[]; }
const COLOR: Record<string, string> = { on_track: "#34D399", at_risk: "#F59E0B", delayed: "#F87171", completed: "#94A3B8" };

export default function ProjectStatusPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/projects/status").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1000 }}>
      <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 20 }}>Project Status</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {(["on_track", "at_risk", "delayed", "completed"] as const).map(k => (
          <div key={k} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8, textTransform: "capitalize" }}>{k.replace("_", " ")}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: COLOR[k] }}>{data.counts[k]}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>At Risk / Delayed Projects</p>
        {data.atRiskDelayed.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>Nothing at risk right now</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Project", "Issue", "Last Update"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{data.atRiskDelayed.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><Link href={`/dashboard/projects/${p.id}`} style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{p.name}</Link> {p.customer_name && <span style={{ color: colors.textFaint, fontSize: "0.72rem" }}>({p.customer_name})</span>}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{p.issue}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{new Date(p.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Link href="/dashboard/projects/all" style={{ display: "inline-block", marginTop: 14, fontSize: "0.76rem", color: colors.primary, textDecoration: "none" }}>View all projects &rarr;</Link>
      </div>
    </div>
  );
}
