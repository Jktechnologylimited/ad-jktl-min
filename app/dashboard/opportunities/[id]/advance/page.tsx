"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

const STAGES = ["Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
interface Opportunity { id: string; name: string; customer_name: string; stage: string; }

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.85rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 };

export default function AdvanceStagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [updateSummary, setUpdateSummary] = useState("");
  const [nextStepPlan, setNextStepPlan] = useState("");
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(`/api/opportunities/${id}`).then(r => r.json()).then(d => setOpp(d.opportunity || null)); }, [id]);

  async function move() {
    if (!updateSummary.trim()) { setError("Update summary is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/opportunities/${id}/advance-stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updateSummary, nextStepPlan, createFollowUpTask, notifyTeam }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to move stage"); setSaving(false); return; }
      router.push(`/dashboard/opportunities/${id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  if (!opp) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;

  const idx = STAGES.indexOf(opp.stage);
  const nextStage = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 640 }}>
      <Link href={`/dashboard/opportunities/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Opportunities</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 4px" }}>Move to Next Stage</h1>
      <p style={{ fontSize: "0.82rem", color: colors.textFaint, marginBottom: 20 }}>You are about to move this opportunity to the next stage.</p>

      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, marginBottom: 20 }}>
        <span style={{ padding: "7px 14px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: colors.textMed, fontWeight: 700, fontSize: "0.82rem" }}>{opp.stage}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        {nextStage ? (
          <span style={{ padding: "7px 14px", borderRadius: 6, background: "rgba(201,168,76,0.15)", color: colors.primary, fontWeight: 700, fontSize: "0.82rem" }}>{nextStage}</span>
        ) : (
          <span style={{ fontSize: "0.82rem", color: colors.textFaint }}>No further stage &mdash; use Close instead</span>
        )}
      </div>

      {nextStage && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Add Stage Update</p>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Update Summary *</label>
            <textarea value={updateSummary} onChange={e => setUpdateSummary(e.target.value)} placeholder="Describe what happened in this stage..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Next Step / Action Plan</label>
            <textarea value={nextStepPlan} onChange={e => setNextStepPlan(e.target.value)} placeholder="What are the next steps?" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 10 }}>Stage Change Options</p>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: colors.textMed, marginBottom: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={createFollowUpTask} onChange={e => setCreateFollowUpTask(e.target.checked)} style={{ accentColor: colors.primary, width: 15, height: 15 }} />
            Create follow-up task
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: colors.textMed, marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={notifyTeam} onChange={e => setNotifyTeam(e.target.checked)} style={{ accentColor: colors.primary, width: 15, height: 15 }} />
            Notify team members (emails the opportunity owner)
          </label>

          {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginBottom: 14 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Link href={`/dashboard/opportunities/${id}`} style={{ padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${colors.border}`, color: colors.textMed, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}>Cancel</Link>
            <button onClick={move} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Moving..." : "Move to Next Stage"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
