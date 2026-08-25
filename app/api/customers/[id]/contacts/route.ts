import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ contacts: [] });
  const { id } = await params;
  const contacts = await sql`SELECT * FROM customer_contacts WHERE customer_id = ${id} ORDER BY is_primary DESC, created_at ASC`;
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO customer_contacts (customer_id, name, position, email, phone)
      VALUES (${id}, ${name}, ${b.position || null}, ${b.email || null}, ${b.phone || null})
      RETURNING id
    `;
    await sql`INSERT INTO lead_activities (customer_id, type, title, actor_staff_id) VALUES (${id}, 'note', ${`Contact added: ${name}`}, ${session.staffId || null})`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
