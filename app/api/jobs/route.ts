import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/jobs — all jobs (admin)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ jobs: [] });
  try {
    const jobs = await sql`
      SELECT j.*,
        (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) AS applicant_count
      FROM jobs j ORDER BY j.created_at DESC
    `;
    return NextResponse.json({ jobs });
  } catch (err) {
    return NextResponse.json({ error: String(err), jobs: [] }, { status: 500 });
  }
}

// POST /api/jobs — create job
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const { title, department, location, type, description, status } = await req.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO jobs (title, department, location, type, description, status)
      VALUES (${title}, ${department || ""}, ${location || ""}, ${type || ""}, ${description || ""}, ${status || "open"})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
