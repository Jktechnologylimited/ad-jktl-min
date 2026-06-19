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
    const label = (b.label || "").trim();
    const slug = slugify(b.slug || b.label);
    if (!label || !slug) return NextResponse.json({ error: "Label and slug are required" }, { status: 400 });

    const clash = await sql`SELECT id FROM agency_services WHERE slug = ${slug} AND id <> ${id} LIMIT 1`;
    if (clash.length > 0) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    await sql`
      UPDATE agency_services SET
        slug = ${slug}, label = ${label}, short_label = ${b.short_label || ""}, number = ${b.number || ""},
        icon = ${b.icon || ""}, tier = ${b.tier || ""}, tagline = ${b.tagline || ""},
        description = ${b.description || ""}, demo_slug = ${b.demo_slug || ""},
        price_from = ${b.price_from || ""}, price_to = ${b.price_to || ""}, price_alt = ${b.price_alt || ""},
        price_monthly = ${b.price_monthly || ""}, delivery_note = ${b.delivery_note || ""},
        highlight = ${Boolean(b.highlight)},
        features = ${JSON.stringify(Array.isArray(b.features) ? b.features : [])},
        best_for = ${JSON.stringify(Array.isArray(b.best_for) ? b.best_for : [])},
        status = ${b.status === "draft" ? "draft" : "published"}, sort_order = ${Number(b.sort_order) || 0}
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
    await sql`DELETE FROM agency_services WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
