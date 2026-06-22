import { NextRequest, NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { id } = await params;
    const b = await req.json();
    if (typeof b.active === "boolean") await sql`UPDATE staff SET active = ${b.active} WHERE id = ${id}`;
    if (b.name) await sql`UPDATE staff SET name = ${String(b.name).trim()} WHERE id = ${id}`;
    if (b.phone !== undefined) await sql`UPDATE staff SET phone = ${b.phone || ""} WHERE id = ${id}`;
    if (b.password) {
      if (String(b.password).length < 8) return NextResponse.json({ error: "Password must be 8+ chars" }, { status: 400 });
      await sql`UPDATE staff SET password_hash = ${await bcrypt.hash(String(b.password), 10)} WHERE id = ${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  await sql`DELETE FROM staff WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
