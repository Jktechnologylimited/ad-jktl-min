"use client";
import { useState, useEffect, useCallback } from "react";
import { inputStyle, selectStyle, labelStyle, btnGold, btnGhost, sans, mono, MarkdownEditor } from "../Editor";

type Job = {
  id: string; title: string; department: string; location: string; type: string;
  description: string; status: string; created_at: string; applicant_count: number;
};
type Application = {
  id: string; name: string; email: string; phone: string; cv_url: string; cover_note: string; created_at: string;
};

const blank = { title: "", department: "", location: "", type: "Full-time", description: "", status: "open" };
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }); }
const badge = (open: boolean): React.CSSProperties => ({ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: open ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", color: open ? "#34D399" : "#F87171" });

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<typeof blank & { id?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [applicantsFor, setApplicantsFor] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/jobs").then((r) => r.json()).then((d) => { setJobs(d.jobs || []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  function set(k: string, v: string) { setEditing((e) => e ? { ...e, [k]: v } : e); }

  async function save() {
    if (!editing) return;
    setMsg("");
    if (!editing.title.trim()) { setMsg("Title is required."); return; }
    setSaving(true);
    const url = editing.id ? `/api/jobs/${editing.id}` : "/api/jobs";
    const method = editing.id ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Failed to save."); return; }
    setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this job and all its applications? This cannot be undone.")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    load();
  }

  async function viewApplicants(job: Job) {
    setApplicantsFor(job); setApplications([]);
    const d = await fetch(`/api/jobs/${job.id}/applications`).then((r) => r.json());
    setApplications(d.applications || []);
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Jobs</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>Manage open roles and review applicants</p>
        </div>
        <button style={btnGold} onClick={() => { setEditing({ ...blank }); setMsg(""); }}>+ New Job</button>
      </div>

      {editing && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 24, marginBottom: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{editing.id ? "Edit Job" : "New Job"}</h2>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={editing.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="grid-cols-1 md:grid-cols-3">
            <div><label style={labelStyle}>Department</label><input style={inputStyle} value={editing.department} onChange={(e) => set("department", e.target.value)} /></div>
            <div><label style={labelStyle}>Location</label><input style={inputStyle} value={editing.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={selectStyle} value={editing.type} onChange={(e) => set("type", e.target.value)}>
                {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description (markdown)</label>
            <MarkdownEditor value={editing.description} onChange={(v) => set("description", v)} />
          </div>
          <div style={{ maxWidth: 220 }}>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={editing.status} onChange={(e) => set("status", e.target.value)}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {msg && <p style={{ color: "#F87171", fontSize: "0.82rem" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Job"}</button>
            <button style={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}>Title</th><th style={th}>Dept</th><th style={th}>Location</th><th style={th}>Type</th><th style={th}>Status</th><th style={th}>Applicants</th><th style={th}>Posted</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading...</td></tr>
              : jobs.length === 0 ? <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No jobs yet</td></tr>
              : jobs.map((j) => (
                <tr key={j.id}>
                  <td style={{ ...td, fontWeight: 600, color: "#fff" }}>{j.title}</td>
                  <td style={td}>{j.department || "—"}</td>
                  <td style={td}>{j.location || "—"}</td>
                  <td style={td}>{j.type || "—"}</td>
                  <td style={td}><span style={badge(j.status === "open")}>{j.status}</span></td>
                  <td style={td}>
                    <button onClick={() => viewApplicants(j)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C9A84C", fontWeight: 700, fontFamily: mono, fontSize: "0.8rem" }}>
                      {Number(j.applicant_count)} ›
                    </button>
                  </td>
                  <td style={{ ...td, fontSize: "0.75rem" }}>{fmtDate(j.created_at)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditing({ id: j.id, title: j.title, department: j.department || "", location: j.location || "", type: j.type || "Full-time", description: j.description || "", status: j.status }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.6)", fontSize: "0.78rem", marginRight: 10 }}>Edit</button>
                    <button onClick={() => remove(j.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", fontSize: "0.78rem" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {applicantsFor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setApplicantsFor(null)} />
          <div style={{ position: "relative", width: "min(560px,100%)", background: "#060E2A", borderLeft: "1px solid rgba(255,255,255,0.1)", height: "100%", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Applicants</h2>
                <p style={{ fontSize: "0.78rem", color: "rgba(226,232,240,0.4)" }}>{applicantsFor.title}</p>
              </div>
              <button onClick={() => setApplicantsFor(null)} style={{ background: "none", border: "none", color: "rgba(226,232,240,0.5)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>
            {applications.length === 0 ? (
              <p style={{ color: "rgba(226,232,240,0.4)", fontStyle: "italic", fontSize: "0.85rem" }}>No applications yet.</p>
            ) : applications.map((a) => (
              <div key={a.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>{a.name}</p>
                <p style={{ fontSize: "0.8rem", color: "rgba(226,232,240,0.6)", marginTop: 2 }}>
                  <a href={`mailto:${a.email}`} style={{ color: "#C9A84C" }}>{a.email}</a>{a.phone ? ` · ${a.phone}` : ""}
                </p>
                {a.cv_url && <p style={{ marginTop: 6 }}><a href={a.cv_url} target="_blank" rel="noopener noreferrer" style={{ color: "#C9A84C", fontSize: "0.8rem", textDecoration: "underline" }}>View CV ↗</a></p>}
                {a.cover_note && <p style={{ marginTop: 8, fontSize: "0.83rem", color: "rgba(226,232,240,0.7)", whiteSpace: "pre-wrap" }}>{a.cover_note}</p>}
                <p style={{ marginTop: 8, fontSize: "0.68rem", color: "rgba(226,232,240,0.3)", fontFamily: mono }}>{fmtDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
