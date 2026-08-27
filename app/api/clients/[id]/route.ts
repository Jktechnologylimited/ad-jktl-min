import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Deliberately excludes `subdomain` and `product`: subdomain is the live
// hostname-resolution key for this tenant's multi-tenant routing (Option C --
// see JKTL_CODEBASE_MAP.md), and product determines which schema/branding
// the tenant's own database was provisioned with. Editing either here
// wouldn't re-provision anything, it would just create a mismatch between
// this record and the tenant's real, live infrastructure -- too dangerous
// for a plain text field with no safeguards.
const EDITABLE_FIELDS = [
  "org_name", "owner_name", "owner_email", "owner_phone", "address", "custom_domain", "brand_color",
  "plan", "setup_fee", "monthly_fee", "status", "notes", "domain_registrar", "domain_expiry_date",
] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const rows = await sql`SELECT * FROM organisations WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json({ org: rows[0] });
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
      if (field in b) { vals.push(b[field] === "" ? null : b[field]); sets.push(`${field} = $${vals.length}`); }
    }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    vals.push(id);
    await sql.query(`UPDATE organisations SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
