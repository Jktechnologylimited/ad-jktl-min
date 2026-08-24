"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

const SOURCES = ["website", "referral", "affiliate", "bdr", "other"];
const STATUSES = ["new", "contacted", "qualified", "proposal"];

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", companyName: "", email: "", phone: "", website: "",
    source: "website", status: "new", notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("First and last name are required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to save lead"); setSaving(false); return; }
      router.push(`/dashboard/leads/${d.id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 720 }}>
      <p style={{ fontSize: "0.72rem", color: colors.textFaint, marginBottom: 6 }}>
        <Link href="/dashboard/leads" style={{ color: colors.textFaint, textDecoration: "none" }}>Home</Link> / CRM / <Link href="/dashboard/leads/all" style={{ color: colors.textFaint, textDecoration: "none" }}>Leads</Link> / <span style={{ color: colors.textMed }}>New Lead</span>
      </p>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: 20 }}>New Lead</h1>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.primary, marginBottom: 18 }}>Lead Information</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>First Name *</label><input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Enter first name" style={inputStyle} /></div>
          <div><label style={labelStyle}>Last Name *</label><input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Enter last name" style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Company Name</label><input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Enter company name" style={inputStyle} /></div>
          <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="Enter email" style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Phone</label><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Enter phone number" style={inputStyle} /></div>
          <div><label style={labelStyle}>Website</label><input value={form.website} onChange={e => set("website", e.target.value)} placeholder="Enter website" style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Source *</label>
            <select value={form.source} onChange={e => set("source", e.target.value)} style={inputStyle}>
              {SOURCES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status *</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
              {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Enter notes..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/dashboard/leads/all" style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
          <button onClick={save} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
