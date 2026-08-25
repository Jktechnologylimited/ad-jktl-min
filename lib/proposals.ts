import { sql } from "@/lib/db";

// Batch 05 (Proposal System). Numbering is generated for real at creation
// time -- sequential per calendar year, format PROP-YYYY-NNN.
export async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await sql`
    SELECT proposal_number FROM proposals
    WHERE proposal_number LIKE ${`PROP-${year}-%`}
    ORDER BY proposal_number DESC LIMIT 1
  `;
  const last = rows[0]?.proposal_number as string | undefined;
  const nextSeq = last ? parseInt(last.split("-")[2], 10) + 1 : 1;
  return `PROP-${year}-${String(nextSeq).padStart(3, "0")}`;
}

export interface ProposalFilters {
  status?: string;
  ownerId?: string;
  customer?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export async function listProposals(f: ProposalFilters) {
  const page = Math.max(1, f.page || 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  function add(sqlFragment: (start: number) => string, ...values: unknown[]) {
    conditions.push(sqlFragment(params.length + 1));
    params.push(...values);
  }
  if (f.status)   add(n => `p.status = $${n}`, f.status);
  if (f.ownerId)  add(n => `p.owner_staff_id = $${n}`, f.ownerId);
  if (f.customer) add(n => `p.customer_name ILIKE $${n}`, `%${f.customer}%`);
  if (f.name)     add(n => `(p.name ILIKE $${n} OR p.proposal_number ILIKE $${n})`, `%${f.name}%`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await sql.query(`SELECT COUNT(*) AS total FROM proposals p ${where}`, params);
  const total = Number(countRows[0]?.total || 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await sql.query(`
    SELECT p.*, s.name AS owner_name, o.name AS opportunity_name
    FROM proposals p
    LEFT JOIN staff s ON s.id = p.owner_staff_id
    LEFT JOIN opportunities o ON o.id = p.opportunity_id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, [...params, pageSize, offset]);

  return { proposals: rows, total, page, pageSize };
}

export async function getProposal(id: string) {
  const rows = await sql`
    SELECT p.*, s.name AS owner_name, o.name AS opportunity_name
    FROM proposals p
    LEFT JOIN staff s ON s.id = p.owner_staff_id
    LEFT JOIN opportunities o ON o.id = p.opportunity_id
    WHERE p.id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}
