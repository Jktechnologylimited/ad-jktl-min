import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ testimonials: [] });
  try {
    const testimonials = await sql`SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC`;
    return NextResponse.json({ testimonials });
  } catch (err) {
    return NextResponse.json({ error: String(err), testimonials: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    if (!b.quote || !b.author_name) return NextResponse.json({ error: "Quote and author name are required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO testimonials (quote, author_name, author_role, company, avatar_url, rating, status, sort_order)
      VALUES (${b.quote}, ${b.author_name}, ${b.author_role || ""}, ${b.company || ""}, ${b.avatar_url || ""},
              ${Number(b.rating) || 5}, ${b.status === "draft" ? "draft" : "published"}, ${Number(b.sort_order) || 0})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
