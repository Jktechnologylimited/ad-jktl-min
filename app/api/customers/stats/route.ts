import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[customers/stats] ${label} failed:`, err); return fallback; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  const [totalsRow, byStatus, topByRevenue, recent, recentActivity, businessCount, contractsRow] = await Promise.all([
    safe(() => sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active FROM customers`, [{ total: 0, active: 0 }], "totals"),
    safe(() => sql`SELECT status, COUNT(*) AS count FROM customers GROUP BY status`, [], "byStatus"),
    safe(() => sql`
      SELECT c.id, c.name, COALESCE(SUM(o.monthly_fee) * 12, 0) AS revenue_ytd
      FROM customers c LEFT JOIN organisations o ON o.customer_id = c.id AND o.status = 'active'
      GROUP BY c.id, c.name ORDER BY revenue_ytd DESC LIMIT 5
    `, [], "topByRevenue"),
    safe(() => sql`SELECT id, name, created_at FROM customers ORDER BY created_at DESC LIMIT 4`, [], "recent"),
    safe(() => sql`
      SELECT a.id, a.type, a.title, a.created_at, c.name AS customer_name
      FROM lead_activities a JOIN customers c ON c.id = a.customer_id
      ORDER BY a.created_at DESC LIMIT 6
    `, [], "recentActivity"),
    safe(() => sql`SELECT COUNT(*) AS total FROM businesses`, [{ total: 0 }], "businessCount"),
    safe(() => sql`SELECT COUNT(*) AS total FROM organisations WHERE customer_id IS NOT NULL AND status = 'active' AND monthly_fee > 0`, [{ total: 0 }], "contracts"),
  ]);

  const totals = totalsRow[0] || { total: 0, active: 0 };
  const businesses = businessCount[0] || { total: 0 };
  const contracts = contractsRow[0] || { total: 0 };

  return NextResponse.json({ totals, byStatus, topByRevenue, recent, recentActivity, totalBusinesses: Number(businesses.total), totalContracts: Number(contracts.total) });
}
