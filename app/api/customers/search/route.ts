import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/customers/search?q= -- lightweight real autocomplete for the
// "Search customer..." field. Batch 06 added a real `customers` table --
// those matches now come first and carry a real `id` so callers (Opportunity/
// Proposal creation) can link to a real customer. The union with
// organisations/leads/opportunities (from Batch 04, before `customers`
// existed) stays as a fallback for names not yet in the customers table,
// so a genuinely new prospect still gets suggested and can be typed freely.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ results: [] });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  const like = `%${q}%`;

  try {
    const [customers, orgs, leads, opps] = await Promise.all([
      sql`SELECT id, name, primary_contact_email AS email, primary_contact_phone AS phone FROM customers WHERE name ILIKE ${like} LIMIT 5`,
      sql`SELECT DISTINCT org_name AS name, owner_email AS email, owner_phone AS phone FROM organisations WHERE org_name ILIKE ${like} LIMIT 5`,
      sql`SELECT DISTINCT business_name AS name, email, phone FROM service_inquiries WHERE business_name ILIKE ${like} LIMIT 5`,
      sql`SELECT DISTINCT customer_name AS name, contact_email AS email, contact_phone AS phone FROM opportunities WHERE customer_name ILIKE ${like} LIMIT 5`,
    ]);
    const seen = new Set<string>();
    const results = [...customers, ...orgs, ...leads, ...opps].filter((r: { name: string }) => {
      if (!r.name || seen.has(r.name.toLowerCase())) return false;
      seen.add(r.name.toLowerCase());
      return true;
    }).slice(0, 8);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: [], error: String(err) }, { status: 500 });
  }
}
