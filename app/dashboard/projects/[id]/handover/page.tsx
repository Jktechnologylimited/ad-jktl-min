"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Item { id: string; task: string; status: string; }
interface Project { id: string; name: string; customer_name?: string; project_number: string; target_handover_date?: string; handover_to?: string; client_contact?: string; handover_notes?: string; handover_status: string; manager_name?: string; }
const STATUS_COLOR: Record<string, string> = { pending: "#94A3B8", in_progress: "#60A5FA", completed: "#34D399" };
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 };

const DEFAULT_CHECKLIST = ["All development completed", "All bugs fixed", "Content migrated", "Forms & integrations tested", "Cross-browser testing", "Mobile responsiveness verified", "Training / Documentation", "Client training session", "Final sign-off"];

export default function HandoverPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ target_handover_date: "", handover_to: "", client_contact: "", handover_notes: "" });
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/projects/${id}/handover`).then(r => r.json()).then(d => {
      setProject(d.project || null);
      setItems(d.items || []);
      if (d.project) setForm({
        target_handover_date: d.project.target_handover_date ? d.project.target_handover_date.slice(0, 10) : "",
        handover_to: d.project.handover_to || d.project.customer_name || "",
        client_contact: d.project.client_contact || "",
        handover_notes: d.project.handover_notes || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function seedDefaults() {
    for (const task of DEFAULT_CHECKLIST) {
      await fetch(`/api/projects/${id}/handover`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task }) });
    }
    load();
  }
  async function toggleItem(itemId: string, status: string) {
    await fetch(`/api/projects/${id}/handover/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function addTask() {
    if (!newTask.trim()) return;
    await fetch(`/api/projects/${id}/handover`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: newTask.trim() }) });
    setNewTask(""); load();
  }
  async function saveDetails() {
    setSaving(true);
    await fetch(`/api/projects/${id}/handover`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); load();
  }
  async function markReady() {
    setSaving(true);
    await fetch(`/api/projects/${id}/handover`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, handover_status: "ready" }) });
    setSaving(false); load();
  }

  if (loading || !project) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  const allDone = items.length > 0 && items.every(i => i.status === "completed");

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 900 }}>
      <div className="print-hide">
        <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, margin: "14px 0 20px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Handover</h1>
        {project.handover_status === "ready" && <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px", borderRadius: 4, background: "rgba(52,211,153,0.2)", color: colors.success }}>READY FOR HANDOVER</span>}
      </div>

      <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Handover Checklist</p>
            {items.length === 0 && <button onClick={seedDefaults} className="print-hide" style={{ background: "none", border: "none", color: colors.primary, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>Add standard checklist</button>}
          </div>
          {items.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No checklist items yet</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                  <span style={{ fontSize: "0.8rem", color: colors.textMed }}>{item.task}</span>
                  <select value={item.status} onChange={e => toggleItem(item.id, e.target.value)} className="print-hide" style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "3px 7px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[item.status] || colors.textFaint) + "20", color: STATUS_COLOR[item.status] || colors.textFaint, border: "none" }}>
                    {["pending", "in_progress", "completed"].map(s => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="print-hide" style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task" style={{ ...inputStyle, padding: "6px 10px" }} />
            <button onClick={addTask} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.border}`, color: colors.textMed, fontSize: "0.74rem", cursor: "pointer" }}>+ Add</button>
          </div>
        </div>

        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Handover Details</p>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: "0.68rem", color: colors.textFaint, display: "block", marginBottom: 4 }}>Target Handover Date</label><input type="date" value={form.target_handover_date} onChange={e => setForm(f => ({ ...f, target_handover_date: e.target.value }))} style={inputStyle} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: "0.68rem", color: colors.textFaint, display: "block", marginBottom: 4 }}>Handover To</label><input value={form.handover_to} onChange={e => setForm(f => ({ ...f, handover_to: e.target.value }))} style={inputStyle} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: "0.68rem", color: colors.textFaint, display: "block", marginBottom: 4 }}>Project Manager</label><input value={project.manager_name || ""} disabled style={{ ...inputStyle, opacity: 0.6 }} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: "0.68rem", color: colors.textFaint, display: "block", marginBottom: 4 }}>Client Contact</label><input value={form.client_contact} onChange={e => setForm(f => ({ ...f, client_contact: e.target.value }))} style={inputStyle} /></div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "0.68rem", color: colors.textFaint, display: "block", marginBottom: 4 }}>Handover Notes</label>
            <textarea value={form.handover_notes} onChange={e => setForm(f => ({ ...f, handover_notes: e.target.value }))} placeholder="Add notes about the handover process..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <button onClick={saveDetails} disabled={saving} className="print-hide" style={{ padding: "8px 16px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>Save Details</button>
        </div>
      </div>

      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 10 }}>
        <button onClick={() => window.print()} style={{ padding: "10px 18px", borderRadius: 8, background: "none", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>&#8595; Download Handover Report</button>
        <button onClick={markReady} disabled={saving || !allDone} title={!allDone ? "Complete all checklist items first" : ""} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: allDone ? "pointer" : "default", opacity: allDone ? 1 : 0.5 }}>Mark as Ready for Handover</button>
      </div>
      <style>{`@media (max-width: 680px) { .proj-2col { grid-template-columns: 1fr !important; } } @media print { .print-hide { display: none !important; } }`}</style>
    </div>
  );
}
