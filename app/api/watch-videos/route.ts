import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ videos: [] });
  const page = req.nextUrl.searchParams.get("page");
  try {
    const videos = page
      ? await sql`SELECT * FROM watch_videos WHERE page_key = ${page} ORDER BY sort_order ASC, created_at ASC`
      : await sql`SELECT * FROM watch_videos ORDER BY page_key ASC, sort_order ASC`;
    return NextResponse.json({ videos });
  } catch (err) {
    return NextResponse.json({ error: String(err), videos: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    const pageKey = (b.page_key || "").trim();
    const title = (b.title || "").trim();
    if (!pageKey || !title) return NextResponse.json({ error: "Page and title are required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO watch_videos (page_key, title, description, duration, youtube_id, coming_soon, sort_order)
      VALUES (${pageKey}, ${title}, ${b.description || ""}, ${b.duration || ""}, ${b.youtube_id || ""},
              ${Boolean(b.coming_soon)}, ${Number(b.sort_order) || 0})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
