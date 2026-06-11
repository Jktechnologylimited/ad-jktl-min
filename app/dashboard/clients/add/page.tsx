"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const sans = "'Plus Jakarta Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: "0.88rem",
  fontFamily: sans, outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.65rem", fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
  color: "rgba(226,232,240,0.4)", marginBottom: 6,
};
const selectStyle: React.CSSProperties = {
  ...{} as React.CSSProperties,
  width: "100%", padding: "10px 14px",
  background: "#0B1640",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: "0.88rem",
  fontFamily: sans, outline: "none",
};

export default function AddClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ type:"ok"|"err"; text:string } | null>(null);

  const [form, setForm] = useState({
    product:     "faithdesk",
    plan:        "pro",
    org_name:    "",
    owner_name:  "",
    owner_email: "",
    owner_phone: "",
    address:     "",
    subdomain:   "",
    custom_domain: "",
    brand_color: "#8B5CF6",
    setup_fee:   "0",
    monthly_fee: "50000",
    status:      "active",
    notes:       "",
    activated_at: new Date().toISOString().slice(0,10),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.org_name || !form.owner_email || !form.subdomain) {
      setMsg({ type:"err", text:"Organisation name, email and subdomain are required" }); return;
    }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/clients/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type:"err", text: data.error || "Failed to save" }); return; }
      setMsg({ type:"ok", text: "Client added successfully" });
      setTimeout(() => router.push("/dashboard/clients"), 1200);
    } catch {
      setMsg({ type:"err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  const PRODUCTS = [
    { id:"faithdesk",  label:"FaithDesk",  color:"#8B5CF6", monthly:"50000" },
    { id:"detaildesk", label:"DetailDesk", color:"#F59E0B", monthly:"30000" },
    { id:"schooldesk", label:"SchoolDesk", color:"#10B981", monthly:"25000" },
  ];

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:sans, maxWidth:720 }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <button onClick={() => router.push("/dashboard/clients")}
          style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(226,232,240,0.4)", fontSize:"0.82rem", padding:0, marginBottom:12, fontFamily:sans }}>
          &larr; Back to Clients
        </button>
        <h1 style={{ fontSize:"1.3rem", fontWeight:700, color:"#fff", marginBottom:4 }}>Add Existing Client</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>
          Record a client who is already on a Desk product (paid separately, own domain, etc.)
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Product + Plan */}
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"22px 24px" }}>
          <p style={{ fontWeight:700, color:"#fff", fontSize:"0.88rem", marginBottom:16 }}>Product & Plan</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <label style={labelStyle}>Product *</label>
              <select style={selectStyle} value={form.product} onChange={e => {
                const p = PRODUCTS.find(x => x.id === e.target.value);
                set("product", e.target.value);
                if (p) { set("brand_color", p.color); set("monthly_fee", p.monthly); }
              }}>
                {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Plan *</label>
              <select style={selectStyle} value={form.plan} onChange={e => set("plan", e.target.value)}>
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Setup Fee Paid (N)</label>
              <input style={inputStyle} value={form.setup_fee}
                onChange={e => set("setup_fee", e.target.value)} placeholder="300000" />
            </div>
            <div>
              <label style={labelStyle}>Monthly Fee (N)</label>
              <input style={inputStyle} value={form.monthly_fee}
                onChange={e => set("monthly_fee", e.target.value)} placeholder="50000" />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Activated On</label>
              <input style={inputStyle} type="date" value={form.activated_at}
                onChange={e => set("activated_at", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Organisation */}
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"22px 24px" }}>
          <p style={{ fontWeight:700, color:"#fff", fontSize:"0.88rem", marginBottom:16 }}>Organisation Details</p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={labelStyle}>Organisation Name *</label>
                <input style={inputStyle} value={form.org_name}
                  onChange={e => set("org_name", e.target.value)} placeholder="Heavens Hospitality Church" />
              </div>
              <div>
                <label style={labelStyle}>Brand Colour</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={form.brand_color} onChange={e => set("brand_color", e.target.value)}
                    style={{ width:42, height:42, borderRadius:6, border:"none", cursor:"pointer", background:"none" }} />
                  <input style={{ ...inputStyle, flex:1 }} value={form.brand_color}
                    onChange={e => set("brand_color", e.target.value)} placeholder="#8B5CF6" />
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={labelStyle}>Owner / Pastor Name *</label>
                <input style={inputStyle} value={form.owner_name}
                  onChange={e => set("owner_name", e.target.value)} placeholder="Pastor John Adeyemi" />
              </div>
              <div>
                <label style={labelStyle}>Owner Email *</label>
                <input style={inputStyle} type="email" value={form.owner_email}
                  onChange={e => set("owner_email", e.target.value)} placeholder="pastor@heavenshospitality.org" />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.owner_phone}
                  onChange={e => set("owner_phone", e.target.value)} placeholder="+234 803 000 0000" />
              </div>
              <div>
                <label style={labelStyle}>Address / City</label>
                <input style={inputStyle} value={form.address}
                  onChange={e => set("address", e.target.value)} placeholder="Lagos, Nigeria" />
              </div>
            </div>
          </div>
        </div>

        {/* Domain */}
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"22px 24px" }}>
          <p style={{ fontWeight:700, color:"#fff", fontSize:"0.88rem", marginBottom:16 }}>Domain</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <label style={labelStyle}>JKTL Subdomain *</label>
              <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                <input style={{ ...inputStyle, borderRadius:"8px 0 0 8px", borderRight:"none" }}
                  value={form.subdomain} onChange={e => set("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                  placeholder="heavenshospitality" />
                <span style={{ padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.1)", borderLeft:"none", borderRadius:"0 8px 8px 0", fontSize:"0.78rem", color:"rgba(226,232,240,0.4)", whiteSpace:"nowrap", fontFamily:mono }}>
                  .jktl.com.ng
                </span>
              </div>
              <p style={{ fontSize:"0.68rem", color:"rgba(226,232,240,0.3)", marginTop:4 }}>
                Used for their accounts dashboard. Their actual app runs on their own domain.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Their Custom Domain</label>
              <input style={inputStyle} value={form.custom_domain}
                onChange={e => set("custom_domain", e.target.value)} placeholder="heavenshospitality.org" />
              <p style={{ fontSize:"0.68rem", color:"rgba(226,232,240,0.3)", marginTop:4 }}>
                Where their app is actually hosted
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"22px 24px" }}>
          <label style={labelStyle}>Internal Notes (optional)</label>
          <textarea style={{ ...inputStyle, minHeight:80, resize:"vertical" }}
            value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="e.g. Migrated from heavenshospitality.org. Setup done manually." />
        </div>

        {msg && (
          <div style={{ padding:"12px 16px", borderRadius:8, fontSize:"0.85rem",
            background: msg.type==="ok" ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)",
            border: msg.type==="ok" ? "1px solid rgba(5,150,105,0.2)" : "1px solid rgba(239,68,68,0.2)",
            color: msg.type==="ok" ? "#34D399" : "#F87171" }}>
            {msg.text}
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          style={{ padding:"13px", borderRadius:8, fontWeight:700, fontSize:"0.8rem", textTransform:"uppercase", letterSpacing:"0.08em", background: saving ? "rgba(201,168,76,0.5)" : "#C9A84C", color:"#060E2A", border:"none", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Add Client to Command Centre"}
        </button>
      </div>
    </div>
  );
}
