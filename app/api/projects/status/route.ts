import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { classifyHealth } from "@/lib/projects";

export const dynamic = "force-dynamic";

// GET /api/projects/status -- Sheet 8. Health classification (on_track /
// at_risk / delayed) is computed per-project from due_date + real progress,
// not stored -- see classifyHealth() in lib/projects.ts.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const projects = await sql`
      SELECT p.id, p.name, p.status, p.due_date, p.updated_at, c.name AS customer_name,
        COALESCE((SELECT COUNT(*) FROM staff_tasks t WHERE t.project_id = p.id), 0) AS task_total,
        COALESCE((SELECT COUNT(*) FROM staff_tasks t WHERE t.project_id = p.id AND t.status = 'completed'), 0) AS task_completed
      FROM projects p LEFT JOIN customers c ON c.id = p.customer_id
      WHERE p.status != 'completed' OR p.completed_at >= NOW() - INTERVAL '30 days'
    `;

    const counts = { on_track: 0, at_risk: 0, delayed: 0, completed: 0 };
    const atRiskDelayed: { id: string; name: string; customer_name?: string; issue: string; updated_at: string }[] = [];

    for (const p of projects) {
      const total = Number(p.task_total);
      const completed = Number(p.task_completed);
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const health = classifyHealth(p.status, p.due_date, pct);
      counts[health]++;
      if (health === "at_risk" || health === "delayed") {
        atRiskDelayed.push({
          id: p.id, name: p.name, customer_name: p.customer_name,
          issue: health === "delayed" ? "Past due date" : "Due soon with low progress",
          updated_at: p.updated_at,
        });
      }
    }

    return NextResponse.json({ counts, atRiskDelayed: atRiskDelayed.slice(0, 10) });
  } catch (err) {
    return NextResponse.json({ counts: { on_track: 0, at_risk: 0, delayed: 0, completed: 0 }, atRiskDelayed: [], error: String(err) }, { status: 500 });
  }
}
