"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";
import { productMeta } from "@/lib/products";
import KpiCard from "@/components/widgets/KpiCard";
import ListWidget, { ListWidgetItem } from "@/components/widgets/ListWidget";
import ProgressBar from "@/components/widgets/ProgressBar";
import BarChart from "@/components/widgets/BarChart";
import TableWidget, { TableColumn } from "@/components/widgets/TableWidget";
import PendingModuleCard from "@/components/widgets/PendingModuleCard";
import DateRangePicker, { DateRange, defaultRange } from "@/components/ui/DateRangePicker";

function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function timeAgo(d: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

interface Summary {
  orgs: { active: number; pending: number; total: number; byProduct: { product: string; count: string }[] };
  mrr: number;
  mrrByProduct: { product: string; mrr: string; active_count: string }[];
  recentSignups: Record<string, unknown>[];
  affiliates: { pending: number; active: number; total: number };
  pendingPayouts: { id: string; first_name: string; last_name: string; amount: string; created_at: string }[];
  pendingPayoutCount: number;
  leads: { current_count: number; previous_count: number; total: number };
  leadsBySource: { source: string; count: number }[];
  staff: { active: number; total: number };
}
interface ActivityItem { id: string; type: string; label: string; meta: string; created_at: string; }
interface TaskItem { id: string; title: string; staff_name?: string; due_date?: string; status: string; }
interface PendingAffiliate { id: string; first_name: string; last_name: string; created_at: string; }

function pct(now: number, prev: number): number | undefined {
  if (!prev) return undefined;
  return Math.round(((now - prev) / prev) * 100);
}

const ACTIVITY_META: Record<string, { icon: string; color: string; verb: string }> = {
  signup: { icon: "OR", color: "#60A5FA", verb: "signed up" },
  inquiry: { icon: "IQ", color: "#C9A84C", verb: "submitted an inquiry" },
  payout: { icon: "PO", color: "#F87171", verb: "requested a payout" },
  affiliate: { icon: "AF", color: "#A78BFA", verb: "applied as an affiliate" },
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [months, setMonths] = useState<{ month: string; monthly_revenue: string; new_clients: string }[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pendingAffiliates, setPendingAffiliates] = useState<PendingAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [range, setRange] = useState<DateRange>(defaultRange());

  const loadOwnerData = useCallback((r: DateRange) => {
    const qs = `?from=${r.from}&to=${r.to}`;
    Promise.all([
      fetch(`/api/analytics/summary${qs}`).then(res => res.json()),
      fetch("/api/analytics/monthly").then(res => res.json()).catch(() => ({ months: [] })),
      fetch(`/api/activity${qs}`).then(res => res.json()).catch(() => ({ items: [] })),
      fetch("/api/tasks").then(res => res.json()).catch(() => ({ tasks: [] })),
      fetch("/api/affiliates/list").then(res => res.json()).catch(() => ({ affiliates: [] })),
    ]).then(([summary, monthly, act, tsk, aff]) => {
      setData(summary);
      setMonths(monthly.months || []);
      setActivity(act.items || []);
      setTasks((tsk.tasks || []).filter((t: TaskItem) => t.status !== "done").slice(0, 6));
      setPendingAffiliates((aff.affiliates || []).slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(m => {
      setRole(m.role || null);
      setName(m.name || "");
      if (m.role === "owner") loadOwnerData(range);
      else setLoading(false);
    }).catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRangeChange(r: DateRange) {
    setRange(r);
    setLoading(true);
    loadOwnerData(r);
  }

  if (!loading && role && role !== "owner") return (
    <div style={{ padding: "clamp(20px,4vw,40px)", fontFamily: font.sans, maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Welcome{name ? `, ${name.split(" ")[0]}` : ""}</h1>
      <p style={{ fontSize: "0.88rem", color: colors.textLow, marginBottom: 24, lineHeight: 1.6 }}>Here&apos;s where you work from. Check your tasks and targets, and follow up on incoming inquiries.</p>
      <div style={{ display: "grid", gap: 12 }}>
        <Link href="/dashboard/my-work" style={{ textDecoration: "none", padding: "18px 20px", borderRadius: 12, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: colors.primary }}>My Work &rarr;</p>
          <p style={{ fontSize: "0.8rem", color: colors.textLow }}>Your tasks and targets</p>
        </Link>
        <Link href="/dashboard/leads/all" style={{ textDecoration: "none", padding: "18px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Leads &rarr;</p>
          <p style={{ fontSize: "0.8rem", color: colors.textLow }}>Incoming leads to follow up</p>
        </Link>
      </div>
    </div>
  );

  if (loading && !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid rgba(201,168,76,0.2)", borderTop: "2px solid #C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: "0.82rem", color: colors.textFaint, fontFamily: font.sans }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ padding: "32px", fontFamily: font.sans }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "40px 32px", textAlign: "center", maxWidth: 440, margin: "0 auto" }}>
        <p style={{ fontWeight: 700, color: "#fff", marginBottom: 8 }}>No database connected</p>
        <p style={{ fontSize: "0.85rem", color: colors.textFaint, marginBottom: 20 }}>Add DATABASE_URL to .env.local to see live data.</p>
      </div>
    </div>
  );

  // Revenue trend: this month's new monthly_revenue signed up vs last month's (real, from getRevenueByMonth).
  const revTrend = months.length >= 2 ? pct(Number(months[0]?.monthly_revenue || 0), Number(months[1]?.monthly_revenue || 0)) : undefined;
  const leads = data.leads || { current_count: 0, previous_count: 0, total: 0 };
  const leadsTrend = pct(leads.current_count, leads.previous_count);

  const activityItems: ListWidgetItem[] = activity.map(a => {
    const m = ACTIVITY_META[a.type] || { icon: "??", color: colors.textFaint, verb: "" };
    return { id: a.id, primary: `${a.label} ${m.verb}`, secondary: a.meta, meta: timeAgo(a.created_at), iconLabel: m.icon, iconColor: m.color };
  });

  const taskItems: ListWidgetItem[] = tasks.map(t => ({
    id: t.id, primary: t.title, secondary: t.staff_name ? `Assigned to ${t.staff_name}` : undefined,
    meta: t.due_date ? new Date(t.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "No due date",
  }));

  const alerts: ListWidgetItem[] = [
    ...(data.pendingPayoutCount > 0 ? [{ id: "a1", primary: `${data.pendingPayoutCount} payout${data.pendingPayoutCount === 1 ? "" : "s"} awaiting review`, href: "/dashboard/payouts", badge: { label: "ACTION", color: colors.danger } }] : []),
    ...(data.affiliates.pending > 0 ? [{ id: "a2", primary: `${data.affiliates.pending} affiliate application${data.affiliates.pending === 1 ? "" : "s"} pending`, href: "/dashboard/affiliates", badge: { label: "ACTION", color: colors.warning } }] : []),
    ...(data.orgs.pending > 0 ? [{ id: "a3", primary: `${data.orgs.pending} organisation${data.orgs.pending === 1 ? "" : "s"} awaiting payment`, href: "/dashboard/clients", badge: { label: "INFO", color: colors.info } }] : []),
  ];

  type ApprovalRow = { id: string; item: string; type: string; from: string; date: string; href: string };
  const approvalRows: ApprovalRow[] = [
    ...data.pendingPayouts.map(p => ({ id: "p-" + p.id, item: `Payout \u2013 ${fmtN(Number(p.amount))}`, type: "Payout", from: `${p.first_name} ${p.last_name}`, date: new Date(p.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" }), href: "/dashboard/payouts" })),
    ...pendingAffiliates.map(a => ({ id: "a-" + a.id, item: "Affiliate Application", type: "Affiliate", from: `${a.first_name} ${a.last_name}`, date: new Date(a.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" }), href: "/dashboard/affiliates" })),
  ];
  const approvalCols: TableColumn<ApprovalRow>[] = [
    { key: "item", label: "Item" }, { key: "type", label: "Type" }, { key: "from", label: "From" }, { key: "date", label: "Date" },
    { key: "href", label: "", render: r => <Link href={r.href} style={{ fontSize: "0.7rem", fontWeight: 700, color: colors.primary, textDecoration: "none" }}>Review &rarr;</Link> },
  ];

  const quickActions = [
    { label: "Add New Lead", href: "/dashboard/leads/new" },
    { label: "Add New Opportunity", href: "/dashboard/opportunities/new" },
    { label: "All Leads", href: "/dashboard/leads/all" },
    { label: "Add New Customer", href: "/dashboard/clients/add" },
    { label: "All Clients", href: "/dashboard/clients" },
    { label: "New Support Ticket", href: "/dashboard/support" },
    { label: "Create Project", href: "/dashboard/projects" },
    { label: "Add Offering", href: "/dashboard/desk-products" },
    { label: "View Reports", href: "/dashboard/analytics" },
    { label: "Affiliates", href: "/dashboard/affiliates" },
    { label: "Payouts", href: "/dashboard/payouts" },
  ];

  const revenueChartData = [...months].reverse().map(m => ({ label: m.month.split(" ")[0], value: Number(m.monthly_revenue || 0) }));

  // Every product with active clients, sorted by MRR -- automatically
  // includes any future desk product with zero code changes.
  const offerings = data.mrrByProduct.filter(p => Number(p.active_count) > 0);

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Owner Dashboard</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>Welcome back{name ? `, ${name.split(" ")[0]}` : ""}.</p>
        </div>
        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>
      <p style={{ fontSize: "0.68rem", color: colors.textFaint, fontFamily: font.mono, marginBottom: 20 }}>
        Date range applies to New Leads and Recent Activity below. MRR and client counts are always current.
      </p>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16, opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
        <KpiCard label="Monthly Recurring Revenue" value={fmtN(data.mrr)} trendPct={revTrend} trendLabel="vs last month" sparkline={revenueChartData.map(d => d.value)} />
        <KpiCard label={`New Leads (${range.label})`} value={leads.current_count} trendPct={leadsTrend} trendLabel="vs prior period" accent="#60A5FA" />
        <KpiCard label="Active Projects" pendingBatch="Batch 07" />
        <KpiCard label="Open Tickets" pendingBatch="Batch 10" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Revenue Overview <span style={{ fontWeight: 400, color: colors.textFaint, fontSize: "0.7rem" }}>(last 12 months)</span></p>
          <BarChart data={revenueChartData} />
        </div>
        <PendingModuleCard title="Sales Pipeline (Value)" batchLabel="Batch 03/05 (CRM &amp; Proposals)" />
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 16 }}>Top Performing Offerings</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {offerings.length > 0 ? offerings.map(p => {
              const meta = productMeta(p.product);
              const mrr = Number(p.mrr);
              return (
                <ProgressBar key={p.product} label={`${meta.label} (${p.active_count} client${Number(p.active_count) === 1 ? "" : "s"})`}
                  pct={data.mrr > 0 ? Math.round((mrr / data.mrr) * 100) : 0} color={meta.color} />
              );
            }) : (
              <p style={{ fontSize: "0.78rem", color: colors.textFaint, fontStyle: "italic" }}>No recurring revenue yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity / Tasks / Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 16, opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
        <ListWidget title={`Recent Activity (${range.label})`} items={activityItems} emptyLabel="No activity in this range" />
        <ListWidget title="Upcoming Tasks / Follow-ups" items={taskItems} emptyLabel="No open tasks" viewAllHref="/dashboard/team" />
        <ListWidget title="System Alerts" items={alerts} emptyLabel="No alerts &mdash; all clear" />
      </div>

      {/* Quick Actions */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 14 }}>Quick Actions / Shortcuts</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
          {quickActions.map(a => (
            <Link key={a.href} href={a.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "14px 10px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, color: colors.textMed, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, textDecoration: "none" }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <TableWidget title="Pending Approvals" columns={approvalCols} rows={approvalRows} emptyLabel="Nothing awaiting approval" />
    </div>
  );
}
