import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrgStats, getMRR, getRecentSignups, getAffiliateStats, getPendingPayouts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  try {
    const [orgStats, mrrData, recentSignups, affStats, pendingPayouts] = await Promise.all([
      getOrgStats(),
      getMRR(),
      getRecentSignups(8),
      getAffiliateStats(),
      getPendingPayouts(),
    ]);

    return NextResponse.json({
      orgs: orgStats[0] || {},
      mrr: mrrData[0]?.mrr || 0,
      faithdeskMrr: mrrData[0]?.faithdesk_mrr || 0,
      detaildeskMrr: mrrData[0]?.detaildesk_mrr || 0,
      recentSignups,
      affiliates: affStats[0] || {},
      pendingPayouts,
      pendingPayoutCount: pendingPayouts.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
