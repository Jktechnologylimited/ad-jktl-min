"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import KpiCard from "@/components/widgets/KpiCard";
import DonutChart, { DonutSlice } from "@/components/widgets/DonutChart";
import BarChart from "@/components/widgets/BarChart";

const STATUS_COLOR: Record<string, string> = { in_progress: "#60A5FA", completed: "#34D399", on_hold: "#F59E0B", not_started: "#94A3B8" };
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }

interface Stats {
  totals: { total: number; in_progress: number; completed: number; on_hold: number; not_started: number };
  byType: { type: string; count: string }[];
  recent: { id: string; name: string; status: string; updated_at: string }[];
  tasks: { total: number; completed: number; in_progress: number; overdue: number };
  overdueTasks: number;
}

export default function ProjectsOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/projects/stats").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Projects Overview</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>Projects &rarr; Overview</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/projects/all" style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>View All</Link>
          <Link href="/dashboard/projects/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Project</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total Projects" value={data.totals.total} />
        <KpiCard label="In Progress" value={data.totals.in_progress} accent="#60A5FA" />
        <KpiCard label="Completed" value={data.totals.completed} accent="#34D399" />
        <KpiCard label="On Hold" value={data.totals.on_hold} accent="#F59E0B" />
        <KpiCard label="Overdue Tasks" value={data.overdueTasks} accent="#F87171" />
      </div>

      <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Projects by Status</p>
          <DonutChart slices={[
            { label: "In Progress", value: data.totals.in_progress, color: STATUS_COLOR.in_progress },
            { label: "Completed", value: data.totals.completed, color: STATUS_COLOR.completed },
            { label: "On Hold", value: data.totals.on_hold, color: STATUS_COLOR.on_hold },
            { label: "Not Started", value: data.totals.not_started, color: STATUS_COLOR.not_started },
          ]} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Projects by Type</p>
          <BarChart data={(data.byType || []).map(t => ({ label: label(t.type), value: Number(t.count) }))} />
        </div>
      </div>

      <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Recent Projects</p>
            <Link href="/dashboard/projects/all" style={{ fontSize: "0.72rem", color: colors.primary, textDecoration: "none" }}>View all projects &rarr;</Link>
          </div>
          {(data.recent || []).length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No projects yet</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.recent.map(p => (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, textDecoration: "none" }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[p.status] || colors.textFaint) + "20", color: STATUS_COLOR[p.status] || colors.textFaint }}>{label(p.status)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 14 }}>Tasks Overview</p>
          {[["Total Tasks", data.tasks.total, "#fff"], ["Completed", data.tasks.completed, colors.success], ["In Progress", data.tasks.in_progress, "#60A5FA"], ["Overdue", data.tasks.overdue, colors.danger]].map(([k, v, c]) => (
            <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: "0.8rem", color: colors.textFaint }}>{k}</span>
              <span style={{ fontSize: "0.82rem", color: c as string, fontWeight: 700, fontFamily: font.mono }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 680px) { .proj-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
