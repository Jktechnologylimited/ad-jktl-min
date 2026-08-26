"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Feedback { id: string; title: string; body: string; author_name: string; author_type: string; status: string; file_name?: string; reply_count: string; created_at: string; }
interface Reply { id: string; body: string; author_name: string; author_type: string; created_at: string; }
const STATUS_COLOR: Record<string, string> = { open: "#F59E0B", in_progress: "#60A5FA", resolved: "#34D399" };
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 18 };

export default function ProjectFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newFb, setNewFb] = useState({ title: "", body: "", authorName: "", authorType: "client" });

  function load() {
    fetch(`/api/projects/${id}/feedback`).then(r => r.json()).then(d => { setFeedback(d.feedback || []); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleExpand(fbId: string) {
    if (expanded === fbId) { setExpanded(null); return; }
    setExpanded(fbId);
    const res = await fetch(`/api/projects/${id}/feedback/${fbId}/replies`);
    const d = await res.json();
    setReplies(d.replies || []);
  }

  async function addReply(fbId: string) {
    if (!replyText.trim()) return;
    await fetch(`/api/projects/${id}/feedback/${fbId}/replies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: replyText, authorType: "staff" }) });
    setReplyText("");
    const res = await fetch(`/api/projects/${id}/feedback/${fbId}/replies`);
    setReplies((await res.json()).replies || []);
    load();
  }

  async function setStatus(fbId: string, status: string) {
    await fetch(`/api/projects/${id}/feedback/${fbId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function addFeedback() {
    if (!newFb.title.trim() || !newFb.body.trim() || !newFb.authorName.trim()) return;
    await fetch(`/api/projects/${id}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newFb) });
    setNewFb({ title: "", body: "", authorName: "", authorType: "client" }); setShowNew(false); load();
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 900 }}>
      <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, margin: "14px 0 6px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Client Feedback</h1>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>+ Log Feedback</button>
      </div>
      <p style={{ fontSize: "0.72rem", color: colors.textFaint, marginBottom: 16, lineHeight: 1.5 }}>No client portal exists yet, so feedback here is logged by staff on the client&apos;s behalf (call, email, meeting) &mdash; real records, not a public submission form.</p>

      {showNew && (
        <div style={{ ...cardStyle, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={newFb.title} onChange={e => setNewFb(f => ({ ...f, title: e.target.value }))} placeholder="Feedback title (e.g. Homepage - Feedback)" style={inputStyle} />
          <textarea value={newFb.body} onChange={e => setNewFb(f => ({ ...f, body: e.target.value }))} placeholder="What did they say?" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <input value={newFb.authorName} onChange={e => setNewFb(f => ({ ...f, authorName: e.target.value }))} placeholder="Client name" style={inputStyle} />
          <button onClick={addFeedback} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Save</button>
        </div>
      )}

      {loading ? <p style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading...</p> : feedback.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: "0.82rem", fontStyle: "italic" }}>No feedback logged yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {feedback.map(fb => (
            <div key={fb.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{fb.title}</p>
                  {fb.file_name && <p style={{ fontSize: "0.72rem", color: colors.textFaint }}>Design: {fb.file_name}</p>}
                </div>
                <select value={fb.status} onChange={e => setStatus(fb.id, e.target.value)} style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "4px 8px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[fb.status] || colors.textFaint) + "20", color: STATUS_COLOR[fb.status] || colors.textFaint, border: "none" }}>
                  {["open", "in_progress", "resolved"].map(s => <option key={s} value={s}>{label(s)}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontFamily: font.mono, fontSize: "0.58rem", fontWeight: 700, color: colors.primary }}>{fb.author_name.slice(0, 2).toUpperCase()}</span></div>
                <p style={{ fontSize: "0.76rem", color: colors.textMed }}>{fb.author_name} <span style={{ color: colors.textFaint }}>({fb.author_type})</span> &middot; {fmtDate(fb.created_at)}</p>
              </div>
              <p style={{ fontSize: "0.82rem", color: colors.textMed, marginBottom: 10, lineHeight: 1.5 }}>{fb.body}</p>
              <button onClick={() => toggleExpand(fb.id)} style={{ background: "none", border: "none", color: colors.primary, fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>&#128172; {fb.reply_count} {Number(fb.reply_count) === 1 ? "Reply" : "Replies"}</button>

              {expanded === fb.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
                  {replies.map(r => (
                    <div key={r.id} style={{ marginBottom: 8, fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 700, color: "#fff" }}>{r.author_name}</span> <span style={{ color: colors.textFaint, fontSize: "0.7rem" }}>{fmtDate(r.created_at)}</span>
                      <p style={{ color: colors.textMed, marginTop: 2 }}>{r.body}</p>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply..." style={inputStyle} />
                    <button onClick={() => addReply(fb.id)} style={{ padding: "8px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer", flexShrink: 0 }}>Send</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
