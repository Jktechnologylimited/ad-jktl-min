"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Lead { id: string; first_name?: string; last_name?: string; name?: string; business_name?: string; owner_staff_id?: string; }
interface Staff { id: string; name: string; active: boolean; }

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

function leadName(l: Lead) { return (l.first_name || l.last_name) ? `${l.first_name || ""} ${l.last_name || ""}`.trim() : (l.name || "Unnamed lead"); }

export default function ConvertLeadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [options, setOptions] = useState<{ pipelines: string[]; stages: string[] }>({ pipelines: [], stages: [] });
  const [form, setForm] = useState({ opportunityName: "", pipeline: "", stage: "", estimatedValue: "", expectedCloseDate: "", ownerStaffId: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/leads/${id}`).then(r => r.json()),
      fetch("/api/staff").then(r => r.json()).catch(() => ({ staff: [] })),
      fetch(`/api/leads/${id}/convert`).then(r => r.json()),
    ]).then(([l, s, o]) => {
      setLead(l.lead || null);
      setStaff((s.staff || []).filter((x: Staff) => x.active));
      setOptions(o);
      if (l.lead) {
        setForm(f => ({
          ...f,
          opportunityName: `${l.lead.business_name || leadName(l.lead)} \u2013 Project`,
          pipeline: o.pipelines[0] || "",
          stage: o.stages[0] || "",
          ownerStaffId: l.lead.owner_staff_id || "",
        }));
      }
    });
  }, [id]);

  function set<K extends keyof typeof form>(key: K, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function convert() {
    if (!form.opportunityName.trim()) { setError("Opportunity name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/leads/${id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Conversion failed"); setSaving(false); return; }
      router.push(`/dashboard/opportunities/${d.opportunityId}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  if (!lead) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 640 }}>
      <Link href={`/dashboard/leads/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to {lead.business_name || leadName(lead)}</Link>

      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 4px" }}>Convert Lead</h1>
      <p style={{ fontSize: "0.82rem", color: colors.textFaint, marginBottom: 20 }}>Convert this lead into an opportunity.</p>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Opportunity Name *</label>
          <input value={form.opportunityName} onChange={e => set("opportunityName", e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Pipeline *</label>
          <select value={form.pipeline} onChange={e => set("pipeline", e.target.value)} style={inputStyle}>
            {options.pipelines.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Stage *</label>
          <select value={form.stage} onChange={e => set("stage", e.target.value)} style={inputStyle}>
            {options.stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Estimated Value (&#8358;)</label>
          <input type="number" min="0" value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Expected Close Date</label>
          <input type="date" value={form.expectedCloseDate} onChange={e => set("expectedCloseDate", e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Owner *</label>
          <select value={form.ownerStaffId} onChange={e => set("ownerStaffId", e.target.value)} style={inputStyle}>
            <option value="">Select owner</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <p style={{ fontSize: "0.72rem", color: colors.textFaint, marginBottom: 16, lineHeight: 1.5 }}>
          This captures the opportunity details on the lead record. Full pipeline/stage management with a dedicated Opportunities board lands in a later batch.
        </p>

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href={`/dashboard/leads/${id}`} style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
          <button onClick={convert} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Converting..." : "Convert"}
          </button>
        </div>
      </div>
    </div>
  );
}
