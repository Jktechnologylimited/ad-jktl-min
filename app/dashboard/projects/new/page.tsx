"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Staff { id: string; name: string; active: boolean; }
const TYPES = ["website", "platform", "mobile_app", "software", "other"];
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

export default function NewProjectPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>}><NewProjectInner /></Suspense>;
}

function NewProjectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    name: "", customerId: "", opportunityId: "", proposalId: "", type: "website",
    startDate: "", dueDate: "", projectManagerStaffId: "", description: "", projectValue: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [prefillNote, setPrefillNote] = useState("");

  useEffect(() => {
    fetch("/api/staff").then(r => r.json()).then(d => setStaff((d.staff || []).filter((s: Staff) => s.active))).catch(() => {});

    const customerId = searchParams.get("customerId") || "";
    const opportunityId = searchParams.get("opportunityId") || "";
    const proposalId = searchParams.get("proposalId") || "";
    setForm(f => ({ ...f, customerId, opportunityId, proposalId }));

    if (proposalId) {
      fetch(`/api/proposals/${proposalId}`).then(r => r.json()).then(d => {
        if (d.proposal) {
          setForm(f => ({ ...f, name: `${d.proposal.customer_name} \u2013 ${d.proposal.name}`, projectValue: String(d.proposal.total || "") }));
          setPrefillNote(`Pre-filled from proposal ${d.proposal.proposal_number}`);
        }
      }).catch(() => {});
    } else if (opportunityId) {
      fetch(`/api/opportunities/${opportunityId}`).then(r => r.json()).then(d => {
        if (d.opportunity) {
          setForm(f => ({ ...f, name: `${d.opportunity.customer_name} \u2013 ${d.opportunity.name}`, projectValue: String(d.opportunity.estimated_value || "") }));
          setPrefillNote("Pre-filled from opportunity");
        }
      }).catch(() => {});
    } else if (customerId) {
      fetch(`/api/customers/${customerId}`).then(r => r.json()).then(d => {
        if (d.customer) setPrefillNote(`Linked to ${d.customer.name}`);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof typeof form>(key: K, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function save() {
    if (!form.name.trim()) { setError("Project name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to create project"); setSaving(false); return; }
      router.push(`/dashboard/projects/${d.id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 720 }}>
      <Link href="/dashboard/projects/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Projects</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 6px" }}>New Project</h1>
      {prefillNote && <p style={{ fontSize: "0.76rem", color: colors.primary, marginBottom: 14 }}>{prefillNote}</p>}

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginTop: prefillNote ? 0 : 20 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Project Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. TechNova Ltd - Website Redesign" style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle}>
              {TYPES.map(t => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Project Manager</label>
            <select value={form.projectManagerStaffId} onChange={e => set("projectManagerStaffId", e.target.value)} style={inputStyle}>
              <option value="">Select manager</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Start Date</label><input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Due Date</label><input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Project Value (&#8358;)</label>
          <input type="number" min="0" value={form.projectValue} onChange={e => set("projectValue", e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/dashboard/projects/all" style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
          <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save Project"}</button>
        </div>
      </div>
    </div>
  );
}
