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
  if (!sql) return NextResponse.json({ products: [] });
  try {
    const products = await sql`SELECT * FROM desk_products ORDER BY sort_order ASC, created_at ASC`;
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: String(err), products: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    const slug = slugify(b.slug || b.name);
    const productKey = slugify(b.product_key || b.slug || b.name);
    if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });

    const exists = await sql`SELECT id FROM desk_products WHERE slug = ${slug} OR product_key = ${productKey} LIMIT 1`;
    if (exists.length > 0) return NextResponse.json({ error: "Slug or key already in use" }, { status: 409 });

    const rows = await sql`
      INSERT INTO desk_products
        (product_key, name, tagline, description, status, color, slug, href, get_started_href,
         icon, features, domains, use_cases, sort_order)
      VALUES
        (${productKey}, ${name}, ${b.tagline || ""}, ${b.description || ""},
         ${b.status === "coming-soon" ? "coming-soon" : "live"}, ${b.color || "#8B5CF6"}, ${slug},
         ${b.href || ""}, ${b.get_started_href || ""}, ${b.icon || ""},
         ${JSON.stringify(Array.isArray(b.features) ? b.features : [])},
         ${JSON.stringify(Array.isArray(b.domains) ? b.domains : [])},
         ${JSON.stringify(Array.isArray(b.use_cases) ? b.use_cases : [])},
         ${Number(b.sort_order) || 0})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
