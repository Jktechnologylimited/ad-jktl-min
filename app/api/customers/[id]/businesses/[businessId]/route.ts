import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; businessId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id, businessId } = await params;

  try {
    const b = await req.json();
    const fields = ["name", "industry", "employees", "website", "status", "is_primary"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const f of fields) if (f in b) { vals.push(b[f]); sets.push(`${f} = $${vals.length}`); }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    // "Primary" is mutually exclusive -- clearing the others first keeps
    // exactly one primary business per customer, matching the wireframe.
    if (b.is_primary === true) await sql`UPDATE businesses SET is_primary = false WHERE customer_id = ${id}`;
    vals.push(businessId);
    await sql.query(`UPDATE businesses SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; businessId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { businessId } = await params;
  await sql`DELETE FROM businesses WHERE id = ${businessId}`;
  return NextResponse.json({ ok: true });
}
