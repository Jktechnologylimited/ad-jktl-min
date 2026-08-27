"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const sans = "'Plus Jakarta Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: "0.88rem",
  fontFamily: sans, outline: "none",
};
const disabledInputStyle: React.CSSProperties = { ...inputStyle, opacity: 0.5, cursor: "not-allowed" };
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.65rem", fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
  color: "rgba(226,232,240,0.4)", marginBottom: 6,
};
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "#0B1640",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: "0.88rem",
  fontFamily: sans, outline: "none",
};

interface Org {
  id: string; product: string; subdomain: string; org_name: string; owner_name: string; owner_email: string; owner_phone: string;
  address: string; custom_domain?: string; brand_color?: string; plan: string; setup_fee: string; monthly_fee: string;
  status: string; notes?: string; domain_registrar?: string; domain_expiry_date?: string;
}

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Org | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(d => {
      if (d.org) {
        setOrg(d.org);
        setForm({
          org_name: d.org.org_name || "", owner_name: d.org.owner_name || "", owner_email: d.org.owner_email || "",
          owner_phone: d.org.owner_phone || "", address: d.org.address || "", custom_domain: d.org.custom_domain || "",
          brand_color: d.org.brand_color || "#8B5CF6", plan: d.org.plan || "pro", setup_fee: String(d.org.setup_fee ?? "0"),
          monthly_fee: String(d.org.monthly_fee ?? "0"), status: d.org.status || "active", notes: d.org.notes || "",
          domain_registrar: d.org.domain_registrar || "", domain_expiry_date: d.org.domain_expiry_date ? d.org.domain_expiry_date.slice(0, 10) : "",
        });
      } else {
        setMsg({ type: "err", text: d.error || "Client not found" });
      }
      setLoading(false);
    }).catch(() => { setMsg({ type: "err", text: "Failed to load client" }); setLoading(false); });
  }, [id]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: d.error || "Failed to save" }); setSaving(false); return; }
      setMsg({ type: "ok", text: "Saved." });
      setSaving(false);
    } catch { setMsg({ type: "err", text: "Something went wrong. Please try again." }); setSaving(false); }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "rgba(226,232,240,0.4)", fontFamily: sans }}>Loading...</div>;
  if (!org) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: sans }}>
      <p style={{ color: "rgba(226,232,240,0.4)", marginBottom: 12 }}>{msg?.text || "Client not found."}</p>
      <Link href="/dashboard/clients" style={{ color: "#C9A84C", fontSize: "0.85rem" }}>&larr; Back to Clients</Link>
    </div>
  );

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 720 }}>
      <Link href="/dashboard/clients" style={{ fontSize: "0.78rem", color: "rgba(226,232,240,0.4)", textDecoration: "none" }}>&larr; Back to Clients</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 4px" }}>Edit {org.org_name}</h1>
      <p style={{ fontSize: "0.78rem", color: "rgba(226,232,240,0.4)", marginBottom: 20, fontFamily: mono }}>{org.product} &middot; {org.subdomain}.jktl.com.ng</p>

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Product (read-only)</label><input value={org.product} disabled style={disabledInputStyle} /></div>
          <div><label style={labelStyle}>Subdomain (read-only)</label><input value={`${org.subdomain}.jktl.com.ng`} disabled style={disabledInputStyle} /></div>
        </div>
        <p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.3)", marginTop: -8, marginBottom: 18, lineHeight: 1.5 }}>
          Product and subdomain aren&apos;t editable here &mdash; the subdomain is this tenant&apos;s live routing key, and the product determines which database schema they were provisioned with. Changing either here wouldn&apos;t update their real infrastructure.
        </p>

        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Organisation Name</label><input value={form.org_name} onChange={e => set("org_name", e.target.value)} style={inputStyle} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Owner Name</label><input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Owner Email</label><input type="email" value={form.owner_email} onChange={e => set("owner_email", e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Owner Phone</label><input value={form.owner_phone} onChange={e => set("owner_phone", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Address</label><input value={form.address} onChange={e => set("address", e.target.value)} style={inputStyle} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Custom Domain</label><input value={form.custom_domain} onChange={e => set("custom_domain", e.target.value)} placeholder="e.g. school.com" style={inputStyle} /></div>
          <div><label style={labelStyle}>Brand Color</label><input type="color" value={form.brand_color} onChange={e => set("brand_color", e.target.value)} style={{ ...inputStyle, padding: 4, height: 42 }} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={e => set("plan", e.target.value)} style={selectStyle}>
              <option value="standard">Standard</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={selectStyle}>
              <option value="active">Active</option><option value="pending_payment">Pending Payment</option><option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Setup Fee (&#8358;)</label><input type="number" min="0" value={form.setup_fee} onChange={e => set("setup_fee", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Monthly Fee (&#8358;)</label><input type="number" min="0" value={form.monthly_fee} onChange={e => set("monthly_fee", e.target.value)} style={inputStyle} /></div>
        </div>

        <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", margin: "18px 0 12px" }}>Domain Tracking</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Registrar</label><input value={form.domain_registrar} onChange={e => set("domain_registrar", e.target.value)} placeholder="e.g. Namecheap" style={inputStyle} /></div>
          <div><label style={labelStyle}>Domain Expiry Date</label><input type="date" value={form.domain_expiry_date} onChange={e => set("domain_expiry_date", e.target.value)} style={inputStyle} /></div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {msg && <p style={{ color: msg.type === "ok" ? "#34D399" : "#F87171", fontSize: "0.82rem", marginBottom: 14 }}>{msg.text}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => router.push("/dashboard/clients")} style={{ padding: "10px 18px", borderRadius: 8, background: "none", border: "1.5px solid rgba(255,255,255,0.1)", color: "rgba(226,232,240,0.6)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Back to List</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: "#C9A84C", color: "#060E2A", border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}
