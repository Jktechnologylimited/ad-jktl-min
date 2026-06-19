import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/posts — all posts (admin)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ posts: [] });
  try {
    const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json({ error: String(err), posts: [] }, { status: 500 });
  }
}

// POST /api/posts — create post
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    const title = (b.title || "").trim();
    const slug = (b.slug || "").trim().toLowerCase();
    if (!title || !slug) return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });

    const exists = await sql`SELECT id FROM posts WHERE slug = ${slug} LIMIT 1`;
    if (exists.length > 0) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const status = b.status === "published" ? "published" : "draft";
    const publishedAt = status === "published" ? (b.published_at || new Date().toISOString()) : null;

    const rows = await sql`
      INSERT INTO posts (title, slug, cover_image, excerpt, body, author, type, status, published_at)
      VALUES (${title}, ${slug}, ${b.cover_image || ""}, ${b.excerpt || ""}, ${b.body || ""},
              ${b.author || ""}, ${b.type === "news" ? "news" : "blog"}, ${status}, ${publishedAt})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
