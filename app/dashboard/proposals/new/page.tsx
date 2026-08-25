"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Staff { id: string; name: string; active: boolean; }
interface Opportunity { id: string; name: string; customer_name: string; customer_id?: string; }
interface CustomerResult { id?: string; name: string; }

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

export default function NewProposalPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>}><NewProposalInner /></Suspense>;
}

function NewProposalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [form, setForm] = useState({ customerName: "", customerId: "", opportunityId: "", name: "", currency: "NGN", validUntil: "", preparedByStaffId: "", notesInternal: "" });
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/staff").then(r => r.json()).then(d => setStaff((d.staff || []).filter((s: Staff) => s.active))).catch(() => {});
    fetch("/api/opportunities?status=open&pageSize=50").then(r => r.json()).then(d => setOpportunities(d.opportunities || [])).catch(() => {});
    const customerId = searchParams.get("customerId");
    if (customerId) {
      fetch(`/api/customers/${customerId}`).then(r => r.json()).then(d => {
        if (d.customer) setForm(f => ({ ...f, customerId, customerName: d.customer.name }));
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function pickOpportunity(id: string) {
    const opp = opportunities.find(o => o.id === id);
    setForm(f => ({
      ...f, opportunityId: id,
      customerName: f.customerName || opp?.customer_name || f.customerName,
      customerId: opp?.customer_id || f.customerId,
      name: f.name || (opp ? `${opp.customer_name} \u2013 ${opp.name} Proposal` : f.name),
    }));
  }

  async function save() {
    if (!form.name.trim()) { setError("Proposal name is required"); return; }
    if (!form.customerName.trim()) { setError("Customer is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to create proposal"); setSaving(false); return; }
      router.push(`/dashboard/proposals/${d.id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 720 }}>
      <Link href="/dashboard/proposals/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Proposals</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 6px" }}>New Proposal</h1>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        {["Details", "Offerings", "Pricing", "Terms", "Review"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, background: i === 0 ? colors.primary : "rgba(255,255,255,0.08)", color: i === 0 ? colors.primaryText : colors.textFaint }}>{i + 1}</div>
            <span style={{ fontSize: "0.72rem", color: i === 0 ? colors.primary : colors.textFaint, fontWeight: i === 0 ? 700 : 400 }}>{s}</span>
            {i < 4 && <div style={{ width: 20, height: 1, background: colors.border }} />}
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Customer / Business *</label>
            <input value={form.customerName} onChange={e => onCustomerInput(e.target.value)} onFocus={() => setShowResults(true)} placeholder="Search customer..." style={inputStyle} />
            {showResults && customerResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, marginTop: 4, zIndex: 20 }}>
                {customerResults.map(c => (
                  <button key={c.name} onClick={() => { setForm(f => ({ ...f, customerName: c.name, customerId: c.id || "" })); setShowResults(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#fff" }}>{c.name}{c.id && <span style={{ color: colors.primary, fontSize: "0.65rem", marginLeft: 6 }}>&#9679; existing customer</span>}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Opportunity</label>
            <select value={form.opportunityId} onChange={e => pickOpportunity(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {opportunities.map(o => <option key={o.id} value={o.id}>{o.name} ({o.customer_name})</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Proposal Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. TechNova Ltd - Website Project Proposal" style={inputStyle} />
        </div>

        <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Currency</label>
            <select value={form.currency} onChange={e => set("currency", e.target.value)} style={inputStyle}>
              <option value="NGN">NGN - Nigerian Naira (&#8358;)</option>
              <option value="USD">USD - US Dollar ($)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Valid Until *</label>
            <input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Prepared By *</label>
          <select value={form.preparedByStaffId} onChange={e => set("preparedByStaffId", e.target.value)} style={inputStyle}>
            <option value="">Select staff</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Notes (Internal)</label>
          <textarea value={form.notesInternal} onChange={e => set("notesInternal", e.target.value)} placeholder="Internal notes not visible to client..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Creating..." : "Next: Add Offerings \u2192"}
          </button>
        </div>
      </div>
      <style>{`@media (max-width: 680px) { .prop-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
