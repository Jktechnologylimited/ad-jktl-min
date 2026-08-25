"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Delivery { id: string; name: string; customer_name?: string; due_date: string; health: string; }
interface Data { dueThisWeek: number; dueThisMonth: number; overdue: number; completionRate: number; deliveries: Delivery[]; }
const HEALTH_COLOR: Record<string, string> = { on_track: "#34D399", at_risk: "#F59E0B", delayed: "#F87171", completed: "#94A3B8" };
function healthLabel(h: string) { return h.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default function DeliveryProgressPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/projects/delivery").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1000 }}>
      <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 20 }}>Delivery Progress</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}><p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Projects Due This Week</p><p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>{data.dueThisWeek}</p></div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}><p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Projects Due This Month</p><p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#60A5FA" }}>{data.dueThisMonth}</p></div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}><p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Projects Overdue</p><p style={{ fontSize: "1.4rem", fontWeight: 700, color: colors.danger }}>{data.overdue}</p></div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}><p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Completion Rate (YTD)</p><p style={{ fontSize: "1.4rem", fontWeight: 700, color: colors.success }}>{data.completionRate}%</p></div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Upcoming Deliveries</p>
        {data.deliveries.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>Nothing due yet</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Project", "Customer", "Due Date", "Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{data.deliveries.map(d => (
                <tr key={d.id}>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><Link href={`/dashboard/projects/${d.id}`} style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{d.name}</Link></td>
                  <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{d.customer_name || "\u2014"}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{new Date(d.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: (HEALTH_COLOR[d.health] || colors.textFaint) + "20", color: HEALTH_COLOR[d.health] || colors.textFaint }}>{healthLabel(d.health)}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Link href="/dashboard/projects/all" style={{ display: "inline-block", marginTop: 14, fontSize: "0.76rem", color: colors.primary, textDecoration: "none" }}>View all deliveries &rarr;</Link>
      </div>
    </div>
  );
}
