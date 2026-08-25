"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Project { id: string; name: string; customer_name?: string; type: string; status: string; start_date?: string; due_date?: string; manager_name?: string; task_count: string; completed_task_count: string; }
const STATUS_COLOR: Record<string, string> = { in_progress: "#60A5FA", completed: "#34D399", on_hold: "#F59E0B", not_started: "#94A3B8" };
const STATUSES = ["not_started", "in_progress", "on_hold", "completed"];
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("page", String(page)); p.set("pageSize", String(pageSize));
    if (status) p.set("status", status);
    if (q) p.set("name", q);
    fetch(`/api/projects?${p.toString()}`).then(r => r.json()).then(d => { setProjects(d.projects || []); setTotal(d.total || 0); setLoading(false); }).catch(() => setLoading(false));
  }, [page, pageSize, status, q]);

  useEffect(() => { load(); }, [load]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Projects</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>{total} project{total === 1 ? "" : "s"} total</p>
        </div>
        <Link href="/dashboard/projects/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Project</Link>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search projects..." style={{ ...inputStyle, maxWidth: 280 }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ ...inputStyle, maxWidth: 180 }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Project Name", "Customer", "Type", "Status", "Progress", "Due Date", "Manager"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem" }}>Loading...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem", fontStyle: "italic" }}>No projects match these filters</td></tr>
              ) : projects.map(p => {
                const total = Number(p.task_count), completed = Number(p.completed_task_count);
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}><Link href={`/dashboard/projects/${p.id}`} style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{p.name}</Link></td>
                    <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{p.customer_name || "\u2014"}</td>
                    <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{label(p.type)}</td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}><span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[p.status] || colors.textFaint) + "20", color: STATUS_COLOR[p.status] || colors.textFaint }}>{label(p.status)}</span></td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: colors.primary }} /></div>
                        <span style={{ fontSize: "0.72rem", color: colors.textFaint, fontFamily: font.mono }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{p.due_date ? new Date(p.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"}</td>
                    <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{p.manager_name || "Unassigned"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Showing {projects.length === 0 ? 0 : (page - 1) * pageSize + 1} to {(page - 1) * pageSize + projects.length} of {total} projects</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 10px", borderRadius: 6, background: "none", border: `1px solid ${colors.border}`, color: page <= 1 ? colors.textFaint : colors.textMed, cursor: page <= 1 ? "default" : "pointer", fontSize: "0.76rem" }}>&lsaquo;</button>
            <span style={{ fontSize: "0.76rem", color: colors.textMed, fontFamily: font.mono }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 10px", borderRadius: 6, background: "none", border: `1px solid ${colors.border}`, color: page >= totalPages ? colors.textFaint : colors.textMed, cursor: page >= totalPages ? "default" : "pointer", fontSize: "0.76rem" }}>&rsaquo;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
