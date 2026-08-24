"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import KpiCard from "@/components/widgets/KpiCard";

function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
const STAGE_COLOR: Record<string, string> = { Qualification: "#60A5FA", Proposal: "#C9A84C", Negotiation: "#A78BFA", "Closed Won": "#34D399", "Closed Lost": "#F87171" };
const STAGE_ORDER = ["Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

interface Stats {
  totals: { total: number; open: number; won_this_month: number; pipeline_value: number };
  byStage: { stage: string; count: string; value: string }[];
  conversionRate: number;
  topOpportunities: { id: string; name: string; customer_name: string; estimated_value: string }[];
}

export default function OpportunitiesOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/opportunities/stats").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  const stageMap = Object.fromEntries((data.byStage || []).map(s => [s.stage, s]));

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Opportunities Overview</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>CRM &rarr; Opportunities</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/dashboard/opportunities/board" style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>Pipeline Board</Link>
          <Link href="/dashboard/opportunities/all" style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>View All</Link>
          <Link href="/dashboard/opportunities/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Opportunity</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total Opportunities" value={data.totals.total} />
        <KpiCard label="Open Opportunities" value={data.totals.open} accent="#60A5FA" />
        <KpiCard label="Won (This Month)" value={data.totals.won_this_month} accent="#34D399" />
        <KpiCard label="Pipeline Value" value={fmtN(Number(data.totals.pipeline_value))} accent="#C9A84C" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, gridColumn: "span 2" }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Sales Pipeline (By Stage)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
            {STAGE_ORDER.map(stage => {
              const s = stageMap[stage];
              return (
                <div key={stage} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", borderTop: `3px solid ${STAGE_COLOR[stage]}` }}>
                  <p style={{ fontSize: "0.7rem", color: colors.textFaint, marginBottom: 6 }}>{stage}</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{s ? Number(s.count) : 0}</p>
                  <p style={{ fontSize: "0.72rem", color: colors.textMed, fontFamily: font.mono }}>{fmtN(s ? Number(s.value) : 0)}</p>
                  <Link href={`/dashboard/opportunities/all?stage=${encodeURIComponent(stage)}`} style={{ fontSize: "0.66rem", color: colors.primary, textDecoration: "none" }}>View all &rarr;</Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Top Opportunities (This Month)</p>
            <Link href="/dashboard/opportunities/all" style={{ fontSize: "0.72rem", color: colors.primary, textDecoration: "none" }}>View all &rarr;</Link>
          </div>
          {(data.topOpportunities || []).length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No open opportunities yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.topOpportunities.map(o => (
                <Link key={o.id} href={`/dashboard/opportunities/${o.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, textDecoration: "none" }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{o.name}</span>
                  <span style={{ fontSize: "0.78rem", color: colors.primary, fontFamily: font.mono }}>{fmtN(Number(o.estimated_value))}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, textAlign: "center" }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16, textAlign: "left" }}>Conversion Rate</p>
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={colors.primary} strokeWidth="14"
                strokeDasharray={`${(data.conversionRate / 100) * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>{data.conversionRate}%</span>
            </div>
          </div>
          <p style={{ fontSize: "0.74rem", color: colors.textFaint, marginTop: 12 }}>of this month&apos;s closed opportunities won</p>
        </div>
      </div>
    </div>
  );
}
