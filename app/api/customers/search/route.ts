import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/customers/search?q= -- lightweight real autocomplete for the
// "Search customer..." field (Sheet 6). Batch 06 (Customers) doesn't exist
// yet, so this doesn't invent a full customer module -- it just unions the
// real company names already on file (paying organisations + companies from
// existing leads/opportunities) so the field suggests real matches while
// still accepting free text for a genuinely new prospect.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ results: [] });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  const like = `%${q}%`;

  try {
    const [orgs, leads, opps] = await Promise.all([
      sql`SELECT DISTINCT org_name AS name, owner_email AS email, owner_phone AS phone FROM organisations WHERE org_name ILIKE ${like} LIMIT 5`,
      sql`SELECT DISTINCT business_name AS name, email, phone FROM service_inquiries WHERE business_name ILIKE ${like} LIMIT 5`,
      sql`SELECT DISTINCT customer_name AS name, contact_email AS email, contact_phone AS phone FROM opportunities WHERE customer_name ILIKE ${like} LIMIT 5`,
    ]);
    const seen = new Set<string>();
    const results = [...orgs, ...leads, ...opps].filter((r: { name: string }) => {
      if (!r.name || seen.has(r.name.toLowerCase())) return false;
      seen.add(r.name.toLowerCase());
      return true;
    }).slice(0, 8);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: [], error: String(err) }, { status: 500 });
  }
}
