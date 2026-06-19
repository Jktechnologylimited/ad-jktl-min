import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { product, plan, orgName, ownerName, ownerEmail, ownerPhone, subdomain, setupFee, monthlyFee, address, notes } = await req.json();
    if (!product || !orgName || !ownerEmail || !subdomain) {
      return NextResponse.json({ error: "product, orgName, ownerEmail and subdomain are required" }, { status: 400 });
    }
    const { sql } = await import("@/lib/db");
    const existing = await sql`SELECT id FROM organisations WHERE subdomain = ${subdomain} LIMIT 1`;
    if (existing.length > 0) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });
    const rows = await sql`
      INSERT INTO organisations (product, plan, setup_fee, monthly_fee, org_name, owner_name, owner_email, owner_phone, subdomain, address, status, activated_at, notes)
      VALUES (${product}, ${plan||"pro"}, ${Number(setupFee)||0}, ${Number(monthlyFee)||0}, ${orgName}, ${ownerName||""}, ${ownerEmail.toLowerCase()}, ${ownerPhone||""}, ${subdomain.toLowerCase()}, ${address||""}, 'active', NOW(), ${notes||""})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
