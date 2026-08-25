import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[projects/stats] ${label} failed:`, err); return fallback; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  const [totalsRow, byType, recent, taskTotals] = await Promise.all([
    safe(() => sql`
      SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'on_hold') AS on_hold,
        COUNT(*) FILTER (WHERE status = 'not_started') AS not_started
      FROM projects
    `, [{ total: 0, in_progress: 0, completed: 0, on_hold: 0, not_started: 0 }], "totals"),
    safe(() => sql`SELECT type, COUNT(*) AS count FROM projects GROUP BY type ORDER BY count DESC`, [], "byType"),
    safe(() => sql`SELECT id, name, status, updated_at FROM projects ORDER BY updated_at DESC LIMIT 4`, [], "recent"),
    safe(() => sql`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status != 'completed' AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS overdue
      FROM staff_tasks WHERE project_id IS NOT NULL
    `, [{ total: 0, completed: 0, in_progress: 0, overdue: 0 }], "taskTotals"),
  ]);

  const totals = totalsRow[0] || { total: 0, in_progress: 0, completed: 0, on_hold: 0, not_started: 0 };
  const tasks = taskTotals[0] || { total: 0, completed: 0, in_progress: 0, overdue: 0 };

  // "Overdue Tasks" KPI on Sheet 1 counts across active projects only.
  const overdueRow = await safe(() => sql`
    SELECT COUNT(*) AS n FROM staff_tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.status != 'completed' AND t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE
  `, [{ n: 0 }], "overdue");

  return NextResponse.json({ totals, byType, recent, tasks, overdueTasks: Number(overdueRow[0]?.n || 0) });
}
