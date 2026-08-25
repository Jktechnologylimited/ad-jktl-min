"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface LineItem { name: string; unitPrice: number; qty: number; discountPct: number; total: number; }
interface Deliverable { label: string; checked: boolean; }
interface Proposal {
  id: string; proposal_number: string; customer_name: string; name: string; status: string; notes_internal?: string;
  line_items: LineItem[]; client_note?: string; subtotal: number; discount_total: number; tax_pct: number; total: number;
  deliverables: Deliverable[]; start_date?: string; duration_weeks?: number; end_date?: string;
  payment_terms?: string; maintenance_terms?: string; valid_until?: string; owner_name?: string; created_at: string;
}
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "\u2014"; }

export default function ProposalPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [view, setView] = useState<"client" | "internal">("client");

  useEffect(() => { fetch(`/api/proposals/${id}`).then(r => r.json()).then(d => setProposal(d.proposal || null)); }, [id]);
  if (!proposal) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 900 }}>
      <div className="print-hide">
        <Link href={`/dashboard/proposals/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Proposal</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "14px 0 20px", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Step 5: Review Proposal</h1>
            <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
              <button onClick={() => setView("client")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", background: view === "client" ? colors.primary : "rgba(255,255,255,0.05)", color: view === "client" ? colors.primaryText : colors.textMed, border: "none" }}>Client Preview</button>
              <button onClick={() => setView("internal")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", background: view === "internal" ? colors.primary : "rgba(255,255,255,0.05)", color: view === "internal" ? colors.primaryText : colors.textMed, border: "none" }}>Internal Preview</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => window.print()} style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>Download PDF</button>
            {proposal.status === "draft" && <Link href={`/dashboard/proposals/${id}/send`} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>Next: Send &rarr;</Link>}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", color: "#1a1a1a" }}>
        <div style={{ background: "#060E2A", padding: "clamp(28px,6vw,48px) clamp(20px,5vw,40px)", textAlign: "center" }}>
          <p style={{ fontFamily: font.mono, fontSize: "0.65rem", color: colors.primary, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>JK Technology Limited</p>
          <h2 style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 700, marginBottom: 10 }}>{proposal.name}</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Prepared for: {proposal.customer_name}</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", fontFamily: font.mono, marginTop: 8 }}>{proposal.proposal_number} &middot; {fmtDate(proposal.created_at)}</p>
        </div>

        <div style={{ padding: "clamp(20px,5vw,32px) clamp(20px,5vw,40px)" }}>
          {view === "internal" && proposal.notes_internal && (
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, padding: 14, marginBottom: 24 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#92400E", marginBottom: 4 }}>INTERNAL NOTES (not visible to client)</p>
              <p style={{ fontSize: "0.82rem", color: "#78350F" }}>{proposal.notes_internal}</p>
              {proposal.owner_name && <p style={{ fontSize: "0.72rem", color: "#92400E", marginTop: 6 }}>Owner: {proposal.owner_name}</p>}
            </div>
          )}

          <p style={{ fontFamily: font.mono, fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Scope of Work</p>
          <div style={{ marginBottom: 28 }}>
            {proposal.line_items.map((li, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #EFEBE0", fontSize: "0.85rem" }}>
                <span>{li.name} {li.qty > 1 && <span style={{ color: "#999" }}>&times;{li.qty}</span>}</span>
                <span style={{ fontFamily: font.mono }}>{fmtN(li.total || li.unitPrice * li.qty)}</span>
              </div>
            ))}
            {proposal.client_note && <p style={{ fontSize: "0.82rem", color: "#666", marginTop: 12, lineHeight: 1.6 }}>{proposal.client_note}</p>}
          </div>

          <p style={{ fontFamily: font.mono, fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Deliverables</p>
          <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
            {proposal.deliverables.filter(d => d.checked).map((d, i) => <div key={i} style={{ fontSize: "0.82rem", color: "#1a1a1a" }}>&#10003; {d.label}</div>)}
          </div>

          <p style={{ fontFamily: font.mono, fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Timeline</p>
          <div className="prop-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28, fontSize: "0.85rem" }}>
            <div><p style={{ color: "#999", fontSize: "0.7rem" }}>Start</p><p style={{ fontWeight: 600 }}>{fmtDate(proposal.start_date)}</p></div>
            <div><p style={{ color: "#999", fontSize: "0.7rem" }}>Duration</p><p style={{ fontWeight: 600 }}>{proposal.duration_weeks ? `${proposal.duration_weeks} weeks` : "\u2014"}</p></div>
            <div><p style={{ color: "#999", fontSize: "0.7rem" }}>End</p><p style={{ fontWeight: 600 }}>{fmtDate(proposal.end_date)}</p></div>
          </div>

          <p style={{ fontFamily: font.mono, fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Investment</p>
          <div style={{ background: "#FAF8F3", borderRadius: 8, padding: 18, marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 6 }}><span>Subtotal</span><span style={{ fontFamily: font.mono }}>{fmtN(proposal.subtotal)}</span></div>
            {proposal.discount_total > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 6 }}><span>Discount</span><span style={{ fontFamily: font.mono }}>-{fmtN(proposal.discount_total)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700, paddingTop: 10, borderTop: "1px solid #EFEBE0" }}><span>Total</span><span style={{ fontFamily: font.mono }}>{fmtN(proposal.total)}</span></div>
          </div>

          <p style={{ fontFamily: font.mono, fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Terms &amp; Conditions</p>
          <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "0.82rem" }}>
            {proposal.payment_terms && <div><p style={{ color: "#999", fontSize: "0.7rem" }}>Payment Terms</p><p>{proposal.payment_terms}</p></div>}
            {proposal.maintenance_terms && <div><p style={{ color: "#999", fontSize: "0.7rem" }}>Maintenance</p><p>{proposal.maintenance_terms}</p></div>}
            {proposal.valid_until && <div><p style={{ color: "#999", fontSize: "0.7rem" }}>Valid Until</p><p>{fmtDate(proposal.valid_until)}</p></div>}
          </div>
        </div>
      </div>
      <style>{`@media print { .print-hide { display: none !important; } body { background: #fff !important; } } @media (max-width: 680px) { .prop-2col, .prop-3col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
