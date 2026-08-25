import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ businesses: [] });
  const { id } = await params;
  const businesses = await sql`SELECT * FROM businesses WHERE customer_id = ${id} ORDER BY is_primary DESC, created_at ASC`;
  return NextResponse.json({ businesses });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO businesses (customer_id, name, industry, employees, website, status)
      VALUES (${id}, ${name}, ${b.industry || null}, ${b.employees || null}, ${b.website || null}, ${b.status || "active"})
      RETURNING id
    `;
    await sql`INSERT INTO lead_activities (customer_id, type, title, actor_staff_id) VALUES (${id}, 'note', ${`Business added: ${name}`}, ${session.staffId || null})`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
