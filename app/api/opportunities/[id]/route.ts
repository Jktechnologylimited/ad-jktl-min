import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getOpportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "name", "customer_name", "contact_name", "contact_email", "contact_phone", "industry",
  "company_size", "location", "pipeline", "probability", "estimated_value", "expected_close_date",
  "source", "owner_staff_id", "description", "tags", "products",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  return NextResponse.json({ opportunity });
}

// Stage/status/close changes go through the dedicated advance-stage/close
// endpoints (they log activities + handle side-effects) -- this PATCH is for
// direct field edits only.
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
      if (field in b) {
        vals.push((field === "tags" || field === "products") ? JSON.stringify(b[field]) : b[field]);
        sets.push(`${field} = $${vals.length}`);
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });

    sets.push(`updated_at = NOW()`);
    vals.push(id);
    await sql.query(`UPDATE opportunities SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
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
  await sql`DELETE FROM opportunities WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
