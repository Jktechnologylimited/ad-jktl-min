import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[proposals/stats] ${label} failed:`, err); return fallback; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  const [totalsRow, byStatus, recent, timing, conversion] = await Promise.all([
    safe(() => sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
        COUNT(*) FILTER (WHERE status = 'declined') AS declined
      FROM proposals
    `, [{ total: 0, draft: 0, sent: 0, accepted: 0, declined: 0 }], "totals"),
    safe(() => sql`SELECT status, COUNT(*) AS count FROM proposals WHERE created_at >= DATE_TRUNC('month', NOW()) GROUP BY status`, [], "byStatus"),
    safe(() => sql`SELECT id, proposal_number, customer_name, total, status, updated_at FROM proposals ORDER BY updated_at DESC LIMIT 5`, [], "recent"),
    safe(() => sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'sent' AND valid_until IS NOT NULL AND valid_until <= NOW() + INTERVAL '7 days' AND valid_until >= NOW()) AS expiring_soon,
        COUNT(*) FILTER (WHERE status = 'sent' AND sent_at <= NOW() - INTERVAL '3 days') AS awaiting_response,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('year', NOW())), 0) AS total_value_ytd
      FROM proposals
    `, [{ expiring_soon: 0, awaiting_response: 0, total_value_ytd: 0 }], "timing"),
    safe(() => sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('accepted', 'declined')) AS closed,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted
      FROM proposals
    `, [{ closed: 0, accepted: 0 }], "conversion"),
  ]);

  const totals = totalsRow[0] || { total: 0, draft: 0, sent: 0, accepted: 0, declined: 0 };
  const timingRow = timing[0] || { expiring_soon: 0, awaiting_response: 0, total_value_ytd: 0 };
  const convRow = conversion[0] || { closed: 0, accepted: 0 };
  const conversionRate = Number(convRow.closed) > 0 ? Math.round((Number(convRow.accepted) / Number(convRow.closed)) * 100) : 0;

  return NextResponse.json({ totals, byStatus, recent, ...timingRow, conversionRate });
}
