"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Staff { id: string; name: string; active: boolean; }
interface Opportunity { id: string; name: string; customer_name: string; }
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

export default function NewCustomerPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [form, setForm] = useState({
    name: "", status: "active", contactName: "", contactRole: "", contactEmail: "", contactPhone: "",
    location: "", industry: "", employees: "", website: "", ownerStaffId: "", opportunityId: "", notesInternal: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/staff").then(r => r.json()).then(d => setStaff((d.staff || []).filter((s: Staff) => s.active))).catch(() => {});
    fetch("/api/opportunities?status=closed_won&pageSize=50").then(r => r.json()).then(d => setOpportunities(d.opportunities || [])).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, val: string) { setForm(f => ({ ...f, [key]: val })); }
  function pickOpportunity(id: string) {
    set("opportunityId", id);
    const opp = opportunities.find(o => o.id === id);
    if (opp && !form.name) set("name", opp.customer_name);
  }

  async function save() {
    if (!form.name.trim()) { setError("Customer name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to create customer"); setSaving(false); return; }
      router.push(`/dashboard/customers/${d.id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 720 }}>
      <Link href="/dashboard/customers/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Customers</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 20px" }}>Add Customer</h1>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. TechNova Ltd" style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Won Opportunity (optional)</label>
            <select value={form.opportunityId} onChange={e => pickOpportunity(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {opportunities.map(o => <option key={o.id} value={o.id}>{o.name} ({o.customer_name})</option>)}
            </select>
          </div>
        </div>

        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.primary, margin: "18px 0 12px" }}>Primary Business</p>
        <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Industry</label><input value={form.industry} onChange={e => set("industry", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Employees</label><input value={form.employees} onChange={e => set("employees", e.target.value)} placeholder="e.g. 51 - 200" style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Website</label><input value={form.website} onChange={e => set("website", e.target.value)} style={inputStyle} /></div>

        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.primary, margin: "18px 0 12px" }}>Primary Contact</p>
        <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Contact Name</label><input value={form.contactName} onChange={e => set("contactName", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Role</label><input value={form.contactRole} onChange={e => set("contactRole", e.target.value)} placeholder="e.g. CEO" style={inputStyle} /></div>
        </div>
        <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Email</label><input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Phone</label><input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Location</label><input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Lagos, Nigeria" style={inputStyle} /></div>

        <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
              {["active", "onboarding", "inactive", "prospect"].map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Owner</label>
            <select value={form.ownerStaffId} onChange={e => set("ownerStaffId", e.target.value)} style={inputStyle}>
              <option value="">Select staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Notes (Internal)</label><textarea value={form.notesInternal} onChange={e => set("notesInternal", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/dashboard/customers/all" style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
          <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save Customer"}</button>
        </div>
      </div>
      <style>{`@media (max-width: 680px) { .cust-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
