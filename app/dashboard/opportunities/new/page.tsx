"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

const PIPELINES = ["New Business Pipeline", "Renewal Pipeline", "Partnership Pipeline"];
const STAGES = ["Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const SOURCES = ["website", "referral", "affiliate", "bdr", "other"];

interface Staff { id: string; name: string; active: boolean; }
interface CustomerResult { id?: string; name: string; email?: string; phone?: string; }

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

export default function NewOpportunityPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    name: "", customerName: "", customerId: "", pipeline: PIPELINES[0], stage: STAGES[0], estimatedValue: "",
    expectedCloseDate: "", probability: "50", ownerStaffId: "", source: "website", description: "",
  });
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetch("/api/staff").then(r => r.json()).then(d => setStaff((d.staff || []).filter((s: Staff) => s.active))).catch(() => {}); }, []);

  function set<K extends keyof typeof form>(key: K, val: string) { setForm(f => ({ ...f, [key]: val })); }

  function onCustomerInput(val: string) {
    setForm(f => ({ ...f, customerName: val, customerId: "" }));
    setShowResults(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (val.trim().length < 2) { setCustomerResults([]); return; }
      fetch(`/api/customers/search?q=${encodeURIComponent(val)}`).then(r => r.json()).then(d => setCustomerResults(d.results || [])).catch(() => {});
    }, 300);
  }

  async function save() {
    if (!form.name.trim()) { setError("Opportunity name is required"); return; }
    if (!form.customerName.trim()) { setError("Customer is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to save opportunity"); setSaving(false); return; }
      router.push(`/dashboard/opportunities/${d.id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 720 }}>
      <Link href="/dashboard/opportunities/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Opportunities</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 20px" }}>New Opportunity</h1>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Opportunity Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Enter opportunity name" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={labelStyle}>Customer *</label>
          <input value={form.customerName} onChange={e => onCustomerInput(e.target.value)} onFocus={() => setShowResults(true)} placeholder="Search customer..." style={inputStyle} />
          {showResults && customerResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, marginTop: 4, zIndex: 20, maxHeight: 200, overflowY: "auto" }}>
              {customerResults.map(c => (
                <button key={c.name} onClick={() => { setForm(f => ({ ...f, customerName: c.name, customerId: c.id || "" })); setShowResults(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#fff" }}>
                  {c.name}{c.id && <span style={{ color: colors.primary, fontSize: "0.65rem", marginLeft: 6 }}>&#9679; existing customer</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Pipeline *</label>
            <select value={form.pipeline} onChange={e => set("pipeline", e.target.value)} style={inputStyle}>
              {PIPELINES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Stage *</label>
            <select value={form.stage} onChange={e => set("stage", e.target.value)} style={inputStyle}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Estimated Value (&#8358;)</label>
            <input type="number" min="0" value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)} placeholder="0.00" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expected Close Date</label>
            <input type="date" value={form.expectedCloseDate} onChange={e => set("expectedCloseDate", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Probability (%)</label>
            <input type="number" min="0" max="100" value={form.probability} onChange={e => set("probability", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Owner *</label>
            <select value={form.ownerStaffId} onChange={e => set("ownerStaffId", e.target.value)} style={inputStyle}>
              <option value="">Select owner</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Source</label>
          <select value={form.source} onChange={e => set("source", e.target.value)} style={inputStyle}>
            {SOURCES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Enter description..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/dashboard/opportunities/all" style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
          <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Opportunity"}
          </button>
        </div>
      </div>
    </div>
  );
}
