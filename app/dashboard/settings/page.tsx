"use client";
import { useState } from "react";

const sans = "'Plus Jakarta Sans',sans-serif";
const mono = "'JetBrains Mono',monospace";

const inputS: React.CSSProperties = {
  width:"100%", padding:"10px 14px",
  background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:8, color:"#fff",
  fontSize:"0.88rem", outline:"none",
  fontFamily:sans,
};
const labelS: React.CSSProperties = {
  display:"block", fontSize:"0.65rem", fontWeight:700,
  letterSpacing:"0.1em", textTransform:"uppercase",
  color:"rgba(226,232,240,0.4)", marginBottom:5,
};
const cardS: React.CSSProperties = {
  background:"rgba(255,255,255,0.04)",
  border:"1px solid rgba(255,255,255,0.07)",
  borderRadius:10, padding:"24px",
  marginBottom:16,
};

const PRODUCTS = [
  { value:"faithdesk",  label:"FaithDesk",  defaultSetup:300000, defaultMonthly:50000  },
  { value:"detaildesk", label:"DetailDesk", defaultSetup:200000, defaultMonthly:30000  },
  { value:"schooldesk", label:"SchoolDesk", defaultSetup:0,      defaultMonthly:25000  },
];
const PLANS = ["standard","pro","enterprise"];

export default function SettingsPage() {
  //  Add client form 
  const [product,     setProduct]     = useState("faithdesk");
  const [plan,        setPlan]        = useState("pro");
  const [orgName,     setOrgName]     = useState("");
  const [ownerName,   setOwnerName]   = useState("");
  const [ownerEmail,  setOwnerEmail]  = useState("");
  const [ownerPhone,  setOwnerPhone]  = useState("");
  const [subdomain,   setSubdomain]   = useState("");
  const [setupFee,    setSetupFee]    = useState("300000");
  const [monthlyFee,  setMonthlyFee]  = useState("50000");
  const [address,     setAddress]     = useState("");
  const [customDomain,setCustomDomain]= useState("");
  const [notes,       setNotes]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState<{type:"ok"|"err";text:string}|null>(null);

  // Auto-fill fees when product changes
  function handleProductChange(p: string) {
    setProduct(p);
    const meta = PRODUCTS.find(x => x.value === p);
    if (meta) { setSetupFee(String(meta.defaultSetup)); setMonthlyFee(String(meta.defaultMonthly)); }
  }

  // Auto-generate subdomain from org name
  function handleOrgNameChange(name: string) {
    setOrgName(name);
    // Always auto-fill subdomain from org name unless user has manually edited it
    const autoSub = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
    setSubdomain(autoSub);
  }

  async function handleAddClient() {
    const trimmedOrgName   = orgName.trim();
    const trimmedEmail     = ownerEmail.trim();
    const trimmedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!trimmedOrgName)   { setMsg({ type:"err", text:"Organisation name is required" }); return; }
    if (!trimmedEmail)     { setMsg({ type:"err", text:"Owner email is required" }); return; }
    if (!trimmedSubdomain) { setMsg({ type:"err", text:"Subdomain is required -- it auto-fills from the org name" }); return; }
    if (!product)          { setMsg({ type:"err", text:"Please select a product" }); return; }

    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/clients/add", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ product, plan, orgName: trimmedOrgName, ownerName: ownerName.trim(), ownerEmail: trimmedEmail, ownerPhone: ownerPhone.trim(), subdomain: trimmedSubdomain, customDomain: customDomain.trim(), setupFee, monthlyFee, address: address.trim(), notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type:"err", text:data.error||"Failed to add client" }); return; }
      setMsg({ type:"ok", text:`Client added successfully. ID: ${data.id}` });
      // Clear form
      setOrgName(""); setOwnerName(""); setOwnerEmail(""); setOwnerPhone("");
      setSubdomain(""); setCustomDomain(""); setAddress(""); setNotes("");
    } catch { setMsg({ type:"err", text:"Network error. Please try again." }); }
    finally { setSaving(false); }
  }

  const fmtN = (n: string) => "N" + (Number(n)||0).toLocaleString("en-NG");

  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:sans, maxWidth:800 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Settings</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>Manually add clients and manage platform configuration.</p>
      </div>

      {/*  ADD CLIENT MANUALLY  */}
      <div style={cardS}>
        <h2 style={{ fontWeight:700, color:"#fff", fontSize:"1rem", marginBottom:4 }}>Add Client Manually</h2>
        <p style={{ fontSize:"0.78rem", color:"rgba(226,232,240,0.4)", marginBottom:24, lineHeight:1.6 }}>
          Use this for existing clients (e.g. Heavens Hospitality) or clients who paid offline.
          Once added, they appear in the Clients list and their product shows in their accounts dashboard.
        </p>

        {msg && (
          <div style={{ padding:"12px 16px", borderRadius:8, marginBottom:20, fontSize:"0.82rem",
            background: msg.type==="ok" ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)",
            border: msg.type==="ok" ? "1px solid rgba(5,150,105,0.2)" : "1px solid rgba(239,68,68,0.2)",
            color: msg.type==="ok" ? "#34D399" : "#F87171" }}>
            {msg.text}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:16 }}>
          {/* Product */}
          <div>
            <label style={labelS}>Product *</label>
            <select value={product} onChange={e => handleProductChange(e.target.value)}
              style={{ ...inputS, cursor:"pointer" }}>
              {PRODUCTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label style={labelS}>Plan *</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}
              style={{ ...inputS, cursor:"pointer" }}>
              {PLANS.map(p => <option key={p} value={p} style={{ textTransform:"capitalize" }}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:16 }}>
          <div>
            <label style={labelS}>Organisation Name *</label>
            <input style={inputS} value={orgName} onChange={e => handleOrgNameChange(e.target.value)} placeholder="Heavens Hospitality Church" />
          </div>
          <div>
            <label style={labelS}>Owner / Pastor Name</label>
            <input style={inputS} value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Pastor John Doe" />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:16 }}>
          <div>
            <label style={labelS}>Owner Email *</label>
            <input style={inputS} type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="pastor@church.org" />
          </div>
          <div>
            <label style={labelS}>Owner Phone</label>
            <input style={inputS} value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} placeholder="+234 803 000 0000" />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:16 }}>
          <div>
            <label style={labelS}>Subdomain *</label>
            <div style={{ display:"flex", alignItems:"center", gap:0 }}>
              <input style={{ ...inputS, borderRadius:"8px 0 0 8px", flex:1 }} value={subdomain}
                onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                placeholder="heavenshospitality" />
              <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderLeft:"none", borderRadius:"0 8px 8px 0", fontSize:"0.78rem", color:"rgba(226,232,240,0.3)", whiteSpace:"nowrap" }}>
                .jktl.com.ng
              </div>
            </div>
            {subdomain && (
              <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:4, fontFamily:mono }}>
                {subdomain}.jktl.com.ng
              </p>
            )}
          </div>
          <div>
            <label style={labelS}>Address / City</label>
            <input style={inputS} value={address} onChange={e => setAddress(e.target.value)} placeholder="Lagos, Nigeria" />
          </div>
          <div>
            <label style={labelS}>Custom Domain (if on Pro plan)</label>
            <input style={inputS} value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="heavenshospitality.org" />
            <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:4 }}>Leave blank if using subdomain only. Enter without https://</p>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div>
            <label style={labelS}>Setup Fee Paid</label>
            <input style={inputS} type="number" value={setupFee} onChange={e => setSetupFee(e.target.value)} />
            <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:4 }}>{fmtN(setupFee)}</p>
          </div>
          <div>
            <label style={labelS}>Monthly Fee</label>
            <input style={inputS} type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} />
            <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:4 }}>{fmtN(monthlyFee)}/mo</p>
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelS}>Internal Notes</label>
          <textarea style={{ ...inputS, minHeight:72, resize:"vertical" }} value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Pro plan client. Domain: heavenshospitality.org. Pre-existing before JKTL platform launch." />
        </div>

        {/* Summary */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"14px 16px", marginBottom:20 }}>
          <p style={{ fontFamily:mono, fontSize:"0.6rem", color:"rgba(226,232,240,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Summary</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
            {[
              { l:"Product",   v: PRODUCTS.find(p=>p.value===product)?.label || product },
              { l:"Plan",      v: plan.charAt(0).toUpperCase()+plan.slice(1) },
              { l:"Org",       v: orgName || "--" },
              { l:"Subdomain",     v: subdomain ? subdomain+".jktl.com.ng" : "--" },
              { l:"Custom Domain", v: customDomain || "None" },
              { l:"Setup Fee", v: fmtN(setupFee) },
              { l:"Monthly",   v: fmtN(monthlyFee)+"/mo" },
            ].map(s => (
              <div key={s.l}>
                <p style={{ fontFamily:mono, fontSize:"0.58rem", color:"rgba(226,232,240,0.25)", marginBottom:3 }}>{s.l}</p>
                <p style={{ fontSize:"0.8rem", fontWeight:600, color:"#fff" }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleAddClient} disabled={saving}
          style={{ padding:"12px 28px", borderRadius:8, fontWeight:700, fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.08em", background: saving ? "rgba(201,168,76,0.4)" : "#C9A84C", color:"#060E2A", border:"none", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Adding Client..." : "Add Client to Platform"}
        </button>

        <div style={{ marginTop:20, padding:"14px 16px", borderRadius:8, background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.15)" }}>
          <p style={{ fontWeight:700, fontSize:"0.8rem", color:"#C9A84C", marginBottom:6 }}>After adding:</p>
          <p style={{ fontSize:"0.75rem", color:"rgba(226,232,240,0.5)", lineHeight:1.7 }}>
            1. Tell the client to sign up at <span style={{ color:"#C9A84C", fontFamily:mono, fontSize:"0.72rem" }}>accounts.jktl.com.ng/sign-up</span> using their email above<br/>
            2. Once they verify their email, their product card appears automatically in their dashboard<br/>
            3. Point them to the product page for training videos
          </p>
        </div>
      </div>

      {/*  PLATFORM CONFIG  */}
      <div style={cardS}>
        <h2 style={{ fontWeight:700, color:"#fff", fontSize:"1rem", marginBottom:4 }}>Platform URLs</h2>
        <p style={{ fontSize:"0.78rem", color:"rgba(226,232,240,0.4)", marginBottom:16 }}>Quick reference for all JKTL platform URLs.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { label:"Main Site",        url:"https://jktl.com.ng" },
            { label:"Accounts / SSO",   url:"https://accounts.jktl.com.ng" },
            { label:"Command Centre",   url:"https://admin.jktl.com.ng" },
            { label:"Paystack Webhook", url:"https://jktl.com.ng/api/onboarding/paystack-webhook" },
            { label:"Onboarding Setup", url:"https://jktl.com.ng/api/onboarding/setup" },
            { label:"Affiliate Setup",  url:"https://jktl.com.ng/api/affiliate/setup" },
            { label:"Accounts Setup",   url:"https://accounts.jktl.com.ng/api/setup" },
          ].map(item => (
            <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:6, background:"rgba(255,255,255,0.03)", flexWrap:"wrap", gap:8 }}>
              <span style={{ fontSize:"0.78rem", fontWeight:600, color:"rgba(226,232,240,0.7)" }}>{item.label}</span>
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:mono, fontSize:"0.72rem", color:"#C9A84C", textDecoration:"none" }}>
                {item.url}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/*  COMMISSION RATES  */}
      <div style={cardS}>
        <h2 style={{ fontWeight:700, color:"#fff", fontSize:"1rem", marginBottom:4 }}>Affiliate Commission Rates</h2>
        <p style={{ fontSize:"0.78rem", color:"rgba(226,232,240,0.4)", marginBottom:16 }}>Current rates (edit in <span style={{ fontFamily:mono, fontSize:"0.7rem", color:"#C9A84C" }}>lib/affiliate-offers.ts</span> to change).</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
          {[
            { label:"Welcome Bonus",      value:"N10,000",  note:"First referral only" },
            { label:"Setup Fee",          value:"5%",        note:"One-time" },
            { label:"Monthly Fee",        value:"2%",        note:"3 months" },
            { label:"Minimum Payout",     value:"N100,000",  note:"Bank transfer" },
            { label:"Cookie Duration",    value:"60 days",   note:"Attribution window" },
          ].map(r => (
            <div key={r.label} style={{ padding:"12px 14px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontWeight:700, fontSize:"1rem", color:"#C9A84C", lineHeight:1, marginBottom:4 }}>{r.value}</p>
              <p style={{ fontSize:"0.75rem", fontWeight:600, color:"rgba(226,232,240,0.6)" }}>{r.label}</p>
              <p style={{ fontSize:"0.65rem", color:"rgba(226,232,240,0.3)", marginTop:2 }}>{r.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
