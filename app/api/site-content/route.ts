import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { mergeHomepage } from "@/lib/homepage-defaults";

export const dynamic = "force-dynamic";

// GET /api/site-content — effective homepage doc (defaults merged with DB)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let stored: unknown = null;
  if (sql) {
    try {
      const rows = await sql`SELECT value FROM site_content WHERE key = 'homepage' LIMIT 1`;
      stored = rows[0]?.value ?? null;
    } catch { stored = null; }
  }
  return NextResponse.json({ homepage: mergeHomepage(stored) });
}

// PUT /api/site-content — upsert the homepage doc
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const body = await req.json();
    const merged = mergeHomepage(body.homepage ?? body);
    await sql`
      INSERT INTO site_content (key, value, updated_at)
      VALUES ('homepage', ${JSON.stringify(merged)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(merged)}, updated_at = NOW()
    `;
    return NextResponse.json({ ok: true, homepage: merged });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
