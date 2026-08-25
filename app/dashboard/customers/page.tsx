"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import KpiCard from "@/components/widgets/KpiCard";
import DonutChart, { DonutSlice } from "@/components/widgets/DonutChart";
import BarChart from "@/components/widgets/BarChart";

function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
const STATUS_COLOR: Record<string, string> = { active: "#34D399", onboarding: "#60A5FA", inactive: "#94A3B8", prospect: "#C9A84C" };

interface Stats {
  totals: { total: number; active: number };
  byStatus: { status: string; count: string }[];
  topByRevenue: { id: string; name: string; revenue_ytd: string }[];
  recent: { id: string; name: string; created_at: string }[];
  recentActivity: { id: string; type: string; title: string; created_at: string; customer_name: string }[];
  totalBusinesses: number; totalContracts: number;
}
function timeAgo(d: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function CustomersOverviewPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/customers/stats").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>No database connected.</div>;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Customers Overview</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>Customers &rarr; Overview</p>
        </div>
        <Link href="/dashboard/customers/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ Add Customer</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total Customers" value={data.totals.total} />
        <KpiCard label="Active Customers" value={data.totals.active} accent="#34D399" />
        <KpiCard label="Total Businesses" value={data.totalBusinesses} accent="#60A5FA" />
        <KpiCard label="Contracts / Maint." value={data.totalContracts} accent="#C9A84C" />
      </div>

      <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Customers by Status</p>
          <DonutChart slices={(data.byStatus || []).map((s): DonutSlice => ({ label: s.status, value: Number(s.count), color: STATUS_COLOR[s.status] || colors.textFaint }))} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Top Customers by Revenue (YTD)</p>
          <BarChart data={(data.topByRevenue || []).map(c => ({ label: c.name.split(" ")[0], value: Number(c.revenue_ytd) }))} />
        </div>
      </div>

      <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Recent New Customers</p>
            <Link href="/dashboard/customers/all" style={{ fontSize: "0.72rem", color: colors.primary, textDecoration: "none" }}>View all customers &rarr;</Link>
          </div>
          {(data.recent || []).length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No customers yet</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.recent.map(c => (
                <Link key={c.id} href={`/dashboard/customers/${c.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, textDecoration: "none" }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: "0.76rem", color: colors.textFaint, fontFamily: font.mono }}>{new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 14 }}>Recent Activities</p>
          {(data.recentActivity || []).length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No activity yet</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.recentActivity.map(a => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px" }}>
                  <span style={{ fontSize: "0.8rem", color: colors.textMed }}>{a.title} <span style={{ color: colors.textFaint }}>({a.customer_name})</span></span>
                  <span style={{ fontSize: "0.72rem", color: colors.textFaint, fontFamily: font.mono, flexShrink: 0, marginLeft: 8 }}>{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 680px) { .cust-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
