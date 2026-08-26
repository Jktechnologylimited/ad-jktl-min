import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getProject, getProjectProgress } from "@/lib/projects";

export const dynamic = "force-dynamic";

// POST /api/projects/[id]/complete -- Sheet 6. Marks the project completed
// with a real client rating/feedback captured at close, same "capture real
// intent at the point of action" pattern as Batch 04's opportunity close.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.status === "completed") return NextResponse.json({ error: "This project is already completed" }, { status: 400 });

    const b = await req.json();
    await sql`
      UPDATE projects
      SET status = 'completed', completed_at = NOW(), handover_status = 'handed_over',
          client_rating = ${b.clientRating || null}, client_feedback = ${b.clientFeedback || null}, updated_at = NOW()
      WHERE id = ${id}
    `;
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'status_change', 'Project marked as completed', ${session.staffId || null})`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const progress = await getProjectProgress(id);
  return NextResponse.json({ project, progress });
}
