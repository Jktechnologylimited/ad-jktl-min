"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Project {
  id: string; name: string; customer_id?: string; status: string; created_at: string; completed_at?: string;
  manager_name?: string; client_rating?: number; client_feedback?: string;
}
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"; }

export default function ProjectCompletePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState({ total: 0, completed: 0, pct: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}/complete`).then(r => r.json()).then(d => {
      setProject(d.project || null);
      setProgress(d.progress || { total: 0, completed: 0, pct: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function complete() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/projects/${id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientRating: rating || null, clientFeedback: feedback || null }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to mark as completed"); setSaving(false); return; }
      router.refresh();
      const res2 = await fetch(`/api/projects/${id}/complete`);
      const d2 = await res2.json();
      setProject(d2.project); setProgress(d2.progress); setSaving(false);
    } catch { setError("Something went wrong."); setSaving(false); }
  }

  if (loading || !project) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;

  if (project.status !== "completed") {
    return (
      <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 600 }}>
        <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: "14px 0 20px" }}>Mark Project Completed</h1>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: "0.85rem", color: colors.textMed, marginBottom: 16 }}>{progress.completed}/{progress.total} tasks completed ({progress.pct}%)</p>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: colors.textLow, marginBottom: 8 }}>Client Rating (optional)</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.6rem", color: n <= rating ? colors.primary : "rgba(255,255,255,0.15)", padding: 0, lineHeight: 1 }}>&#9733;</button>
            ))}
          </div>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: colors.textLow, marginBottom: 8 }}>Client Feedback (optional)</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="What did the client say?" rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }} />
          {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Link href={`/dashboard/projects/${id}`} style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
            <button onClick={complete} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Mark as Completed"}</button>
          </div>
        </div>
      </div>
    );
  }

  const days = Math.round((new Date(project.completed_at!).getTime() - new Date(project.created_at).getTime()) / 86400000);

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 560 }}>
      <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32, marginTop: 14, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(52,211,153,0.15)", border: `2px solid ${colors.success}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Project Completed!</h1>
        <p style={{ fontSize: "0.82rem", color: colors.textFaint, marginBottom: 24 }}>This project has been successfully delivered.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20, textAlign: "left" }}>
          <div><p style={{ fontSize: "0.65rem", color: colors.textFaint }}>Completed On</p><p style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{fmtDate(project.completed_at)}</p></div>
          <div><p style={{ fontSize: "0.65rem", color: colors.textFaint }}>Completed By</p><p style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{project.manager_name || "\u2014"}</p></div>
          <div><p style={{ fontSize: "0.65rem", color: colors.textFaint }}>Duration</p><p style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{days} Days</p></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ textAlign: "left" }}><p style={{ fontSize: "0.65rem", color: colors.textFaint }}>Total Tasks</p><p style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 700 }}>{progress.completed} / {progress.total}</p></div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.65rem", color: colors.textFaint, marginBottom: 2 }}>Client Rating</p>
            <div>{[1, 2, 3, 4, 5].map(n => <span key={n} style={{ color: n <= (project.client_rating || 0) ? colors.primary : "rgba(255,255,255,0.15)", fontSize: "1rem" }}>&#9733;</span>)}</div>
          </div>
        </div>
        {project.client_feedback && (
          <div style={{ textAlign: "left", marginBottom: 24 }}>
            <p style={{ fontSize: "0.65rem", color: colors.textFaint, marginBottom: 4 }}>Feedback</p>
            <p style={{ fontSize: "0.82rem", color: colors.textMed, fontStyle: "italic" }}>&ldquo;{project.client_feedback}&rdquo;</p>
          </div>
        )}

        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>What&apos;s Next?</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={project.customer_id ? `/dashboard/customers/${project.customer_id}` : "/dashboard/customers/all"} style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.8rem", fontWeight: 700 }}>Create Maintenance Plan</Link>
          <Link href={project.customer_id ? `/dashboard/projects/new?customerId=${project.customer_id}` : "/dashboard/projects/new"} style={{ padding: "10px 18px", borderRadius: 8, background: colors.primary, color: colors.primaryText, textDecoration: "none", fontSize: "0.8rem", fontWeight: 700 }}>Create New Project</Link>
        </div>
      </div>
    </div>
  );
}
