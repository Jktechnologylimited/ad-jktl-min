import { NextRequest, NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ staff: [] });
  const staff = await sql`SELECT id, name, email, role, phone, active, created_at FROM staff ORDER BY created_at DESC`;
  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    const email = (b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    if (!name || !email || password.length < 8) return NextResponse.json({ error: "Name, email and a password (8+ chars) are required" }, { status: 400 });
    const exists = await sql`SELECT id FROM staff WHERE email = ${email} LIMIT 1`;
    if (exists.length) return NextResponse.json({ error: "A staff member with that email already exists" }, { status: 409 });
    const hash = await bcrypt.hash(password, 10);
    const role = b.role === "owner" ? "owner" : "bdr";
    const rows = await sql`INSERT INTO staff (name, email, password_hash, role, phone) VALUES (${name}, ${email}, ${hash}, ${role}, ${b.phone || ""}) RETURNING id`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
