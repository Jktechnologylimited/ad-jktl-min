import { sql } from "@/lib/db";

// Batch 04 (CRM -- Opportunities & Sales). Pipelines are a small, real,
// static set (matching the wireframe); building a full pipeline-configuration
// UI isn't shown in any of Batch 04's 8 sheets, so it isn't built here.
export const PIPELINES = ["New Business Pipeline", "Renewal Pipeline", "Partnership Pipeline"];
// Stage order matters -- "advance to next stage" walks this array. Matches
// Batch 04's own wireframe (Sheet 1's Sales Pipeline / Sheet 4's Kanban),
// which supersedes Batch 03's placeholder 5-stage guess.
export const STAGES = ["Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
export const OPEN_STAGES = STAGES.filter(s => !s.startsWith("Closed"));

export interface OpportunityFilters {
  stage?: string;
  status?: string;
  ownerId?: string;
  from?: string;
  to?: string;
  customer?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export async function listOpportunities(f: OpportunityFilters) {
  const page = Math.max(1, f.page || 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  function add(sqlFragment: (start: number) => string, ...values: unknown[]) {
    conditions.push(sqlFragment(params.length + 1));
    params.push(...values);
  }

  if (f.stage)    add(n => `o.stage = $${n}`, f.stage);
  if (f.status)   add(n => `o.status = $${n}`, f.status);
  if (f.ownerId)  add(n => `o.owner_staff_id = $${n}`, f.ownerId);
  if (f.from)     add(n => `o.created_at >= $${n}`, f.from);
  if (f.to)       add(n => `o.created_at < $${n}::date + INTERVAL '1 day'`, f.to);
  if (f.customer) add(n => `o.customer_name ILIKE $${n}`, `%${f.customer}%`);
  if (f.name)     add(n => `o.name ILIKE $${n}`, `%${f.name}%`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await sql.query(`SELECT COUNT(*) AS total FROM opportunities o ${where}`, params);
  const total = Number(countRows[0]?.total || 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await sql.query(`
    SELECT o.*, s.name AS owner_name
    FROM opportunities o
    LEFT JOIN staff s ON s.id = o.owner_staff_id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, [...params, pageSize, offset]);

  return { opportunities: rows, total, page, pageSize };
}

export async function getOpportunity(id: string) {
  const rows = await sql`
    SELECT o.*, s.name AS owner_name
    FROM opportunities o
    LEFT JOIN staff s ON s.id = o.owner_staff_id
    WHERE o.id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getPipelineByStage() {
  return sql`
    SELECT stage, COUNT(*) AS count, COALESCE(SUM(estimated_value), 0) AS value
    FROM opportunities
    GROUP BY stage
  `;
}

export async function getConversionRate() {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE stage IN ('Closed Won', 'Closed Lost') AND closed_at >= DATE_TRUNC('month', NOW())) AS closed_this_month,
      COUNT(*) FILTER (WHERE stage = 'Closed Won' AND closed_at >= DATE_TRUNC('month', NOW())) AS won_this_month
    FROM opportunities
  `;
  return rows[0] || { closed_this_month: 0, won_this_month: 0 };
}
