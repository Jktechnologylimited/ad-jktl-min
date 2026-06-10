"use client";
export default function Page() {
  return (
    <div style={{ padding:"clamp(20px,4vw,36px)", fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:1400 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"clamp(1.1rem,3vw,1.4rem)", fontWeight:700, color:"#fff", marginBottom:2 }}>Analytics</h1>
        <p style={{ fontSize:"0.82rem", color:"rgba(226,232,240,0.4)" }}>MRR growth, conversion rates, churn, affiliate performance</p>
      </div>
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"48px 32px", textAlign:"center" as const }}>
        <p style={{ fontWeight:700, color:"#fff", marginBottom:8 }}>Coming soon</p>
        <p style={{ fontSize:"0.85rem", color:"rgba(226,232,240,0.4)" }}>This section will be available once connected to the database.</p>
      </div>
    </div>
  );
}
