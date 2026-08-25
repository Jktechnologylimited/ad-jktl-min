import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/customers/[id]/maintenance -- Sheet 10. Computed from real
// organisations linked to this customer: renewal date = next anniversary of
// activation, amount/year = monthly_fee annualised. No separate
// "maintenance contracts" entity exists (or is needed) -- this is genuinely
// derivable from the subscription data Batch 02 already established.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ items: [] });
  const { id } = await params;

  try {
    const orgs = await sql`
      SELECT product, plan, monthly_fee, activated_at, status
      FROM organisations WHERE customer_id = ${id} AND status = 'active' AND monthly_fee > 0
    `;
    const now = new Date();
    const items = orgs.map((o: { product: string; plan: string; monthly_fee: string; activated_at: string | null; status: string }) => {
      const activated = o.activated_at ? new Date(o.activated_at) : now;
      const renewal = new Date(activated);
      renewal.setFullYear(now.getFullYear());
      if (renewal < now) renewal.setFullYear(now.getFullYear() + 1);
      return { service: o.product, plan: o.plan, renewalDate: renewal.toISOString().slice(0, 10), amountPerYear: Number(o.monthly_fee) * 12, status: o.status };
    });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ items: [], error: String(err) }, { status: 500 });
  }
}
