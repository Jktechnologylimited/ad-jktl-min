"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Proposal { id: string; name: string; proposal_number: string; contact_email?: string; }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };

export default function SendProposalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [attachPdf, setAttachPdf] = useState(true);
  const [requestAcceptance, setRequestAcceptance] = useState(true);
  const [setExpiry, setSetExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/proposals/${id}`).then(r => r.json()).then(d => {
      const p: Proposal = d.proposal;
      setProposal(p);
      if (p) { setSubject(p.name); if (p.contact_email) setSendTo(p.contact_email); setMessage(`Dear team,\n\nPlease find attached our proposal for ${p.name}.\nWe look forward to working with you.\n\nRegards,`); }
    });
  }, [id]);

  async function submit(saveAsDraft: boolean) {
    setSaving(true); setError("");
    const payload = {
      saveAsDraft, sendTo: sendTo.split(",").map(s => s.trim()).filter(Boolean), cc: cc.split(",").map(s => s.trim()).filter(Boolean),
      subject, message, sendEmail, attachPdf, requestAcceptance, expiryDate: setExpiry ? expiryDate : null,
    };
    try {
      const res = await fetch(`/api/proposals/${id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to send proposal"); setSaving(false); return; }
      router.push(`/dashboard/proposals/${id}`);
    } catch { setError("Something went wrong. Please try again."); setSaving(false); }
  }

  if (!proposal) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 720 }}>
      <Link href={`/dashboard/proposals/${id}/preview`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Proposal</Link>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: "14px 0 20px" }}>Send Proposal</h1>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 }}>Send To * <span style={{ fontWeight: 400, color: colors.textFaint }}>(comma-separated)</span></label>
          <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="john@technova.com" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 }}>CC</label>
          <input value={cc} onChange={e => setCc(e.target.value)} placeholder="jane@jktl.com" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 }}>Subject *</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: colors.textLow, marginBottom: 6 }}>Message (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem", marginBottom: 10 }}>Delivery Options</p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: colors.textMed, marginBottom: 8, cursor: "pointer" }}><input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} style={{ accentColor: colors.primary, width: 14, height: 14 }} />Send email with proposal link</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: colors.textMed, marginBottom: 8, cursor: "pointer" }}><input type="checkbox" checked={attachPdf} onChange={e => setAttachPdf(e.target.checked)} style={{ accentColor: colors.primary, width: 14, height: 14 }} />Attach PDF to email</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: colors.textMed, marginBottom: 8, cursor: "pointer" }}><input type="checkbox" checked={requestAcceptance} onChange={e => setRequestAcceptance(e.target.checked)} style={{ accentColor: colors.primary, width: 14, height: 14 }} />Request approval / acceptance</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: colors.textMed, marginBottom: 8, cursor: "pointer" }}><input type="checkbox" checked={setExpiry} onChange={e => setSetExpiry(e.target.checked)} style={{ accentColor: colors.primary, width: 14, height: 14 }} />Set expiry date</label>
        {setExpiry && <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={{ ...inputStyle, marginBottom: 10, maxWidth: 200 }} />}

        {attachPdf && <p style={{ fontSize: "0.7rem", color: colors.textFaint, marginTop: 10, marginBottom: 4 }}>Note: the email links to a live web page the client can view and accept &mdash; a literal PDF attachment isn&apos;t generated server-side; the client can download a PDF themselves from that page.</p>}

        {error && <p style={{ color: colors.danger, fontSize: "0.82rem", marginTop: 10 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button onClick={() => submit(true)} disabled={saving} style={{ padding: "10px 18px", borderRadius: 8, background: "none", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Save as Draft</button>
          <button onClick={() => submit(false)} disabled={saving} style={{ padding: "10px 20px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Sending..." : "Send Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
