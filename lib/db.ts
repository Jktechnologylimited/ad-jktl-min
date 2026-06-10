import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || "";
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null as any;

// ── QUERY HELPERS ─────────────────────────────────────────────────────────────

export async function getOrgStats() {
  return sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active')          AS active,
      COUNT(*) FILTER (WHERE status = 'pending_payment') AS pending,
      COUNT(*) FILTER (WHERE status = 'suspended')       AS suspended,
      COUNT(*)                                            AS total,
      COUNT(*) FILTER (WHERE product = 'faithdesk')      AS faithdesk,
      COUNT(*) FILTER (WHERE product = 'detaildesk')     AS detaildesk,
      COUNT(*) FILTER (WHERE product = 'schooldesk')     AS schooldesk
    FROM organisations
  `;
}

export async function getMRR() {
  return sql`
    SELECT
      COALESCE(SUM(monthly_fee), 0) AS mrr,
      COALESCE(SUM(CASE WHEN product = 'faithdesk'  THEN monthly_fee ELSE 0 END), 0) AS faithdesk_mrr,
      COALESCE(SUM(CASE WHEN product = 'detaildesk' THEN monthly_fee ELSE 0 END), 0) AS detaildesk_mrr
    FROM organisations
    WHERE status = 'active'
  `;
}

export async function getRevenueByMonth() {
  return sql`
    SELECT
      TO_CHAR(activated_at, 'Mon YYYY') AS month,
      DATE_TRUNC('month', activated_at) AS month_date,
      COUNT(*)                          AS new_clients,
      SUM(setup_fee)                    AS setup_revenue,
      SUM(monthly_fee)                  AS monthly_revenue
    FROM organisations
    WHERE status = 'active' AND activated_at IS NOT NULL
    GROUP BY month, month_date
    ORDER BY month_date DESC
    LIMIT 12
  `;
}

export async function getAllOrgs(filter?: string) {
  if (filter && filter !== "all") {
    return sql`
      SELECT * FROM organisations
      WHERE status = ${filter}
      ORDER BY created_at DESC
    `;
  }
  return sql`SELECT * FROM organisations ORDER BY created_at DESC`;
}

export async function getOrgById(id: string) {
  const rows = await sql`SELECT * FROM organisations WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function getAffiliateStats() {
  return sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'active')  AS active,
      COUNT(*)                                   AS total,
      COALESCE(SUM(CASE WHEN c.status = 'approved' THEN c.amount ELSE 0 END), 0) AS pending_payouts
    FROM affiliates a
    LEFT JOIN commissions c ON c.affiliate_id = a.id
  `;
}

export async function getPendingPayouts() {
  return sql`
    SELECT
      pr.*,
      a.first_name,
      a.last_name,
      a.email,
      a.referral_code
    FROM payout_requests pr
    JOIN affiliates a ON a.id = pr.affiliate_id
    WHERE pr.status = 'requested'
    ORDER BY pr.created_at ASC
  `;
}

export async function getRecentSignups(limit = 10) {
  return sql`
    SELECT * FROM organisations
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function getServiceInquiries() {
  return sql`
    SELECT * FROM service_inquiries
    ORDER BY created_at DESC
    LIMIT 50
  ` .catch(() => []); // table may not exist yet
}
