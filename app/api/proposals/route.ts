import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listProposals, generateProposalNumber } from "@/lib/proposals";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ proposals: [], total: 0, page: 1, pageSize: 10 });

  const p = req.nextUrl.searchParams;
  try {
    const result = await listProposals({
      status: p.get("status") || undefined,
      ownerId: p.get("ownerId") || undefined,
      customer: p.get("customer") || undefined,
      name: p.get("name") || undefined,
      page: Number(p.get("page")) || 1,
      pageSize: Number(p.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err), proposals: [], total: 0 }, { status: 500 });
  }
}

// POST /api/proposals -- creates an empty draft (Sheet 3 step 1) that the
// wizard then fills in via PATCH on subsequent steps.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    const customerName = (b.customerName || "").trim();
    if (!name) return NextResponse.json({ error: "Proposal name is required" }, { status: 400 });
    if (!customerName) return NextResponse.json({ error: "Customer is required" }, { status: 400 });

    const proposalNumber = await generateProposalNumber();
    const rows = await sql`
      INSERT INTO proposals
        (proposal_number, opportunity_id, customer_id, customer_name, name, currency, valid_until, prepared_by_staff_id, notes_internal, owner_staff_id)
      VALUES
        (${proposalNumber}, ${b.opportunityId || null}, ${b.customerId || null}, ${customerName}, ${name}, ${b.currency || "NGN"},
         ${b.validUntil || null}, ${b.preparedByStaffId || session.staffId || null}, ${b.notesInternal || null},
         ${b.preparedByStaffId || session.staffId || null})
      RETURNING id, proposal_number
    `;
    return NextResponse.json({ ok: true, id: rows[0].id, proposalNumber: rows[0].proposal_number });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
