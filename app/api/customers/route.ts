import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listCustomers, generateCustomerNumber } from "@/lib/customers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ customers: [], total: 0, page: 1, pageSize: 10 });

  const p = req.nextUrl.searchParams;
  try {
    const result = await listCustomers({
      status: p.get("status") || undefined,
      ownerId: p.get("ownerId") || undefined,
      name: p.get("name") || undefined,
      page: Number(p.get("page")) || 1,
      pageSize: Number(p.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err), customers: [], total: 0 }, { status: 500 });
  }
}

// POST /api/customers -- "+ Add Customer". Optionally links to the
// opportunity that led to this customer (per the wireframe's account
// lifecycle) and auto-creates a primary business + primary contact from the
// details entered, since Sheet 3/4/5 expect at least one of each to exist.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });

    const customerNumber = await generateCustomerNumber();
    const rows = await sql`
      INSERT INTO customers
        (customer_number, name, status, primary_contact_name, primary_contact_role, primary_contact_email, primary_contact_phone,
         location, owner_staff_id, opportunity_id, notes_internal)
      VALUES
        (${customerNumber}, ${name}, ${b.status || "active"}, ${b.contactName || null}, ${b.contactRole || null},
         ${b.contactEmail || null}, ${b.contactPhone || null}, ${b.location || null}, ${b.ownerStaffId || session.staffId || null},
         ${b.opportunityId || null}, ${b.notesInternal || null})
      RETURNING id, customer_number
    `;
    const customerId = rows[0].id;

    if (b.industry || b.employees || b.website) {
      await sql`INSERT INTO businesses (customer_id, name, is_primary, industry, employees, website) VALUES (${customerId}, ${name}, true, ${b.industry || null}, ${b.employees || null}, ${b.website || null})`;
    }
    if (b.contactName) {
      await sql`INSERT INTO customer_contacts (customer_id, name, position, email, phone, is_primary) VALUES (${customerId}, ${b.contactName}, ${b.contactRole || null}, ${b.contactEmail || null}, ${b.contactPhone || null}, true)`;
    }
    await sql`INSERT INTO lead_activities (customer_id, type, title, actor_staff_id) VALUES (${customerId}, 'created', 'Customer account created', ${session.staffId || null})`;

    return NextResponse.json({ ok: true, id: customerId, customerNumber: rows[0].customer_number });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
