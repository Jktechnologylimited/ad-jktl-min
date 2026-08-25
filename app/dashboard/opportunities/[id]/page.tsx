"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Opportunity {
  id: string; name: string; customer_id?: string; customer_name: string; contact_name?: string; contact_email?: string; contact_phone?: string;
  industry?: string; company_size?: string; location?: string; pipeline: string; stage: string; probability?: number;
  estimated_value: string; expected_close_date?: string; source?: string; owner_name?: string; description?: string;
  tags?: string[]; products?: { id: string; name: string; type: string }[]; status: string; project_requested?: boolean; created_at: string; updated_at: string;
}
interface Activity { id: string; type: string; title: string; body?: string; actor_name?: string; created_at: string; }
interface CatalogItem { id: string; name: string; type: "desk_product" | "agency_service"; }

const STAGE_COLOR: Record<string, string> = { Qualification: "#60A5FA", Proposal: "#C9A84C", Negotiation: "#A78BFA", "Closed Won": "#34D399", "Closed Lost": "#F87171" };
const TABS = ["Overview", "Activities", "Products / Services", "Notes", "Files", "Related"] as const;
const ACTIVITY_ICON: Record<string, string> = { created: "NW", email: "EM", call: "CL", status_change: "ST", note: "NT", meeting: "MT", task: "TK" };
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function timeAgo(d: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 };

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/opportunities/${id}`).then(r => r.json()),
      fetch(`/api/opportunities/${id}/activities`).then(r => r.json()),
      fetch("/api/desk-products").then(r => r.json()).catch(() => ({ products: [] })),
      fetch("/api/agency-services").then(r => r.json()).catch(() => ({ services: [] })),
    ]).then(([o, a, dp, as_]) => {
      setOpp(o.opportunity || null);
      setActivities(a.activities || []);
      const products: CatalogItem[] = (dp.products || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name, type: "desk_product" as const }));
      const services: CatalogItem[] = (as_.services || []).map((s: { id: string; label: string }) => ({ id: s.id, name: s.label, type: "agency_service" as const }));
      setCatalog([...products, ...services]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function addNote() {
    if (!note.trim()) return;
    await fetch(`/api/opportunities/${id}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "note", title: "Note added", body: note.trim() }) });
    setNote("");
    load();
  }

  async function toggleProduct(item: CatalogItem) {
    if (!opp) return;
    const current = opp.products || [];
    const exists = current.some(p => p.id === item.id);
    const next = exists ? current.filter(p => p.id !== item.id) : [...current, item];
    setOpp({ ...opp, products: next });
    await fetch(`/api/opportunities/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: next }) });
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!opp) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: font.sans }}>
      <p style={{ color: colors.textFaint, marginBottom: 12 }}>Opportunity not found.</p>
      <Link href="/dashboard/opportunities/all" style={{ color: colors.primary, fontSize: "0.85rem" }}>&larr; Back to Opportunities</Link>
    </div>
  );

  const notes = activities.filter(a => a.type === "note");
  const isOpen = opp.status === "open";

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1000 }}>
      <Link href="/dashboard/opportunities/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Opportunities</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, margin: "14px 0 6px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{opp.name}</h1>
            <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px", borderRadius: 4, background: (STAGE_COLOR[opp.stage] || colors.textFaint) + "20", color: STAGE_COLOR[opp.stage] || colors.textFaint }}>{opp.stage}</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: colors.textFaint, marginTop: 4 }}>
            {opp.customer_name} {opp.contact_name && <>&middot; {opp.contact_name}</>} {opp.contact_email && <>&middot; {opp.contact_email}</>}
          </p>
          <p style={{ fontSize: "0.78rem", color: colors.textMed, marginTop: 4, fontFamily: font.mono }}>
            {fmtN(Number(opp.estimated_value))} {opp.expected_close_date && <>&middot; Expected Close: {new Date(opp.expected_close_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</>} {opp.owner_name && <>&middot; Owner: {opp.owner_name}</>}
          </p>
        </div>
        {isOpen && (
          <div style={{ display: "flex", gap: 10 }}>
            {!opp.stage.startsWith("Closed") && (
              <Link href={`/dashboard/opportunities/${id}/advance`} style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>Move to Next Stage</Link>
            )}
            <Link href={`/dashboard/opportunities/${id}/close`} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>Close Opportunity</Link>
          </div>
        )}
      </div>

      {opp.project_requested && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 16px", borderRadius: 10, background: "rgba(201,168,76,0.08)", border: `1px solid ${colors.primary}40`, marginBottom: 20 }}>
          <p style={{ fontSize: "0.82rem", color: colors.textMed }}>A project was requested when this deal was closed won.</p>
          <Link href={`/dashboard/projects/new?opportunityId=${id}${opp.customer_id ? `&customerId=${opp.customer_id}` : ""}`}
            style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.78rem", textDecoration: "none", whiteSpace: "nowrap" }}>Create Project</Link>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, margin: "16px 0 20px", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent", color: tab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Opportunity Information</p>
            {[["Stage", opp.stage], ["Pipeline", opp.pipeline], ["Probability", `${opp.probability ?? 0}%`], ["Estimated Value", fmtN(Number(opp.estimated_value))], ["Expected Close Date", opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"], ["Source", opp.source], ["Created Date", new Date(opp.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })], ["Last Modified", new Date(opp.updated_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: "0.78rem", color: colors.textFaint }}>{k}</span>
                <span style={{ fontSize: "0.8rem", color: colors.textMed }}>{v || "\u2014"}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Customer Information</p>
              {[["Company", opp.customer_name], ["Industry", opp.industry], ["Company Size", opp.company_size], ["Phone", opp.contact_phone], ["Email", opp.contact_email], ["Location", opp.location]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: "0.78rem", color: colors.textFaint }}>{k}</span>
                  <span style={{ fontSize: "0.8rem", color: colors.textMed }}>{v || "\u2014"}</span>
                </div>
              ))}
            </div>
            {opp.description && (
              <div style={cardStyle}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 8 }}>Description</p>
                <p style={{ fontSize: "0.82rem", color: colors.textMed, lineHeight: 1.6 }}>{opp.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "Activities" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 16 }}>Sales Activities</p>
          {activities.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No activity yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {activities.map(a => (
                <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.55rem", fontWeight: 700, color: colors.primary }}>{ACTIVITY_ICON[a.type] || "??"}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.83rem", fontWeight: 600, color: "#fff" }}>{a.title}</p>
                    {a.body && <p style={{ fontSize: "0.78rem", color: colors.textMed, marginTop: 2 }}>{a.body}</p>}
                    <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 3, fontFamily: font.mono }}>{timeAgo(a.created_at)}{a.actor_name ? ` by ${a.actor_name}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Products / Services" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 4 }}>Products / Services</p>
          <p style={{ fontSize: "0.76rem", color: colors.textFaint, marginBottom: 16 }}>Tag which of JKTL&apos;s offerings this opportunity is about.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
            {catalog.map(item => {
              const active = (opp.products || []).some(p => p.id === item.id);
              return (
                <button key={item.id} onClick={() => toggleProduct(item)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 7, cursor: "pointer", textAlign: "left", background: active ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? colors.primary : colors.border}` }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${active ? colors.primary : colors.textFaint}`, background: active ? colors.primary : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {active && <span style={{ color: colors.primaryText, fontSize: "0.6rem" }}>&#10003;</span>}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: active ? "#fff" : colors.textMed }}>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "Notes" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Notes</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
          <button onClick={addNote} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", marginBottom: 18 }}>Add Note</button>
          {notes.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No notes yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notes.map(n => (
                <div key={n.id} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
                  <p style={{ fontSize: "0.82rem", color: colors.textMed }}>{n.body}</p>
                  <p style={{ fontSize: "0.66rem", color: colors.textFaint, marginTop: 6, fontFamily: font.mono }}>{timeAgo(n.created_at)}{n.actor_name ? ` by ${n.actor_name}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(tab === "Files" || tab === "Related") && (
        <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "0.85rem", color: colors.textFaint }}>
            {tab === "Files" ? "File attachments aren't wired up yet in this batch." : "Related Customer & Project records will appear here once those modules land (Batch 06/07)."}
          </p>
        </div>
      )}
    </div>
  );
}
