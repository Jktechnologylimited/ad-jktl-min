import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; feedbackId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ replies: [] });
  const { feedbackId } = await params;
  const replies = await sql`SELECT * FROM project_feedback_replies WHERE feedback_id = ${feedbackId} ORDER BY created_at ASC`;
  return NextResponse.json({ replies });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; feedbackId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { feedbackId } = await params;

  try {
    const b = await req.json();
    const body = (b.body || "").trim();
    if (!body) return NextResponse.json({ error: "Reply text is required" }, { status: 400 });
    const authorName = b.authorType === "client" ? (b.authorName || "").trim() : undefined;
    if (b.authorType === "client" && !authorName) return NextResponse.json({ error: "Author name is required for a client reply" }, { status: 400 });

    let staffName = "Staff";
    if (b.authorType !== "client" && session.staffId) {
      const rows = await sql`SELECT name FROM staff WHERE id = ${session.staffId} LIMIT 1`;
      staffName = rows[0]?.name || session.name || "Staff";
    } else if (b.authorType !== "client") {
      staffName = session.name || "Owner";
    }

    const rows = await sql`
      INSERT INTO project_feedback_replies (feedback_id, body, author_name, author_type, author_staff_id)
      VALUES (${feedbackId}, ${body}, ${b.authorType === "client" ? authorName : staffName}, ${b.authorType || "staff"}, ${b.authorType === "client" ? null : (session.staffId || null)})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
