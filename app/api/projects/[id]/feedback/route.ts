import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// No client portal exists yet (Batches 17-20), so feedback here is logged by
// staff on the client's behalf (phone call, email, meeting notes) -- real
// data, real workflow, just not a public client-submission form. See
// JKTL_CODEBASE_MAP.md.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ feedback: [] });
  const { id } = await params;
  const feedback = await sql`
    SELECT f.*, pf.name AS file_name,
      (SELECT COUNT(*) FROM project_feedback_replies r WHERE r.feedback_id = f.id) AS reply_count
    FROM project_feedback f LEFT JOIN project_files pf ON pf.id = f.file_id
    WHERE f.project_id = ${id} ORDER BY f.created_at DESC
  `;
  return NextResponse.json({ feedback });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const title = (b.title || "").trim();
    const body = (b.body || "").trim();
    const authorName = (b.authorName || "").trim();
    if (!title || !body || !authorName) return NextResponse.json({ error: "Title, feedback and author name are required" }, { status: 400 });

    const rows = await sql`
      INSERT INTO project_feedback (project_id, file_id, title, body, author_name, author_type, logged_by_staff_id)
      VALUES (${id}, ${b.fileId || null}, ${title}, ${body}, ${authorName}, ${b.authorType || "client"}, ${session.staffId || null})
      RETURNING id
    `;
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'feedback', ${`Feedback added: ${title}`}, ${session.staffId || null})`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
