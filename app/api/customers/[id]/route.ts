import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getCustomer } from "@/lib/customers";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "name", "status", "rating", "primary_contact_name", "primary_contact_role", "primary_contact_email",
  "primary_contact_phone", "location", "owner_staff_id", "notes_internal",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const field of EDITABLE_FIELDS) {
      if (field in b) { vals.push(b[field]); sets.push(`${field} = $${vals.length}`); }
    }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    await sql.query(`UPDATE customers SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  await sql`DELETE FROM customers WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
