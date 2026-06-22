import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { id } = await params;
    const b = await req.json();
    const title = (b.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    await sql`
      UPDATE watch_videos SET
        title = ${title}, description = ${b.description || ""}, duration = ${b.duration || ""},
        youtube_id = ${b.youtube_id || ""}, coming_soon = ${Boolean(b.coming_soon)},
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
    await sql`DELETE FROM watch_videos WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
