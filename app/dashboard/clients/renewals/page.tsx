"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Client {
  id: string; orgName: string; product: string; plan: string; subdomain?: string; customDomain?: string; status: string;
  domainRegistrar?: string; domainExpiryDate?: string; domainDaysLeft: number | null;
  hostingRenewalDate?: string; hostingAmountPerYear: number | null; hostingDaysLeft: number | null;
  soonestDaysLeft: number | null;
}
interface Counts { domainExpiring7: number; domainExpiring30: number; hostingRenewing30: number; domainOverdue: number; hostingOverdue: number; noDomainDateSet: number; }
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"; }
function urgencyColor(days: number | null) {
  if (days === null) return colors.textFaint;
  if (days < 0) return colors.danger;
  if (days <= 7) return colors.danger;
  if (days <= 30) return colors.warning;
  return colors.success;
}
function urgencyLabel(days: number | null) {
  if (days === null) return "Not set";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  return `${days}d left`;
}
const inputStyle: React.CSSProperties = { padding: "6px 9px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.76rem", outline: "none" };

export default function RenewalsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "domain" | "hosting" | "overdue" | "unset">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ domain_registrar: "", domain_expiry_date: "" });

  function load() {
    setLoading(true); setError("");
    fetch("/api/clients/renewals").then(async r => {
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed to load renewals"); setClients([]); setCounts(null); setLoading(false); return; }
      setClients(d.clients || []);
      setCounts(d.counts || { domainExpiring7: 0, domainExpiring30: 0, hostingRenewing7: 0, hostingRenewing30: 0, domainOverdue: 0, hostingOverdue: 0, noDomainDateSet: 0 });
      setLoading(false);
    }).catch(() => { setError("Failed to load renewals"); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  function startEdit(c: Client) {
    setEditingId(c.id);
    setEditForm({ domain_registrar: c.domainRegistrar || "", domain_expiry_date: c.domainExpiryDate ? c.domainExpiryDate.slice(0, 10) : "" });
  }
  async function saveEdit(id: string) {
    await fetch(`/api/clients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditingId(null); load();
  }

  const filtered = clients.filter(c => {
    if (filter === "domain") return c.domainDaysLeft !== null && c.domainDaysLeft <= 30;
    if (filter === "hosting") return c.hostingDaysLeft !== null && c.hostingDaysLeft <= 30;
    if (filter === "overdue") return (c.domainDaysLeft !== null && c.domainDaysLeft < 0) || (c.hostingDaysLeft !== null && c.hostingDaysLeft < 0);
    if (filter === "unset") return c.status === "active" && c.customDomain && !c.domainExpiryDate;
    return true;
  });

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1300 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Renewals &amp; Expirations</h1>
        <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>Hosting/plan renewal is computed from real billing data. Domain expiry is staff-entered &mdash; no registrar is connected, so nothing here is guessed.</p>
      </div>

      {loading ? <p style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading...</p> : error ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid ${colors.danger}40`, borderRadius: 10, padding: "24px 20px", textAlign: "center" }}>
          <p style={{ color: colors.danger, fontSize: "0.85rem", fontWeight: 700, marginBottom: 4 }}>Couldn&apos;t load renewals</p>
          <p style={{ color: colors.textFaint, fontSize: "0.78rem" }}>{error}</p>
        </div>
      ) : !counts ? (
        <p style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>No database connected.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Domain expiring \u226430d", value: counts.domainExpiring30, key: "domain" as const, color: colors.warning },
              { label: "Hosting renewing \u226430d", value: counts.hostingRenewing30, key: "hosting" as const, color: "#60A5FA" },
              { label: "Overdue", value: (counts.domainOverdue || 0) + (counts.hostingOverdue || 0), key: "overdue" as const, color: colors.danger },
              { label: "No domain date set", value: counts.noDomainDateSet, key: "unset" as const, color: colors.textFaint },
            ].map(k => (
              <button key={k.key} onClick={() => setFilter(filter === k.key ? "all" : k.key)} style={{ textAlign: "left", background: filter === k.key ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${filter === k.key ? colors.primary : colors.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
                <p style={{ fontSize: "0.7rem", color: colors.textLow, marginBottom: 6 }}>{k.label}</p>
                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: k.color }}>{k.value}</p>
              </button>
            ))}
          </div>

          {filter !== "all" && <button onClick={() => setFilter("all")} style={{ marginBottom: 12, background: "none", border: "none", color: colors.primary, fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}>Clear filter &times;</button>}

          <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Client", "Product / Plan", "Domain", "Domain Expiry", "Hosting Renewal", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: colors.textFaint, fontSize: "0.82rem", fontStyle: "italic" }}>Nothing matches this filter</td></tr>
                  ) : filtered.map(c => (
                    <tr key={c.id}>
                      <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "#fff", fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>{c.orgName}</td>
                      <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}`, textTransform: "capitalize" }}>{c.product} &middot; {c.plan}</td>
                      <td style={{ padding: "10px 14px", fontSize: "0.76rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{c.customDomain || `${c.subdomain}.jktl.com.ng`}</td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}`, minWidth: 200 }}>
                        {editingId === c.id ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <input value={editForm.domain_registrar} onChange={e => setEditForm(f => ({ ...f, domain_registrar: e.target.value }))} placeholder="Registrar" style={{ ...inputStyle, width: 90 }} />
                            <input type="date" value={editForm.domain_expiry_date} onChange={e => setEditForm(f => ({ ...f, domain_expiry_date: e.target.value }))} style={inputStyle} />
                            <button onClick={() => saveEdit(c.id)} style={{ padding: "5px 10px", borderRadius: 5, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.68rem", cursor: "pointer" }}>Save</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: "5px 10px", borderRadius: 5, background: "none", border: `1px solid ${colors.border}`, color: colors.textMed, fontSize: "0.68rem", cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(c)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                            <span style={{ fontSize: "0.78rem", color: colors.textMed, fontFamily: font.mono }}>{fmtDate(c.domainExpiryDate)}</span>
                            {c.domainExpiryDate && <span style={{ display: "block", fontSize: "0.66rem", color: urgencyColor(c.domainDaysLeft), fontWeight: 700 }}>{urgencyLabel(c.domainDaysLeft)}</span>}
                            {!c.domainExpiryDate && <span style={{ display: "block", fontSize: "0.66rem", color: colors.primary }}>+ Set date</span>}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                        {c.hostingRenewalDate ? (
                          <>
                            <span style={{ fontSize: "0.78rem", color: colors.textMed, fontFamily: font.mono }}>{fmtDate(c.hostingRenewalDate)}</span>
                            <span style={{ display: "block", fontSize: "0.66rem", color: urgencyColor(c.hostingDaysLeft), fontWeight: 700 }}>{urgencyLabel(c.hostingDaysLeft)} &middot; {fmtN(c.hostingAmountPerYear || 0)}/yr</span>
                          </>
                        ) : <span style={{ fontSize: "0.76rem", color: colors.textFaint }}>No recurring fee</span>}
                      </td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}` }}>
                        <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", background: (c.status === "active" ? colors.success : colors.textFaint) + "20", color: c.status === "active" ? colors.success : colors.textFaint }}>{c.status.replace("_", " ")}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
