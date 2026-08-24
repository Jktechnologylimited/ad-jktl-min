import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getPipelineByStage, getConversionRate } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[opportunities/stats] ${label} failed:`, err); return fallback; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  const [totalsRow, byStage, conversion, topOpps] = await Promise.all([
    safe(() => sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE status = 'closed_won' AND closed_at >= DATE_TRUNC('month', NOW())) AS won_this_month,
        COALESCE(SUM(estimated_value) FILTER (WHERE status = 'open'), 0) AS pipeline_value
      FROM opportunities
    `, [{ total: 0, open: 0, won_this_month: 0, pipeline_value: 0 }], "totals"),
    safe(() => getPipelineByStage(), [], "byStage"),
    safe(() => getConversionRate(), { closed_this_month: 0, won_this_month: 0 }, "conversion"),
    safe(() => sql`SELECT id, name, customer_name, estimated_value FROM opportunities WHERE status = 'open' ORDER BY estimated_value DESC LIMIT 5`, [], "topOpps"),
  ]);
  const totals = totalsRow[0] || { total: 0, open: 0, won_this_month: 0, pipeline_value: 0 };

  const closedThisMonth = Number(conversion.closed_this_month || 0);
  const wonThisMonth = Number(conversion.won_this_month || 0);
  const conversionRate = closedThisMonth > 0 ? Math.round((wonThisMonth / closedThisMonth) * 100) : 0;

  return NextResponse.json({ totals, byStage, conversionRate, topOpportunities: topOpps });
}
