"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import DateRangePicker, { DateRange } from "@/components/ui/DateRangePicker";

interface Lead {
  id: string; first_name?: string; last_name?: string; name?: string; business_name?: string;
  source: string; status: string; owner_name?: string; created_at: string;
}
interface Staff { id: string; name: string; active: boolean; }

const STATUS_COLOR: Record<string, string> = { new: "#60A5FA", contacted: "#C9A84C", qualified: "#A78BFA", proposal: "#F59E0B", converted: "#34D399" };
const STATUSES = ["new", "contacted", "qualified", "proposal", "converted"];
const SOURCES = ["website", "referral", "affiliate", "bdr", "other"];

function leadName(l: Lead) { return (l.first_name || l.last_name) ? `${l.first_name || ""} ${l.last_name || ""}`.trim() : (l.name || "Unnamed lead"); }

export default function LeadListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [range, setRange] = useState<DateRange | null>(null);
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => { fetch("/api/staff").then(r => r.json()).then(d => setStaff((d.staff || []).filter((s: Staff) => s.active))).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("page", String(page)); p.set("pageSize", String(pageSize));
    if (status) p.set("status", status);
    if (source) p.set("source", source);
    if (ownerId) p.set("ownerId", ownerId);
    if (range) { p.set("from", range.from); p.set("to", range.to); }
    if (q) p.set("name", q);
    if (company) p.set("company", company);
    if (email) p.set("email", email);
    if (phone) p.set("phone", phone);
    fetch(`/api/leads?${p.toString()}`).then(r => r.json()).then(d => { setLeads(d.leads || []); setTotal(d.total || 0); setLoading(false); }).catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, source, ownerId, range, q]);

  useEffect(() => { load(); }, [load]);

  function applyFilters() { setPage(1); load(); }
  function clearFilters() { setStatus(""); setSource(""); setOwnerId(""); setRange(null); setCompany(""); setEmail(""); setPhone(""); setQ(""); setPage(1); }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 5 };

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Leads</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>{total} lead{total === 1 ? "" : "s"} total</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowFilters(v => !v)} style={{ padding: "9px 16px", borderRadius: 8, background: showFilters ? colors.primary : "rgba(255,255,255,0.05)", color: showFilters ? colors.primaryText : colors.textMed, border: `1.5px solid ${showFilters ? colors.primary : colors.border}`, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
            {showFilters ? "Hide Filters" : "Filter"}
          </button>
          <Link href="/dashboard/leads/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Lead</Link>
        </div>
      </div>

      <div style={{ margin: "16px 0" }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search leads by name..."
          style={{ ...inputStyle, maxWidth: 320 }} />
      </div>

      {showFilters && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <select value={source} onChange={e => setSource(e.target.value)} style={inputStyle}>
                <option value="">All Sources</option>
                {SOURCES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Owner</label>
              <select value={ownerId} onChange={e => setOwnerId(e.target.value)} style={inputStyle}>
                <option value="">All Owners</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date Range</label>
              <DateRangePicker value={range || { from: "", to: "", label: "Any time" }} onChange={setRange} />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Search company..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Search email..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Search phone..." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={clearFilters} style={{ padding: "8px 16px", borderRadius: 7, background: "none", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Clear Filters</button>
            <button onClick={applyFilters} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Apply Filters</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Lead Name", "Company", "Source", "Status", "Owner", "Created"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem" }}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem", fontStyle: "italic" }}>No leads match these filters</td></tr>
              ) : leads.map(l => (
                <tr key={l.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                    <Link href={`/dashboard/leads/${l.id}`} style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{leadName(l)}</Link>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{l.business_name || "\u2014"}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}`, textTransform: "capitalize" }}>{l.source}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[l.status] || colors.textFaint) + "20", color: STATUS_COLOR[l.status] || colors.textFaint }}>{l.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{l.owner_name || "Unassigned"}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{new Date(l.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: "0.76rem", color: colors.textFaint }}>
            Showing {leads.length === 0 ? 0 : (page - 1) * pageSize + 1} to {(page - 1) * pageSize + leads.length} of {total} leads
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
