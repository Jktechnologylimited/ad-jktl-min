import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getLeadStatusFunnel, getTopOwnersThisWeek } from "@/lib/leads";
import { getLeadStats, getLeadsBySource } from "@/lib/db";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[leads/stats] ${label} failed:`, err); return fallback; }
}

// GET /api/leads/stats -- Sheet 1 (CRM Dashboard / Leads Overview). Each
// source is independent so one failing query doesn't blank the whole page
// (same resilience pattern as /api/analytics/summary).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  const [leadStats, bySource, funnel, topOwners, recentActivity] = await Promise.all([
    safe(() => getLeadStats(), { current_count: 0, previous_count: 0, total: 0 }, "getLeadStats"),
    safe(() => getLeadsBySource(), [], "getLeadsBySource"),
    safe(() => getLeadStatusFunnel(), [], "getLeadStatusFunnel"),
    safe(() => getTopOwnersThisWeek(), [], "getTopOwnersThisWeek"),
    safe(() => sql`
      SELECT a.id, a.type, a.title, a.body, a.created_at, l.business_name, l.first_name, l.last_name, s.name AS actor_name
      FROM lead_activities a
      JOIN service_inquiries l ON l.id = a.lead_id
      LEFT JOIN staff s ON s.id = a.actor_staff_id
      ORDER BY a.created_at DESC LIMIT 8
    `, [], "recentActivity"),
  ]);

  // "Contacted" / "Converted" counts double as real KPI-row numbers beyond the funnel breakdown.
  const contacted = funnel.find((f: any) => f.status === "contacted")?.count || 0;
  const converted = funnel.find((f: any) => f.status === "converted")?.count || 0;

  return NextResponse.json({
    leads: leadStats,
    leadsBySource: bySource,
    funnel,
    topOwners,
    recentActivity,
    contacted: Number(contacted),
    converted: Number(converted),
  });
}
