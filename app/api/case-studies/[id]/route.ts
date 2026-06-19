import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/case-studies/[id] — update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { id } = await params;
    const b = await req.json();
    const clientName = (b.client_name || "").trim();
    const slug = (b.slug || "").trim().toLowerCase();
    if (!clientName || !slug) return NextResponse.json({ error: "Client name and slug are required" }, { status: 400 });

    const clash = await sql`SELECT id FROM case_studies WHERE slug = ${slug} AND id <> ${id} LIMIT 1`;
    if (clash.length > 0) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const status = b.status === "published" ? "published" : "draft";
    const current = await sql`SELECT published_at FROM case_studies WHERE id = ${id} LIMIT 1`;
    let publishedAt = current[0]?.published_at || null;
    if (status === "published" && !publishedAt) publishedAt = b.published_at || new Date().toISOString();
    if (status === "draft") publishedAt = null;

    await sql`
      UPDATE case_studies SET
        client_name = ${clientName}, product = ${b.product || ""}, slug = ${slug},
        cover_image = ${b.cover_image || ""}, challenge = ${b.challenge || ""},
        solution = ${b.solution || ""}, results = ${b.results || ""},
        status = ${status}, published_at = ${publishedAt}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/case-studies/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { id } = await params;
    await sql`DELETE FROM case_studies WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
