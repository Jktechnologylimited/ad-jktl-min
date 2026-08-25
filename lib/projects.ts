import { sql } from "@/lib/db";

// Batch 07 (Projects).
export const PROJECT_TYPES = ["website", "platform", "mobile_app", "software", "other"];
export const PROJECT_STATUSES = ["not_started", "in_progress", "on_hold", "completed"];
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "completed"];

export async function generateProjectNumber(): Promise<string> {
  const rows = await sql`SELECT project_number FROM projects ORDER BY project_number DESC LIMIT 1`;
  const last = rows[0]?.project_number as string | undefined;
  const nextSeq = last ? parseInt(last.split("-")[1], 10) + 1 : 1;
  return `PROJ-${String(nextSeq).padStart(4, "0")}`;
}

// "On Track / At Risk / Delayed" (Sheet 8) is a derived health classification,
// not a stored field -- computed from due_date vs progress, not faked data.
export function classifyHealth(status: string, dueDate: string | null, progressPct: number): "on_track" | "at_risk" | "delayed" | "completed" {
  if (status === "completed") return "completed";
  if (!dueDate) return "on_track";
  const days = (new Date(dueDate).getTime() - Date.now()) / 86400000;
  if (days < 0) return "delayed";
  if (days <= 7 && progressPct < 80) return "at_risk";
  return "on_track";
}

export interface ProjectFilters {
  status?: string;
  type?: string;
  customerId?: string;
  managerId?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export async function listProjects(f: ProjectFilters) {
  const page = Math.max(1, f.page || 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  function add(sqlFragment: (start: number) => string, ...values: unknown[]) {
    conditions.push(sqlFragment(params.length + 1));
    params.push(...values);
  }
  if (f.status)     add(n => `p.status = $${n}`, f.status);
  if (f.type)       add(n => `p.type = $${n}`, f.type);
  if (f.customerId) add(n => `p.customer_id = $${n}`, f.customerId);
  if (f.managerId)  add(n => `p.project_manager_staff_id = $${n}`, f.managerId);
  if (f.name)       add(n => `p.name ILIKE $${n}`, `%${f.name}%`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countRows = await sql.query(`SELECT COUNT(*) AS total FROM projects p ${where}`, params);
  const total = Number(countRows[0]?.total || 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await sql.query(`
    SELECT p.*, c.name AS customer_name, s.name AS manager_name,
      COALESCE((SELECT COUNT(*) FROM staff_tasks t WHERE t.project_id = p.id), 0) AS task_count,
      COALESCE((SELECT COUNT(*) FROM staff_tasks t WHERE t.project_id = p.id AND t.status = 'completed'), 0) AS completed_task_count
    FROM projects p
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN staff s ON s.id = p.project_manager_staff_id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, [...params, pageSize, offset]);

  return { projects: rows, total, page, pageSize };
}

export async function getProject(id: string) {
  const rows = await sql`
    SELECT p.*, c.name AS customer_name, s.name AS manager_name
    FROM projects p
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN staff s ON s.id = p.project_manager_staff_id
    WHERE p.id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

// Real progress: completed tasks / total tasks. Falls back to 0 for a
// project with no tasks yet rather than a fabricated percentage.
export async function getProjectProgress(id: string) {
  const rows = await sql`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'completed') AS completed
    FROM staff_tasks WHERE project_id = ${id}
  `;
  const total = Number(rows[0]?.total || 0);
  const completed = Number(rows[0]?.completed || 0);
  return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
