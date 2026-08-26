"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Activity { id: string; type: string; title: string; body?: string; actor_name?: string; created_at: string; }
const TYPE_ICON: Record<string, string> = { created: "\u2795", status_change: "\u2699\ufe0f", note: "\ud83d\udcdd", upload: "\ud83d\udcce", approval: "\u2713", feedback: "\ud83d\udcac", message: "\ud83d\udcac" };
const TYPES = ["", "created", "status_change", "note", "upload", "approval", "feedback", "message"];
function typeLabel(t: string) { return t === "" ? "All Activities" : t.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function fmtTime(d: string) { return new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }); }
function dateGroup(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }); }
const inputStyle: React.CSSProperties = { padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };

export default function ProjectActivityPage() {
  const { id } = useParams<{ id: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?type=${filter}` : "";
    fetch(`/api/projects/${id}/activity${qs}`).then(r => r.json()).then(d => { setActivities(d.activities || []); setLoading(false); }).catch(() => setLoading(false));
  }, [id, filter]);

  const groups: Record<string, Activity[]> = {};
  for (const a of activities) {
    const g = dateGroup(a.created_at);
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 800 }}>
      <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, margin: "14px 0 20px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Activity Timeline</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={inputStyle}>
          {TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
      </div>

      {loading ? <p style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading...</p> : Object.keys(groups).length === 0 ? (
        <p style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: "0.82rem", fontStyle: "italic" }}>No activity yet</p>
      ) : (
        Object.entries(groups).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.textFaint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{date}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map(a => (
                <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 4px", borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: "0.9rem", flexShrink: 0, width: 24, textAlign: "center" }}>{TYPE_ICON[a.type] || "\u2022"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.83rem", color: "#fff", fontWeight: 600 }}>{a.title}</p>
                    {a.body && a.type !== "message" && <p style={{ fontSize: "0.76rem", color: colors.textMed, marginTop: 2 }}>{a.body}</p>}
                    <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 3 }}>by {a.actor_name || "System"}</p>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: colors.textFaint, fontFamily: font.mono, flexShrink: 0 }}>{fmtTime(a.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
