import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrgStats, getOrgCountsByProduct, getMRRByProduct, getRecentSignups, getAffiliateStats, getPendingPayouts, getLeadStats, getLeadsBySource, getActiveStaffCount } from "@/lib/db";

export const dynamic = "force-dynamic";

// Each data source is fetched independently with its own fallback, so one
// failing query degrades gracefully instead of taking the whole dashboard
// down (this endpoint powers several independent widgets).
async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[analytics/summary] ${label} failed:`, err); return fallback; }
}

// Accepts optional ?from=YYYY-MM-DD&to=YYYY-MM-DD to scope the real
// leads-trend comparison to a real date range. Everything else here is a
// current-state snapshot (MRR, org counts) and is intentionally NOT scoped
// by date -- a "real-time total" filtered by date would misrepresent it as
// a period sum, which it isn't.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  const from = req.nextUrl.searchParams.get("from") || undefined;
  const to = req.nextUrl.searchParams.get("to") || undefined;

  const [orgStats, productCounts, mrrByProduct, recentSignups, affStats, pendingPayouts, leadStats, leadsBySource, staffStats] = await Promise.all([
    safe(() => getOrgStats(), [{ active: 0, pending: 0, suspended: 0, total: 0 }], "getOrgStats"),
    safe(() => getOrgCountsByProduct(), [], "getOrgCountsByProduct"),
    safe(() => getMRRByProduct(), [], "getMRRByProduct"),
    safe(() => getRecentSignups(8), [], "getRecentSignups"),
    safe(() => getAffiliateStats(), [{ pending: 0, active: 0, total: 0 }], "getAffiliateStats"),
    safe(() => getPendingPayouts(), [], "getPendingPayouts"),
    safe(() => getLeadStats(from, to), [{ current_count: 0, previous_count: 0, total: 0 }], "getLeadStats"),
    safe(() => getLeadsBySource(), [], "getLeadsBySource"),
    safe(() => getActiveStaffCount(), { active: 0, total: 0 }, "getActiveStaffCount"),
  ]);

  const totalMrr = mrrByProduct.reduce((s: number, r: any) => s + Number(r.mrr || 0), 0);

  return NextResponse.json({
    orgs: { ...(orgStats[0] || {}), byProduct: productCounts },
    mrr: totalMrr,
    mrrByProduct,
    recentSignups,
    affiliates: affStats[0] || {},
    pendingPayouts,
    pendingPayoutCount: pendingPayouts.length,
    leads: leadStats[0] || { current_count: 0, previous_count: 0, total: 0 },
    leadsBySource,
    staff: staffStats,
    range: from && to ? { from, to } : null,
  });
}
