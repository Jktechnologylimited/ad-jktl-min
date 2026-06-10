import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ affiliates: [], payouts: [] });

  const { sql } = await import("@/lib/db");
  const type = req.nextUrl.searchParams.get("type");
  const status = req.nextUrl.searchParams.get("status") || "pending";

  try {
    if (type === "payouts") {
      const payouts = await sql`
        SELECT pr.*, a.first_name, a.last_name, a.email, a.referral_code
        FROM payout_requests pr
        JOIN affiliates a ON a.id = pr.affiliate_id
        ORDER BY pr.created_at DESC LIMIT 100
      `;
      return NextResponse.json({ payouts });
    }

    const affiliates = await sql`
      SELECT a.*,
        COUNT(DISTINCT rc.id) as total_clicks,
        COUNT(DISTINCT rl.id) as total_leads
      FROM affiliates a
      LEFT JOIN referral_clicks rc ON rc.affiliate_id = a.id
      LEFT JOIN referral_leads  rl ON rl.affiliate_id = a.id
      WHERE a.status = ${status}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `;
    return NextResponse.json({ affiliates });
  } catch (err) {
    return NextResponse.json({ affiliates: [], error: String(err) });
  }
}
