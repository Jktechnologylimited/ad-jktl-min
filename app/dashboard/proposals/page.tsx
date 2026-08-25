"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
const STATUS_COLOR: Record<string, string> = { draft: "#94A3B8", sent: "#60A5FA", accepted: "#34D399", declined: "#F87171" };
const STATUS_ORDER = ["draft", "sent", "accepted", "declined"];

interface Stats {
  totals: { total: number; draft: number; sent: number; accepted: number; declined: number };
  byStatus: { status: string; count: string }[];
  recent: { id: string; proposal_number: string; customer_name: string; total: string; status: string; updated_at: string }[];
  expiring_soon: number; awaiting_response: number; total_value_ytd: number; conversionRate: number;
}

export default function ProposalsOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/proposals/stats").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  const statusMap = Object.fromEntries((data.byStatus || []).map(s => [s.status, Number(s.count)]));
  const monthTotal = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Proposals Overview</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>CRM &rarr; Proposals</p>
        </div>
        <Link href="/dashboard/proposals/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Proposal</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Proposals", value: data.totals.total },
          { label: "Draft", value: data.totals.draft },
          { label: "Sent", value: data.totals.sent, accent: "#60A5FA" },
          { label: "Accepted", value: data.totals.accepted, accent: "#34D399" },
          { label: "Declined", value: data.totals.declined, accent: "#F87171" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: colors.textLow, marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: k.accent || "#fff" }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Proposal Status (This Month)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STATUS_ORDER.map(st => {
              const count = statusMap[st] || 0;
              const pct = Math.round((count / monthTotal) * 100);
              return (
                <div key={st}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.8rem", color: colors.textMed, textTransform: "capitalize" }}>{st}</span>
                    <span style={{ fontSize: "0.78rem", color: "#fff", fontFamily: font.mono, fontWeight: 700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: STATUS_COLOR[st], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Recent Proposals</p>
            <Link href="/dashboard/proposals/all" style={{ fontSize: "0.72rem", color: colors.primary, textDecoration: "none" }}>View all &rarr;</Link>
          </div>
          {(data.recent || []).length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No proposals yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.recent.map(p => (
                <Link key={p.id} href={`/dashboard/proposals/${p.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, textDecoration: "none" }}>
                  <div>
                    <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{p.proposal_number}</span>
                    <span style={{ fontSize: "0.78rem", color: colors.textFaint, marginLeft: 8 }}>{p.customer_name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[p.status] || colors.textFaint) + "20", color: STATUS_COLOR[p.status] || colors.textFaint }}>{p.status}</span>
                    <span style={{ fontSize: "0.78rem", color: colors.primary, fontFamily: font.mono }}>{fmtN(Number(p.total))}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
          <p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Expiring Soon</p>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: colors.warning }}>{data.expiring_soon}</p>
          <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 2 }}>in 7 days</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
          <p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Awaiting Response</p>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#60A5FA" }}>{data.awaiting_response}</p>
          <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 2 }}>&gt; 3 days</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
          <p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Total Value (YTD)</p>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: colors.primary }}>{fmtN(data.total_value_ytd)}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
          <p style={{ fontSize: "0.72rem", color: colors.textLow, marginBottom: 8 }}>Conversion Rate</p>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#34D399" }}>{data.conversionRate}%</p>
        </div>
      </div>
    </div>
  );
}
