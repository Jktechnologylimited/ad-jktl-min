"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Customer { id: string; name: string; primary_contact_name?: string; primary_contact_email?: string; primary_contact_phone?: string; status: string; business_count: string; created_at: string; }
const STATUS_COLOR: Record<string, string> = { active: "#34D399", onboarding: "#60A5FA", inactive: "#94A3B8", prospect: "#C9A84C" };
const STATUSES = ["active", "onboarding", "inactive", "prospect"];
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("page", String(page)); p.set("pageSize", String(pageSize));
    if (status) p.set("status", status);
    if (q) p.set("name", q);
    fetch(`/api/customers?${p.toString()}`).then(r => r.json()).then(d => { setCustomers(d.customers || []); setTotal(d.total || 0); setLoading(false); }).catch(() => setLoading(false));
  }, [page, pageSize, status, q]);

  useEffect(() => { load(); }, [load]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Customers</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>{total} customer{total === 1 ? "" : "s"} total</p>
        </div>
        <Link href="/dashboard/customers/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ Add Customer</Link>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search customers..." style={{ ...inputStyle, maxWidth: 280 }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ ...inputStyle, maxWidth: 180 }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Customer Name", "Primary Contact", "Email", "Phone", "Status", "Businesses", "Created"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem" }}>Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem", fontStyle: "italic" }}>No customers match these filters</td></tr>
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}><Link href={`/dashboard/customers/${c.id}`} style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{c.name}</Link></td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{c.primary_contact_name || "\u2014"}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{c.primary_contact_email || "\u2014"}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{c.primary_contact_phone || "\u2014"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}><span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[c.status] || colors.textFaint) + "20", color: STATUS_COLOR[c.status] || colors.textFaint }}>{c.status}</span></td>
                  <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{c.business_count}</td>
                  <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: "0.76rem", color: colors.textFaint }}>Showing {customers.length === 0 ? 0 : (page - 1) * pageSize + 1} to {(page - 1) * pageSize + customers.length} of {total} customers</span>
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
