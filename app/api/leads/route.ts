import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";

// GET /api/leads?status=&source=&ownerId=&from=&to=&company=&name=&email=&phone=&page=&pageSize=
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ leads: [], total: 0, page: 1, pageSize: 10 });

  const p = req.nextUrl.searchParams;
  try {
    const result = await listLeads({
      status: p.get("status") || undefined,
      source: p.get("source") || undefined,
      ownerId: p.get("ownerId") || undefined,
      from: p.get("from") || undefined,
      to: p.get("to") || undefined,
      company: p.get("company") || undefined,
      name: p.get("name") || undefined,
      email: p.get("email") || undefined,
      phone: p.get("phone") || undefined,
      page: Number(p.get("page")) || 1,
      pageSize: Number(p.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err), leads: [], total: 0 }, { status: 500 });
  }
}

// POST /api/leads -- create a lead directly in the CRM (vs. the public website's own insert).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const b = await req.json();
    const firstName = (b.firstName || "").trim();
    const lastName = (b.lastName || "").trim();
    if (!firstName || !lastName) return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
    if (!b.source) return NextResponse.json({ error: "Source is required" }, { status: 400 });

    const rows = await sql`
      INSERT INTO service_inquiries
        (first_name, last_name, name, email, phone, business_name, website, source, status, message, owner_staff_id)
      VALUES
        (${firstName}, ${lastName}, ${firstName + " " + lastName}, ${b.email || null}, ${b.phone || null},
         ${b.companyName || null}, ${b.website || null}, ${b.source}, ${b.status || "new"}, ${b.notes || null},
         ${session.staffId || null})
      RETURNING id
    `;
    const leadId = rows[0].id;

    await sql`INSERT INTO lead_activities (lead_id, type, title, actor_staff_id) VALUES (${leadId}, 'created', 'Lead created', ${session.staffId || null})`;

    return NextResponse.json({ ok: true, id: leadId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
