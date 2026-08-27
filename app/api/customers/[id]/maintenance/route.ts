import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { computeHostingRenewal } from "@/lib/renewals";

export const dynamic = "force-dynamic";

// GET /api/customers/[id]/maintenance -- Sheet 10. Computed from real
// organisations linked to this customer via lib/renewals.ts (shared with the
// global renewals view at /dashboard/clients/renewals -- same math, one place).
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
    const items = orgs
      .map((o: { product: string; plan: string; monthly_fee: string; activated_at: string | null; status: string }) => {
        const renewal = computeHostingRenewal(o);
        if (!renewal) return null;
        return { service: o.product, plan: o.plan, renewalDate: renewal.renewalDate, amountPerYear: renewal.amountPerYear, status: o.status };
      })
      .filter(Boolean);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ items: [], error: String(err) }, { status: 500 });
  }
}
