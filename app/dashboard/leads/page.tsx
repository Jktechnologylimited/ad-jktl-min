"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import KpiCard from "@/components/widgets/KpiCard";
import ListWidget, { ListWidgetItem } from "@/components/widgets/ListWidget";
import DonutChart, { DonutSlice } from "@/components/widgets/DonutChart";

function pct(now: number, prev: number): number | undefined {
  if (!prev) return undefined;
  return Math.round(((now - prev) / prev) * 100);
}
function timeAgo(d: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

const STATUS_COLOR: Record<string, string> = { new: "#60A5FA", contacted: "#C9A84C", qualified: "#A78BFA", proposal: "#F59E0B", converted: "#34D399" };
const STATUS_ORDER = ["new", "contacted", "qualified", "proposal", "converted"];
const ACTIVITY_ICON: Record<string, string> = { created: "NW", email: "EM", call: "CL", status_change: "ST", note: "NT", meeting: "MT", task: "TK" };

interface Stats {
  leads: { current_count: number; previous_count: number; total: number };
  leadsBySource: { source: string; count: number }[];
  funnel: { status: string; count: string }[];
  topOwners: { id: string; name: string; lead_count: string }[];
  recentActivity: { id: string; type: string; title: string; body: string; created_at: string; business_name: string; first_name: string; last_name: string; actor_name: string }[];
  contacted: number;
  converted: number;
}

export default function LeadsOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads/stats").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  const leadsTrend = pct(data.leads.current_count, data.leads.previous_count);
  const funnelMap = Object.fromEntries((data.funnel || []).map(f => [f.status, Number(f.count)]));

  const activityItems: ListWidgetItem[] = (data.recentActivity || []).map(a => ({
    id: a.id,
    primary: `${a.title}${a.business_name ? ` \u2013 ${a.business_name}` : ""}`,
    secondary: a.actor_name ? `by ${a.actor_name}` : undefined,
    meta: timeAgo(a.created_at),
    iconLabel: ACTIVITY_ICON[a.type] || "??",
    iconColor: colors.primary,
    href: undefined,
  }));

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Leads Overview</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>CRM &rarr; Leads</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/leads/all" style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>View All Leads</Link>
          <Link href="/dashboard/leads/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Lead</Link>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total Leads" value={data.leads.total} />
        <KpiCard label="New Leads (7 days)" value={data.leads.current_count} trendPct={leadsTrend} trendLabel="vs prior week" accent="#60A5FA" />
        <KpiCard label="Contacted" value={data.contacted} accent="#C9A84C" />
        <KpiCard label="Converted" value={data.converted} accent="#34D399" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Leads by Source</p>
          <DonutChart slices={(data.leadsBySource || []).map((s, i): DonutSlice => ({ label: s.source, value: Number(s.count), color: ["#60A5FA", "#C9A84C", "#A78BFA", "#34D399", "#F87171"][i % 5] }))} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Leads by Status</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STATUS_ORDER.map(st => {
              const count = funnelMap[st] || 0;
              const max = Math.max(...STATUS_ORDER.map(s => funnelMap[s] || 0), 1);
              return (
                <div key={st}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.8rem", color: colors.textMed, textTransform: "capitalize" }}>{st}</span>
                    <span style={{ fontSize: "0.78rem", color: "#fff", fontFamily: font.mono, fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: STATUS_COLOR[st], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity + Top BDRs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <ListWidget title="Recent Lead Activities" items={activityItems} emptyLabel="No activity yet" viewAllHref="/dashboard/leads/all" />
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 14 }}>Top Owners (This Week)</p>
          {(data.topOwners || []).length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No leads assigned this week</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.topOwners.map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6 }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{o.name}</span>
                  <span style={{ fontSize: "0.76rem", color: colors.textFaint, fontFamily: font.mono }}>{o.lead_count} leads</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
