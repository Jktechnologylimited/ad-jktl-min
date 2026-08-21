"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors, font } from "@/lib/design-tokens";

interface Org { id: string; org_name: string; product: string; status: string; }

// Real data from /api/clients (the existing organisations registry) -- no
// placeholder company names. "Active" business is a client-side convenience
// (localStorage) for now; it does not yet change what other pages show --
// that's a larger cross-app context piece for a later batch.
export default function BusinessSwitcher({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(typeof window !== "undefined" ? window.localStorage.getItem("jktl_active_org") : null);
    fetch("/api/clients?status=active")
      .then(r => r.json())
      .then(d => setOrgs(d.orgs || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(o => o.org_name?.toLowerCase().includes(q.toLowerCase()));

  function select(org: Org) {
    window.localStorage.setItem("jktl_active_org", org.id);
    window.localStorage.setItem("jktl_active_org_name", org.org_name);
    setActiveId(org.id);
    onClose();
    router.push("/dashboard/clients");
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "10vh" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 440, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", fontFamily: font.sans }}>Switch Business</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textFaint, cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ padding: "14px 20px" }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search business..."
            style={{ width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.86rem", outline: "none" }} />
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto", padding: "0 10px" }}>
          {loading ? (
            <p style={{ padding: "24px 10px", textAlign: "center", fontSize: "0.8rem", color: colors.textFaint }}>Loading&hellip;</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: "24px 10px", textAlign: "center", fontSize: "0.8rem", color: colors.textFaint }}>
              {orgs.length === 0 ? "No active client businesses yet." : "No match for that search."}
            </p>
          ) : (
            filtered.map(org => (
              <button key={org.id} onClick={() => select(org)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                padding: "12px 10px", background: "none", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", marginBottom: 2,
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>{org.org_name}</p>
                  <p style={{ fontSize: "0.7rem", color: colors.textFaint, fontFamily: font.mono }}>{org.product}</p>
                </div>
                {activeId === org.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
            ))
          )}
        </div>

        <div style={{ padding: 14, borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => { onClose(); router.push("/dashboard/clients/add"); }}
            style={{ width: "100%", padding: "11px", borderRadius: 8, background: "none", border: `1.5px solid ${colors.borderStrong}`, color: colors.textMed, fontFamily: font.sans, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
            + Add New Business
          </button>
        </div>
      </div>
    </div>
  );
}
