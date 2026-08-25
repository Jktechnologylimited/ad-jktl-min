import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[customers/commercial] ${label} failed:`, err); return fallback; }
}

// GET /api/customers/[id]/commercial -- Sheet 6. "Purchased Offerings" comes
// from organisations linked via customer_id (real product/subscription data,
// same fields Batch 02's MRR dashboard already reads). "Proposals / Deals"
// comes from real linked opportunities + proposals. Invoices/Payments/
// Subscriptions sub-tabs have no backing entity yet (Batch 12, Finance) --
// handled honestly in the UI, not faked here.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  const [purchasedOfferings, opportunities, proposals] = await Promise.all([
    safe(() => sql`SELECT id, product, plan, setup_fee, monthly_fee, status, activated_at, created_at FROM organisations WHERE customer_id = ${id} ORDER BY created_at DESC`, [], "organisations"),
    safe(() => sql`SELECT id, name, stage, estimated_value, status, created_at FROM opportunities WHERE customer_id = ${id} ORDER BY created_at DESC`, [], "opportunities"),
    safe(() => sql`SELECT id, proposal_number, name, total, status, sent_at, created_at FROM proposals WHERE customer_id = ${id} ORDER BY created_at DESC`, [], "proposals"),
  ]);

  return NextResponse.json({ purchasedOfferings, opportunities, proposals });
}
