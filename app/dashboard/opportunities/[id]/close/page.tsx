"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Opportunity { id: string; name: string; customer_name: string; estimated_value: string; }
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

export default function CloseOpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [outcome, setOutcome] = useState<"won" | "lost">("won");
  const [actualValue, setActualValue] = useState("");
  const [wonDate, setWonDate] = useState("");
  const [reason, setReason] = useState("");
  const [createProject, setCreateProject] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/opportunities/${id}`).then(r => r.json()).then(d => {
      setOpp(d.opportunity || null);
      if (d.opportunity) setActualValue(d.opportunity.estimated_value);
    });
  }, [id]);

  async function close() {
    if (!reason.trim()) { setError("Reason / notes is required"); return; }
    if (outcome === "won" && (!actualValue || !wonDate)) { setError("Actual value and won date are required for a won opportunity"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/opportunities/${id}/close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome, actualValue, wonDate, reason, createProject }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to close opportunity"); setSaving(false); return; }
      router.push(`/dashboard/opportunities/${id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  if (!opp) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 640 }}>
      <Link href={`/dashboard/opportunities/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to {opp.name}</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 20px" }}>Close Opportunity</h1>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <p style={labelStyle}>Outcome *</p>
        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="radio" name="outcome" checked={outcome === "won"} onChange={() => setOutcome("won")} style={{ accentColor: colors.success, width: 16, height: 16 }} />
            <span style={{ fontSize: "0.85rem", color: outcome === "won" ? colors.success : colors.textMed, fontWeight: 700 }}>Won</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="radio" name="outcome" checked={outcome === "lost"} onChange={() => setOutcome("lost")} style={{ accentColor: colors.danger, width: 16, height: 16 }} />
            <span style={{ fontSize: "0.85rem", color: outcome === "lost" ? colors.danger : colors.textMed, fontWeight: 700 }}>Lost</span>
          </label>
        </div>

        {outcome === "won" && (
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", marginBottom: 18 }}>
            <p style={{ fontWeight: 700, color: colors.success, fontSize: "0.82rem", marginBottom: 12 }}>Won Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Actual Value (&#8358;) *</label>
                <input type="number" min="0" value={actualValue} onChange={e => setActualValue(e.target.value)} placeholder="Enter actual value" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Won Date *</label>
                <input type="date" value={wonDate} onChange={e => setWonDate(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Reason / Notes *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Add notes about the outcome..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {outcome === "won" && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: colors.textMed, marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={createProject} onChange={e => setCreateProject(e.target.checked)} style={{ accentColor: colors.primary, width: 15, height: 15 }} />
            Create project from this opportunity
          </label>
        )}
        {outcome === "won" && createProject && (
          <p style={{ fontSize: "0.72rem", color: colors.textFaint, marginTop: -12, marginBottom: 18, lineHeight: 1.5 }}>
            Projects isn&apos;t built yet (Batch 07) -- this records your intent so that module can create the real project when it lands.
          </p>
        )}

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href={`/dashboard/opportunities/${id}`} style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
          <button onClick={close} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Closing..." : "Close Opportunity"}
          </button>
        </div>
      </div>
    </div>
  );
}
