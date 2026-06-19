import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(s: string) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { id } = await params;
    const b = await req.json();
    const name = (b.name || "").trim();
    const slug = slugify(b.slug || b.name);
    if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });

    const clash = await sql`SELECT id FROM desk_products WHERE slug = ${slug} AND id <> ${id} LIMIT 1`;
    if (clash.length > 0) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    await sql`
      UPDATE desk_products SET
        name = ${name}, tagline = ${b.tagline || ""}, description = ${b.description || ""},
        status = ${b.status === "coming-soon" ? "coming-soon" : "live"}, color = ${b.color || "#8B5CF6"},
        slug = ${slug}, href = ${b.href || ""}, get_started_href = ${b.get_started_href || ""}, icon = ${b.icon || ""},
        features = ${JSON.stringify(Array.isArray(b.features) ? b.features : [])},
        domains = ${JSON.stringify(Array.isArray(b.domains) ? b.domains : [])},
        use_cases = ${JSON.stringify(Array.isArray(b.use_cases) ? b.use_cases : [])},
        sort_order = ${Number(b.sort_order) || 0}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { id } = await params;
    await sql`DELETE FROM desk_products WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
