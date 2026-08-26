import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { itemId } = await params;
  const b = await req.json();
  if (!b.status) return NextResponse.json({ error: "Status is required" }, { status: 400 });
  await sql`UPDATE project_handover_items SET status = ${b.status} WHERE id = ${itemId}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { itemId } = await params;
  await sql`DELETE FROM project_handover_items WHERE id = ${itemId}`;
  return NextResponse.json({ ok: true });
}
