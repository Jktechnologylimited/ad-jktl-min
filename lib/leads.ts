import { sql } from "@/lib/db";

// service_inquiries IS the Leads entity (Batch 03) -- see JKTL_CODEBASE_MAP.md
// for why this table was extended rather than duplicated. `name` is kept for
// backward compatibility with the public website's insert; CRM-created leads
// use first_name/last_name and we fall back to `name` when those are empty.

export interface LeadFilters {
  status?: string;
  source?: string;
  ownerId?: string;
  from?: string;
  to?: string;
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  page?: number;
  pageSize?: number;
}

export async function listLeads(f: LeadFilters) {
  const page = Math.max(1, f.page || 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize || 10));
  const offset = (page - 1) * pageSize;

  // Built as a parameterised query -- each condition owns its own params, so
  // adding a multi-param condition (like the name OR-search) never requires
  // patching an earlier placeholder's index.
  const conditions: string[] = [];
  const params: unknown[] = [];
  function add(sqlFragment: (start: number) => string, ...values: unknown[]) {
    conditions.push(sqlFragment(params.length + 1));
    params.push(...values);
  }

  if (f.status)  add(n => `l.status = $${n}`, f.status);
  if (f.source)  add(n => `l.source = $${n}`, f.source);
  if (f.ownerId) add(n => `l.owner_staff_id = $${n}`, f.ownerId);
  if (f.from)    add(n => `l.created_at >= $${n}`, f.from);
  if (f.to)      add(n => `l.created_at < $${n}::date + INTERVAL '1 day'`, f.to);
  if (f.company) add(n => `l.business_name ILIKE $${n}`, `%${f.company}%`);
  if (f.name)    add(n => `(COALESCE(l.first_name,'') || ' ' || COALESCE(l.last_name,'') ILIKE $${n} OR l.name ILIKE $${n + 1})`, `%${f.name}%`, `%${f.name}%`);
  if (f.email)   add(n => `l.email ILIKE $${n}`, `%${f.email}%`);
  if (f.phone)   add(n => `l.phone ILIKE $${n}`, `%${f.phone}%`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await sql.query(`SELECT COUNT(*) AS total FROM service_inquiries l ${where}`, params);
  const total = Number(countRows[0]?.total || 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await sql.query(`
    SELECT l.*, s.name AS owner_name
    FROM service_inquiries l
    LEFT JOIN staff s ON s.id = l.owner_staff_id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, [...params, pageSize, offset]);

  return { leads: rows, total, page, pageSize };
}

export async function getLead(id: string) {
  const rows = await sql`
    SELECT l.*, s.name AS owner_name
    FROM service_inquiries l
    LEFT JOIN staff s ON s.id = l.owner_staff_id
    WHERE l.id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getLeadStatusFunnel() {
  return sql`SELECT status, COUNT(*) AS count FROM service_inquiries GROUP BY status`;
}

export async function getTopOwnersThisWeek() {
  return sql`
    SELECT s.id, s.name, COUNT(l.id) AS lead_count
    FROM service_inquiries l
    JOIN staff s ON s.id = l.owner_staff_id
    WHERE l.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY s.id, s.name
    ORDER BY lead_count DESC
    LIMIT 5
  `;
}
