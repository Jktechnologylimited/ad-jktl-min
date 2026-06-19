import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/jobs/[id]/applications — applicants for a job
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ applications: [] });
  try {
    const { id } = await params;
    const applications = await sql`
      SELECT id, name, email, phone, cv_url, cover_note, created_at
      FROM job_applications WHERE job_id = ${id}
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ applications });
  } catch (err) {
    return NextResponse.json({ error: String(err), applications: [] }, { status: 500 });
  }
}
