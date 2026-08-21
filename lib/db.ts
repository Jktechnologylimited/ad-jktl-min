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
      COUNT(*)                                            AS total
    FROM organisations
  `;
}

// Generic, product-agnostic breakdown -- any desk product (current or
// future) shows up automatically with zero code changes, since this simply
// groups by whatever is in organisations.product.
export async function getOrgCountsByProduct() {
  return sql`
    SELECT product, COUNT(*) AS count
    FROM organisations
    GROUP BY product
    ORDER BY count DESC
  `;
}

export async function getMRRByProduct() {
  return sql`
    SELECT product, COALESCE(SUM(monthly_fee), 0) AS mrr, COUNT(*) AS active_count
    FROM organisations
    WHERE status = 'active'
    GROUP BY product
    ORDER BY mrr DESC
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

// Batch 02 additions -- real aggregates for the Owner Dashboard / Global KPIs.
// Same style/connection as the functions above; nothing here is placeholder data.

// Real date-range support: given an explicit [from,to], computes the
// equivalent-length immediately-preceding period for a true trend comparison
// (e.g. a 9-day range compares against the 9 days before it). Falls back to
// the previous fixed 7-day/7-day comparison when no range is supplied, so
// existing callers keep working unchanged.
export async function getLeadStats(from?: string, to?: string) {
  if (!from || !to) {
    return sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')                             AS current_count,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS previous_count,
        COUNT(*)                                                                                     AS total
      FROM service_inquiries
    `;
  }
  // Compute the equivalent-length prior period in plain JS -- avoids CTEs
  // and correlated subqueries inside FILTER, which are unnecessary here and
  // more fragile than four flat date parameters.
  const fromDate = new Date(from + "T00:00:00Z");
  const toDateExclusive = new Date(to + "T00:00:00Z");
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1); // make "to" inclusive of its whole day
  const spanMs = toDateExclusive.getTime() - fromDate.getTime();
  const prevFrom = new Date(fromDate.getTime() - spanMs);
  const prevTo = fromDate; // exclusive upper bound = start of current period

  return sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= ${fromDate.toISOString()} AND created_at < ${toDateExclusive.toISOString()}) AS current_count,
      COUNT(*) FILTER (WHERE created_at >= ${prevFrom.toISOString()} AND created_at < ${prevTo.toISOString()}) AS previous_count,
      COUNT(*) AS total
    FROM service_inquiries
  `;
}

export async function getLeadsBySource() {
  return sql`
    SELECT COALESCE(NULLIF(source, ''), 'inquiry') AS source, COUNT(*) AS count
    FROM service_inquiries
    GROUP BY source
    ORDER BY count DESC
  `;
}

export async function getActiveStaffCount() {
  const rows = await sql`SELECT COUNT(*) FILTER (WHERE active) AS active, COUNT(*) AS total FROM staff`;
  return rows[0] || { active: 0, total: 0 };
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
