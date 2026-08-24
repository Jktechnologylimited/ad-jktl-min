"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import DateRangePicker, { DateRange } from "@/components/ui/DateRangePicker";

interface Opportunity {
  id: string; name: string; customer_name: string; stage: string; estimated_value: string;
  expected_close_date?: string; owner_name?: string; created_at: string;
}
interface Staff { id: string; name: string; active: boolean; }

const STAGE_COLOR: Record<string, string> = { Qualification: "#60A5FA", Proposal: "#C9A84C", Negotiation: "#A78BFA", "Closed Won": "#34D399", "Closed Lost": "#F87171" };
const STAGES = ["Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 5 };

function OpportunityListInner() {
  const searchParams = useSearchParams();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [q, setQ] = useState("");
  const [stage, setStage] = useState(searchParams.get("stage") || "");
  const [ownerId, setOwnerId] = useState("");
  const [range, setRange] = useState<DateRange | null>(null);

  useEffect(() => { fetch("/api/staff").then(r => r.json()).then(d => setStaff((d.staff || []).filter((s: Staff) => s.active))).catch(() => {}); }, []);
  useEffect(() => { if (searchParams.get("stage")) setShowFilters(true); }, [searchParams]);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("page", String(page)); p.set("pageSize", String(pageSize));
    if (stage) p.set("stage", stage);
    if (ownerId) p.set("ownerId", ownerId);
    if (range) { p.set("from", range.from); p.set("to", range.to); }
    if (q) { p.set("name", q); p.set("customer", q); }
    fetch(`/api/opportunities?${p.toString()}`).then(r => r.json()).then(d => { setOpps(d.opportunities || []); setTotal(d.total || 0); setLoading(false); }).catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, stage, ownerId, range, q]);

  useEffect(() => { load(); }, [load]);

  function clearFilters() { setStage(""); setOwnerId(""); setRange(null); setQ(""); setPage(1); }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Opportunities</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>{total} opportunit{total === 1 ? "y" : "ies"} total</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowFilters(v => !v)} style={{ padding: "9px 16px", borderRadius: 8, background: showFilters ? colors.primary : "rgba(255,255,255,0.05)", color: showFilters ? colors.primaryText : colors.textMed, border: `1.5px solid ${showFilters ? colors.primary : colors.border}`, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
            {showFilters ? "Hide Filters" : "Filter"}
          </button>
          <Link href="/dashboard/opportunities/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Opportunity</Link>
        </div>
      </div>

      <div style={{ margin: "16px 0" }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search opportunities..." style={{ ...inputStyle, maxWidth: 320 }} />
      </div>

      {showFilters && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Stage</label>
              <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }} style={inputStyle}>
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Owner</label>
              <select value={ownerId} onChange={e => { setOwnerId(e.target.value); setPage(1); }} style={inputStyle}>
                <option value="">All Owners</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date Range</label>
              <DateRangePicker value={range || { from: "", to: "", label: "Any time" }} onChange={r => { setRange(r); setPage(1); }} />
            </div>
          </div>
          <button onClick={clearFilters} style={{ padding: "8px 16px", borderRadius: 7, background: "none", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Clear Filters</button>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Opportunity Name", "Customer", "Stage", "Value", "Close Date", "Owner"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem" }}>Loading...</td></tr>
              ) : opps.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem", fontStyle: "italic" }}>No opportunities match these filters</td></tr>
              ) : opps.map(o => (
                <tr key={o.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                    <Link href={`/dashboard/opportunities/${o.id}`} style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{o.name}</Link>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{o.customer_name}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: (STAGE_COLOR[o.stage] || colors.textFaint) + "20", color: STAGE_COLOR[o.stage] || colors.textFaint }}>{o.stage}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtN(Number(o.estimated_value))}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{o.expected_close_date ? new Date(o.expected_close_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{o.owner_name || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: "0.76rem", color: colors.textFaint }}>
            Showing {opps.length === 0 ? 0 : (page - 1) * pageSize + 1} to {(page - 1) * pageSize + opps.length} of {total} opportunities
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 10px", borderRadius: 6, background: "none", border: `1px solid ${colors.border}`, color: page <= 1 ? colors.textFaint : colors.textMed, cursor: page <= 1 ? "default" : "pointer", fontSize: "0.76rem" }}>&lsaquo;</button>
            <span style={{ fontSize: "0.76rem", color: colors.textMed, fontFamily: font.mono }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 10px", borderRadius: 6, background: "none", border: `1px solid ${colors.border}`, color: page >= totalPages ? colors.textFaint : colors.textMed, cursor: page >= totalPages ? "default" : "pointer", fontSize: "0.76rem" }}>&rsaquo;</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpportunityListPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>}><OpportunityListInner /></Suspense>;
}
