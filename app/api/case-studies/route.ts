import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/case-studies — all case studies (admin)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ caseStudies: [] });
  try {
    const caseStudies = await sql`SELECT * FROM case_studies ORDER BY created_at DESC`;
    return NextResponse.json({ caseStudies });
  } catch (err) {
    return NextResponse.json({ error: String(err), caseStudies: [] }, { status: 500 });
  }
}

// POST /api/case-studies — create
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    const clientName = (b.client_name || "").trim();
    const slug = (b.slug || "").trim().toLowerCase();
    if (!clientName || !slug) return NextResponse.json({ error: "Client name and slug are required" }, { status: 400 });

    const exists = await sql`SELECT id FROM case_studies WHERE slug = ${slug} LIMIT 1`;
    if (exists.length > 0) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const status = b.status === "published" ? "published" : "draft";
    const publishedAt = status === "published" ? (b.published_at || new Date().toISOString()) : null;

    const rows = await sql`
      INSERT INTO case_studies (client_name, product, slug, cover_image, challenge, solution, results, status, published_at)
      VALUES (${clientName}, ${b.product || ""}, ${slug}, ${b.cover_image || ""},
              ${b.challenge || ""}, ${b.solution || ""}, ${b.results || ""}, ${status}, ${publishedAt})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
