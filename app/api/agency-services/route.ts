import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(s: string) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ services: [] });
  try {
    const services = await sql`SELECT * FROM agency_services ORDER BY sort_order ASC, created_at ASC`;
    return NextResponse.json({ services });
  } catch (err) {
    return NextResponse.json({ error: String(err), services: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    const label = (b.label || "").trim();
    const slug = slugify(b.slug || b.label);
    if (!label || !slug) return NextResponse.json({ error: "Label and slug are required" }, { status: 400 });

    const exists = await sql`SELECT id FROM agency_services WHERE slug = ${slug} LIMIT 1`;
    if (exists.length > 0) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const rows = await sql`
      INSERT INTO agency_services
        (slug, label, short_label, number, icon, tier, tagline, description, demo_slug,
         price_from, price_to, price_alt, price_monthly, delivery_note, highlight,
         features, best_for, status, sort_order)
      VALUES
        (${slug}, ${label}, ${b.short_label || ""}, ${b.number || ""}, ${b.icon || ""}, ${b.tier || ""},
         ${b.tagline || ""}, ${b.description || ""}, ${b.demo_slug || ""},
         ${b.price_from || ""}, ${b.price_to || ""}, ${b.price_alt || ""}, ${b.price_monthly || ""},
         ${b.delivery_note || ""}, ${Boolean(b.highlight)},
         ${JSON.stringify(Array.isArray(b.features) ? b.features : [])},
         ${JSON.stringify(Array.isArray(b.best_for) ? b.best_for : [])},
         ${b.status === "draft" ? "draft" : "published"}, ${Number(b.sort_order) || 0})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
