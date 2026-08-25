"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface LineItem { name: string; unitPrice: number; qty: number; discountPct: number; total: number; }
interface Deliverable { label: string; checked: boolean; }
interface Proposal {
  id: string; proposal_number: string; customer_id?: string; customer_name: string; opportunity_id?: string; name: string; currency: string; status: string;
  line_items: LineItem[]; client_note?: string; subtotal: number; discount_total: number; tax_pct: number; total: number;
  deliverables: Deliverable[]; start_date?: string; duration_weeks?: number; end_date?: string;
  payment_terms?: string; maintenance_terms?: string; owner_name?: string; sent_at?: string;
  accepted_at?: string; accepted_by_name?: string; declined_at?: string; decline_reason?: string; access_token?: string;
}
interface CatalogItem { name: string; category: string; type: string; basePrice: number; }

const STATUS_COLOR: Record<string, string> = { draft: "#94A3B8", sent: "#60A5FA", accepted: "#34D399", declined: "#F87171" };
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 };
const DEFAULT_DELIVERABLES = ["Up to 5 pages website", "Mobile responsive design", "Contact form", "Basic SEO setup", "1 year domain & hosting"];

export default function ProposalWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<2 | 3 | 4>(2);

  // Step 2: offerings
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogTab, setCatalogTab] = useState<"catalog" | "custom" | "used">("catalog");
  const [search, setSearch] = useState("");
  const [customItem, setCustomItem] = useState({ name: "", price: "" });
  const [previouslyUsed, setPreviouslyUsed] = useState<CatalogItem[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Step 3: pricing
  const [taxPct, setTaxPct] = useState(0);
  const [clientNote, setClientNote] = useState("");

  // Step 4: terms
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [maintenanceTerms, setMaintenanceTerms] = useState("");

  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/proposals/${id}`).then(r => r.json()).then(d => {
      const p: Proposal = d.proposal;
      setProposal(p);
      if (p) {
        setLineItems(p.line_items || []);
        setTaxPct(Number(p.tax_pct) || 0);
        setClientNote(p.client_note || "");
        setDeliverables((p.deliverables?.length ? p.deliverables : DEFAULT_DELIVERABLES.map(label => ({ label, checked: true }))));
        setStartDate(p.start_date ? p.start_date.slice(0, 10) : "");
        setDurationWeeks(p.duration_weeks ? String(p.duration_weeks) : "");
        setPaymentTerms(p.payment_terms || "50% upfront, 50% on delivery");
        setMaintenanceTerms(p.maintenance_terms || "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    Promise.all([fetch("/api/desk-products").then(r => r.json()).catch(() => ({ products: [] })), fetch("/api/agency-services").then(r => r.json()).catch(() => ({ services: [] }))])
      .then(([dp, as_]) => {
        const products: CatalogItem[] = (dp.products || []).map((p: { name: string; setup_price?: number }) => ({ name: p.name, category: "Desk Product", type: "Solution", basePrice: Number(p.setup_price) || 0 }));
        const services: CatalogItem[] = (as_.services || []).map((s: { label: string }) => ({ name: s.label, category: "Agency Service", type: "Service", basePrice: 0 }));
        setCatalog([...products, ...services]);
      });
    fetch("/api/proposals?pageSize=50").then(r => r.json()).then(d => {
      const names = new Set<string>();
      const items: CatalogItem[] = [];
      for (const p of d.proposals || []) {
        for (const li of p.line_items || []) {
          if (!names.has(li.name)) { names.add(li.name); items.push({ name: li.name, category: "Previously Used", type: "Item", basePrice: Number(li.unitPrice) || 0 }); }
        }
      }
      setPreviouslyUsed(items.slice(0, 20));
    }).catch(() => {});
  }, []);

  function addItem(item: CatalogItem) {
    setLineItems(li => [...li, { name: item.name, unitPrice: item.basePrice, qty: 1, discountPct: 0, total: item.basePrice }]);
  }
  function addCustomItem() {
    if (!customItem.name.trim()) return;
    setLineItems(li => [...li, { name: customItem.name.trim(), unitPrice: Number(customItem.price) || 0, qty: 1, discountPct: 0, total: Number(customItem.price) || 0 }]);
    setCustomItem({ name: "", price: "" });
  }
  function removeItem(idx: number) { setLineItems(li => li.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, patch: Partial<LineItem>) {
    setLineItems(li => li.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  const subtotal = lineItems.reduce((s, li) => s + Number(li.unitPrice) * Number(li.qty), 0);
  const discountTotal = lineItems.reduce((s, li) => s + (Number(li.unitPrice) * Number(li.qty) * (Number(li.discountPct) || 0)) / 100, 0);
  const taxable = subtotal - discountTotal;
  const tax = taxable * (taxPct / 100);
  const grandTotal = taxable + tax;

  async function saveAndGo(patch: Record<string, unknown>, nextStep?: 2 | 3 | 4 | "review") {
    setSaving(true);
    await fetch(`/api/proposals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setSaving(false);
    if (nextStep === "review") router.push(`/dashboard/proposals/${id}/preview`);
    else if (nextStep) setStep(nextStep);
    load();
  }

  function toggleDeliverable(i: number) { setDeliverables(d => d.map((x, idx) => idx === i ? { ...x, checked: !x.checked } : x)); }
  function addDeliverable() {
    if (!newDeliverable.trim()) return;
    setDeliverables(d => [...d, { label: newDeliverable.trim(), checked: true }]);
    setNewDeliverable("");
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!proposal) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: font.sans }}>
      <p style={{ color: colors.textFaint, marginBottom: 12 }}>Proposal not found.</p>
      <Link href="/dashboard/proposals/all" style={{ color: colors.primary, fontSize: "0.85rem" }}>&larr; Back to Proposals</Link>
    </div>
  );

  // ---- Status view for non-draft proposals (Sheet 1/9 style) ----
  if (proposal.status !== "draft") {
    return (
      <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 800 }}>
        <Link href="/dashboard/proposals/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Proposals</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "14px 0 20px", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{proposal.status === "accepted" ? "Proposal Accepted" : proposal.status === "declined" ? "Proposal Declined" : "Proposal Sent"}</h1>
              <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px", borderRadius: 4, background: STATUS_COLOR[proposal.status] + "20", color: STATUS_COLOR[proposal.status] }}>{proposal.status}</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, marginTop: 4, fontFamily: font.mono }}>{proposal.proposal_number}</p>
          </div>
          {proposal.access_token && (
            <a href={`${process.env.NEXT_PUBLIC_MAIN_SITE || "https://jktl.com.ng"}/proposal/${proposal.access_token}`} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>View Proposal</a>
          )}
        </div>

        <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 12 }}>Customer</p>
            <p style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600 }}>{proposal.customer_name}</p>
            <p style={{ fontSize: "0.78rem", color: colors.textFaint, marginTop: 2 }}>{proposal.name}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 12 }}>{proposal.status === "accepted" ? "Acceptance Details" : proposal.status === "declined" ? "Decline Details" : "Sent Details"}</p>
            {proposal.status === "accepted" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Accepted On</span><span style={{ fontSize: "0.8rem", color: colors.textMed }}>{proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "\u2014"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Accepted By</span><span style={{ fontSize: "0.8rem", color: colors.textMed }}>{proposal.accepted_by_name}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Value</span><span style={{ fontSize: "0.8rem", color: colors.primary, fontFamily: font.mono }}>{fmtN(proposal.total)}</span></div>
              </>
            )}
            {proposal.status === "declined" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Declined On</span><span style={{ fontSize: "0.8rem", color: colors.textMed }}>{proposal.declined_at ? new Date(proposal.declined_at).toLocaleString("en-NG", { day: "numeric", month: "short" }) : "\u2014"}</span></div>
                {proposal.decline_reason && <p style={{ fontSize: "0.78rem", color: colors.textMed, marginTop: 8 }}>{proposal.decline_reason}</p>}
              </>
            )}
            {proposal.status === "sent" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Sent On</span><span style={{ fontSize: "0.8rem", color: colors.textMed }}>{proposal.sent_at ? new Date(proposal.sent_at).toLocaleString("en-NG", { day: "numeric", month: "short" }) : "\u2014"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Value</span><span style={{ fontSize: "0.8rem", color: colors.primary, fontFamily: font.mono }}>{fmtN(proposal.total)}</span></div>
                <p style={{ fontSize: "0.76rem", color: colors.textFaint, marginTop: 8, fontStyle: "italic" }}>Awaiting client response</p>
              </>
            )}
          </div>
        </div>

        {proposal.status === "accepted" && (
          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 16 }}>Next Steps</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/dashboard/projects/new?proposalId=${proposal.id}${proposal.customer_id ? `&customerId=${proposal.customer_id}` : ""}${proposal.opportunity_id ? `&opportunityId=${proposal.opportunity_id}` : ""}`}
                style={{ padding: "8px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.76rem", textDecoration: "none" }}>Create Project</Link>
              {["Create Invoice", "Receive Payment", "Project Kickoff"].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: colors.textFaint }}>&rarr;</span>
                  <div style={{ padding: "8px 14px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, fontSize: "0.76rem", color: colors.textMed }}>{s}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.72rem", color: colors.textFaint, marginTop: 14 }}>Invoicing isn&apos;t built yet (Batch 12, Finance) &mdash; those steps are shown for reference. &quot;Create Project&quot; is real and will pre-fill from this proposal.</p>
          </div>
        )}
      </div>
    );
  }

  // ---- Draft wizard (Steps 2-4) ----
  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 900 }}>
      <Link href="/dashboard/proposals/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Proposals</Link>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: "14px 0 6px" }}>{proposal.name}</h1>
      <p style={{ fontSize: "0.78rem", color: colors.textFaint, marginBottom: 16, fontFamily: font.mono }}>{proposal.proposal_number} &middot; {proposal.customer_name}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, overflowX: "auto" }}>
        {[[1, "Details"], [2, "Offerings"], [3, "Pricing"], [4, "Terms"], [5, "Review"]].map(([n, label]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => typeof n === "number" && n >= 2 && n <= 4 && setStep(n as 2 | 3 | 4)} style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, border: "none", cursor: n === 1 || n === 5 ? "default" : "pointer", background: step === n ? colors.primary : n === 1 ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)", color: step === n ? colors.primaryText : n === 1 ? colors.success : colors.textFaint }}>{n === 1 ? "\u2713" : n}</button>
            <span style={{ fontSize: "0.72rem", color: step === n ? colors.primary : colors.textFaint, fontWeight: step === n ? 700 : 400, whiteSpace: "nowrap" }}>{label}</span>
            {Number(n) < 5 && <div style={{ width: 16, height: 1, background: colors.border }} />}
          </div>
        ))}
      </div>

      {step === 2 && (
        <div>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: 4 }}>Step 2: Add Offerings</p>
          <div className="prop-step2-layout" style={{ display: "flex", gap: 16 }}>
            <div className="prop-step2-catalog" style={{ flex: 1, ...cardStyle }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: `1px solid ${colors.border}` }}>
                {(["catalog", "custom", "used"] as const).map(t => (
                  <button key={t} onClick={() => setCatalogTab(t)} style={{ padding: "8px 12px", background: "none", border: "none", borderBottom: catalogTab === t ? `2px solid ${colors.primary}` : "2px solid transparent", color: catalogTab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>{t === "catalog" ? "Catalog" : t === "custom" ? "Custom Item" : "Previously Used"}</button>
                ))}
              </div>

              {catalogTab === "catalog" && (
                <>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offerings..." style={{ ...inputStyle, marginBottom: 12 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
                    {catalog.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((c, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
                        <div>
                          <p style={{ fontSize: "0.8rem", color: "#fff" }}>{c.name}</p>
                          <p style={{ fontSize: "0.66rem", color: colors.textFaint }}>{c.category} &middot; {c.type} {c.basePrice > 0 && <>&middot; {fmtN(c.basePrice)}</>}</p>
                        </div>
                        <button onClick={() => addItem(c)} style={{ padding: "5px 12px", borderRadius: 6, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.7rem", cursor: "pointer" }}>Add</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {catalogTab === "custom" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={customItem.name} onChange={e => setCustomItem(c => ({ ...c, name: e.target.value }))} placeholder="Item name" style={inputStyle} />
                  <input type="number" value={customItem.price} onChange={e => setCustomItem(c => ({ ...c, price: e.target.value }))} placeholder="Price (\u20a6)" style={inputStyle} />
                  <button onClick={addCustomItem} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Add Item</button>
                </div>
              )}
              {catalogTab === "used" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
                  {previouslyUsed.length === 0 ? <p style={{ fontSize: "0.78rem", color: colors.textFaint, fontStyle: "italic" }}>No previously used items yet</p> : previouslyUsed.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
                      <p style={{ fontSize: "0.8rem", color: "#fff" }}>{c.name} <span style={{ color: colors.textFaint, fontSize: "0.7rem" }}>({fmtN(c.basePrice)})</span></p>
                      <button onClick={() => addItem(c)} style={{ padding: "5px 12px", borderRadius: 6, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.7rem", cursor: "pointer" }}>Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="prop-step2-selected" style={{ width: 260, flexShrink: 0, ...cardStyle }}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem", marginBottom: 12 }}>Selected Items ({lineItems.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {lineItems.length === 0 ? <p style={{ fontSize: "0.76rem", color: colors.textFaint, fontStyle: "italic" }}>None yet</p> : lineItems.map((li, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><p style={{ fontSize: "0.78rem", color: "#fff" }}>{li.name}</p><p style={{ fontSize: "0.7rem", color: colors.textFaint }}>{fmtN(li.unitPrice)}</p></div>
                    <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: "0.9rem" }}>&times;</button>
                  </div>
                ))}
              </div>
              <p style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#fff", borderTop: `1px solid ${colors.border}`, paddingTop: 10, marginBottom: 14 }}>
                <span>Subtotal</span><span>{fmtN(subtotal)}</span>
              </p>
              <button onClick={() => saveAndGo({ lineItems, taxPct }, 3)} disabled={saving || lineItems.length === 0} style={{ width: "100%", padding: "9px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", opacity: lineItems.length === 0 ? 0.5 : 1 }}>Next: Pricing &rarr;</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: 16 }}>Step 3: Pricing &amp; Customization</p>
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Item", "Unit Price", "Qty", "Discount %", "Total"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {lineItems.map((li, i) => {
                  const total = Number(li.unitPrice) * Number(li.qty) * (1 - (Number(li.discountPct) || 0) / 100);
                  return (
                    <tr key={i}>
                      <td style={{ padding: "6px 8px", fontSize: "0.8rem", color: "#fff", borderBottom: `1px solid ${colors.border}` }}>{li.name}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${colors.border}` }}><input type="number" value={li.unitPrice} onChange={e => updateItem(i, { unitPrice: Number(e.target.value) })} style={{ ...inputStyle, width: 100, padding: "5px 8px" }} /></td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${colors.border}` }}><input type="number" min="1" value={li.qty} onChange={e => updateItem(i, { qty: Number(e.target.value) })} style={{ ...inputStyle, width: 60, padding: "5px 8px" }} /></td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${colors.border}` }}><input type="number" min="0" max="100" value={li.discountPct} onChange={e => updateItem(i, { discountPct: Number(e.target.value) })} style={{ ...inputStyle, width: 60, padding: "5px 8px" }} /></td>
                      <td style={{ padding: "6px 8px", fontSize: "0.8rem", color: colors.textMed, fontFamily: font.mono, borderBottom: `1px solid ${colors.border}` }}>{fmtN(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div style={{ width: 240 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.8rem", color: colors.textMed }}><span>Subtotal</span><span>{fmtN(subtotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.8rem", color: colors.textMed }}><span>Discount</span><span>-{fmtN(discountTotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: "0.8rem", color: colors.textMed }}><span>Tax (%)</span><input type="number" min="0" max="100" value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} style={{ ...inputStyle, width: 60, padding: "4px 8px" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: "0.9rem", fontWeight: 700, color: "#fff", borderTop: `1px solid ${colors.border}`, marginTop: 4 }}><span>Total</span><span>{fmtN(grandTotal)}</span></div>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 6 }}>Add Note (visible to client)</p>
            <textarea value={clientNote} onChange={e => setClientNote(e.target.value)} placeholder="e.g. This proposal includes a corporate website with up to 5 pages." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ padding: "9px 16px", borderRadius: 7, background: "none", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>&larr; Back</button>
            <button onClick={() => saveAndGo({ lineItems, taxPct, clientNote }, 4)} disabled={saving} style={{ padding: "9px 18px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Next: Terms &amp; Deliverables &rarr;</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: 16 }}>Step 4: Terms, Deliverables &amp; Timeline</p>
          <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: colors.textMed, marginBottom: 10 }}>Deliverables</p>
              {deliverables.map((d, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: colors.textMed, marginBottom: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={d.checked} onChange={() => toggleDeliverable(i)} style={{ accentColor: colors.primary, width: 14, height: 14 }} />{d.label}
                </label>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={newDeliverable} onChange={e => setNewDeliverable(e.target.value)} placeholder="Add deliverable" style={{ ...inputStyle, padding: "6px 10px" }} />
                <button onClick={addDeliverable} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.border}`, color: colors.textMed, fontSize: "0.74rem", cursor: "pointer" }}>+ Add</button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: colors.textMed, marginBottom: 10 }}>Project Timeline</p>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: "0.68rem", color: colors.textFaint }}>Estimated Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></div>
              <div><label style={{ fontSize: "0.68rem", color: colors.textFaint }}>Estimated Duration (weeks)</label><input type="number" min="1" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} style={inputStyle} /></div>
            </div>
          </div>
          <div className="prop-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div><label style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 6, display: "block" }}>Payment Terms</label><input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={inputStyle} /></div>
            <div><label style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 6, display: "block" }}>Maintenance / Support</label><input value={maintenanceTerms} onChange={e => setMaintenanceTerms(e.target.value)} placeholder="e.g. 1 Year Maintenance (\u20a6100,000/year)" style={inputStyle} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(3)} style={{ padding: "9px 16px", borderRadius: 7, background: "none", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>&larr; Back</button>
            <button
              onClick={() => {
                const start = startDate ? new Date(startDate) : null;
                const end = start && durationWeeks ? new Date(start.getTime() + Number(durationWeeks) * 7 * 86400000) : null;
                saveAndGo({ deliverables, start_date: startDate || null, duration_weeks: Number(durationWeeks) || null, end_date: end ? end.toISOString().slice(0, 10) : null, payment_terms: paymentTerms, maintenance_terms: maintenanceTerms }, "review");
              }}
              disabled={saving} style={{ padding: "9px 18px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
              Next: Review &rarr;
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .prop-2col { grid-template-columns: 1fr !important; }
          .prop-step2-layout { flex-direction: column !important; }
          .prop-step2-selected { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
