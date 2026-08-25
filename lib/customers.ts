import { sql } from "@/lib/db";

// Batch 06 (Customers / Customer 360). Numbering matches the proposals
// pattern (sequential, this time not year-scoped since a customer number
// is a permanent ID, not a per-year document reference).
export async function generateCustomerNumber(): Promise<string> {
  const rows = await sql`SELECT customer_number FROM customers ORDER BY customer_number DESC LIMIT 1`;
  const last = rows[0]?.customer_number as string | undefined;
  const nextSeq = last ? parseInt(last.split("-")[1], 10) + 1 : 1;
  return `CUST-${String(nextSeq).padStart(4, "0")}`;
}

export interface CustomerFilters {
  status?: string;
  ownerId?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers(f: CustomerFilters) {
  const page = Math.max(1, f.page || 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  function add(sqlFragment: (start: number) => string, ...values: unknown[]) {
    conditions.push(sqlFragment(params.length + 1));
    params.push(...values);
  }
  if (f.status)  add(n => `c.status = $${n}`, f.status);
  if (f.ownerId) add(n => `c.owner_staff_id = $${n}`, f.ownerId);
  if (f.name)    add(n => `(c.name ILIKE $${n} OR c.primary_contact_email ILIKE $${n})`, `%${f.name}%`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countRows = await sql.query(`SELECT COUNT(*) AS total FROM customers c ${where}`, params);
  const total = Number(countRows[0]?.total || 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await sql.query(`
    SELECT c.*, s.name AS owner_name,
      (SELECT COUNT(*) FROM businesses b WHERE b.customer_id = c.id) AS business_count
    FROM customers c
    LEFT JOIN staff s ON s.id = c.owner_staff_id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, [...params, pageSize, offset]);

  return { customers: rows, total, page, pageSize };
}

export async function getCustomer(id: string) {
  const rows = await sql`
    SELECT c.*, s.name AS owner_name
    FROM customers c
    LEFT JOIN staff s ON s.id = c.owner_staff_id
    WHERE c.id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}
