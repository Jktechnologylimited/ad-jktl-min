import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/opportunities/activity?type= -- Sheet 5, the global Sales
// Activities feed across every opportunity (as opposed to one opportunity's
// own Activities tab).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ activities: [] });

  const type = req.nextUrl.searchParams.get("type");
  try {
    const activities = type
      ? await sql`
          SELECT a.*, s.name AS actor_name, o.name AS opportunity_name, o.customer_name
          FROM lead_activities a
          JOIN opportunities o ON o.id = a.opportunity_id
          LEFT JOIN staff s ON s.id = a.actor_staff_id
          WHERE a.opportunity_id IS NOT NULL AND a.type = ${type}
          ORDER BY a.created_at DESC LIMIT 100`
      : await sql`
          SELECT a.*, s.name AS actor_name, o.name AS opportunity_name, o.customer_name
          FROM lead_activities a
          JOIN opportunities o ON o.id = a.opportunity_id
          LEFT JOIN staff s ON s.id = a.actor_staff_id
          WHERE a.opportunity_id IS NOT NULL
          ORDER BY a.created_at DESC LIMIT 100`;
    return NextResponse.json({ activities });
  } catch (err) {
    return NextResponse.json({ activities: [], error: String(err) }, { status: 500 });
  }
}
