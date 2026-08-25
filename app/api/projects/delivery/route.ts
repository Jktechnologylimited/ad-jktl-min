import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { classifyHealth } from "@/lib/projects";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[projects/delivery] ${label} failed:`, err); return fallback; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  const [dueThisWeekRow, dueThisMonthRow, overdueRow, ytdRow, upcoming] = await Promise.all([
    safe(() => sql`SELECT COUNT(*) AS n FROM projects WHERE status != 'completed' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`, [{ n: 0 }], "week"),
    safe(() => sql`SELECT COUNT(*) AS n FROM projects WHERE status != 'completed' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`, [{ n: 0 }], "month"),
    safe(() => sql`SELECT COUNT(*) AS n FROM projects WHERE status != 'completed' AND due_date < CURRENT_DATE`, [{ n: 0 }], "overdue"),
    safe(() => sql`SELECT COUNT(*) FILTER (WHERE status = 'completed') AS done, COUNT(*) AS total FROM projects WHERE created_at >= DATE_TRUNC('year', NOW())`, [{ done: 0, total: 0 }], "ytd"),
    safe(() => sql`
      SELECT p.id, p.name, p.status, p.due_date, c.name AS customer_name,
        COALESCE((SELECT COUNT(*) FROM staff_tasks t WHERE t.project_id = p.id), 0) AS task_total,
        COALESCE((SELECT COUNT(*) FROM staff_tasks t WHERE t.project_id = p.id AND t.status = 'completed'), 0) AS task_completed
      FROM projects p LEFT JOIN customers c ON c.id = p.customer_id
      WHERE p.status != 'completed' AND p.due_date IS NOT NULL
      ORDER BY p.due_date ASC LIMIT 10
    `, [], "upcoming"),
  ]);

  const ytd = ytdRow[0] || { done: 0, total: 0 };
  const completionRate = Number(ytd.total) > 0 ? Math.round((Number(ytd.done) / Number(ytd.total)) * 100) : 0;

  const deliveries = upcoming.map((p: any) => {
    const total = Number(p.task_total);
    const completed = Number(p.task_completed);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { id: p.id, name: p.name, customer_name: p.customer_name, due_date: p.due_date, health: classifyHealth(p.status, p.due_date, pct) };
  });

  return NextResponse.json({
    dueThisWeek: Number(dueThisWeekRow[0]?.n || 0),
    dueThisMonth: Number(dueThisMonthRow[0]?.n || 0),
    overdue: Number(overdueRow[0]?.n || 0),
    completionRate,
    deliveries,
  });
}
