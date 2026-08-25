import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getProposal } from "@/lib/proposals";

export const dynamic = "force-dynamic";

interface LineItem { name: string; unitPrice: number; qty: number; discountPct: number; total: number; }

// Pricing is always recomputed server-side from line_items -- never trusted
// from the client, even though the wizard's UI shows a live running total.
function computeTotals(lineItems: LineItem[], taxPct: number) {
  const subtotal = lineItems.reduce((s, li) => s + Number(li.unitPrice) * Number(li.qty), 0);
  const discountTotal = lineItems.reduce((s, li) => s + (Number(li.unitPrice) * Number(li.qty) * (Number(li.discountPct) || 0)) / 100, 0);
  const taxable = subtotal - discountTotal;
  const tax = taxable * ((Number(taxPct) || 0) / 100);
  return { subtotal, discountTotal, total: taxable + tax };
}

const DIRECT_FIELDS = [
  "name", "customer_name", "contact_name", "contact_email", "currency", "valid_until",
  "prepared_by_staff_id", "notes_internal", "client_note", "deliverables", "start_date",
  "duration_weeks", "end_date", "payment_terms", "maintenance_terms", "opportunity_id", "owner_staff_id",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  return NextResponse.json({ proposal });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const existing = await getProposal(id);
    if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (existing.status !== "draft") return NextResponse.json({ error: "Only draft proposals can be edited" }, { status: 400 });

    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const field of DIRECT_FIELDS) {
      if (field in b) {
        vals.push(field === "deliverables" ? JSON.stringify(b[field]) : b[field]);
        sets.push(`${field} = $${vals.length}`);
      }
    }

    // Line items + tax drive server-computed pricing (Sheet 5's Pricing step).
    if ("lineItems" in b || "taxPct" in b) {
      const lineItems: LineItem[] = b.lineItems ?? existing.line_items ?? [];
      const taxPct = b.taxPct ?? existing.tax_pct ?? 0;
      const { subtotal, discountTotal, total } = computeTotals(lineItems, taxPct);
      vals.push(JSON.stringify(lineItems)); sets.push(`line_items = $${vals.length}`);
      vals.push(taxPct); sets.push(`tax_pct = $${vals.length}`);
      vals.push(subtotal); sets.push(`subtotal = $${vals.length}`);
      vals.push(discountTotal); sets.push(`discount_total = $${vals.length}`);
      vals.push(total); sets.push(`total = $${vals.length}`);
    }

    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });

    sets.push(`updated_at = NOW()`);
    vals.push(id);
    await sql.query(`UPDATE proposals SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
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
  await sql`DELETE FROM proposals WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
