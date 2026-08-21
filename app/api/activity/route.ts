import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); } catch (err) { console.error(`[activity] ${label} failed:`, err); return fallback; }
}

// Real global activity feed -- unions recent rows from tables that already
// exist (organisations, service_inquiries, payout_requests, affiliates)
// rather than a dedicated activity/audit-log subsystem, which is out of
// scope for this batch. Accepts optional ?from=&to= to scope to a real range;
// defaults to "most recent" (no filter) when omitted. Each source is
// independent, so one failing query doesn't blank the whole feed.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ items: [] });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const hasRange = !!(from && to);

  const [signups, inquiries, payouts, affiliateSignups] = await Promise.all([
    safe(() => hasRange
      ? sql`SELECT id, org_name AS label, product AS meta, created_at FROM organisations WHERE created_at >= ${from}::date AND created_at < ${to}::date + INTERVAL '1 day' ORDER BY created_at DESC LIMIT 20`
      : sql`SELECT id, org_name AS label, product AS meta, created_at FROM organisations ORDER BY created_at DESC LIMIT 8`, [], "organisations"),
    safe(() => hasRange
      ? sql`SELECT id, name AS label, service AS meta, created_at FROM service_inquiries WHERE created_at >= ${from}::date AND created_at < ${to}::date + INTERVAL '1 day' ORDER BY created_at DESC LIMIT 20`
      : sql`SELECT id, name AS label, service AS meta, created_at FROM service_inquiries ORDER BY created_at DESC LIMIT 8`, [], "service_inquiries"),
    safe(() => hasRange
      ? sql`SELECT pr.id, a.first_name || ' ' || a.last_name AS label, pr.amount::text AS meta, pr.created_at
            FROM payout_requests pr JOIN affiliates a ON a.id = pr.affiliate_id
            WHERE pr.created_at >= ${from}::date AND pr.created_at < ${to}::date + INTERVAL '1 day' ORDER BY pr.created_at DESC LIMIT 20`
      : sql`SELECT pr.id, a.first_name || ' ' || a.last_name AS label, pr.amount::text AS meta, pr.created_at
            FROM payout_requests pr JOIN affiliates a ON a.id = pr.affiliate_id ORDER BY pr.created_at DESC LIMIT 8`, [], "payout_requests"),
    safe(() => hasRange
      ? sql`SELECT id, first_name || ' ' || last_name AS label, 'affiliate application' AS meta, created_at FROM affiliates WHERE created_at >= ${from}::date AND created_at < ${to}::date + INTERVAL '1 day' ORDER BY created_at DESC LIMIT 20`
      : sql`SELECT id, first_name || ' ' || last_name AS label, 'affiliate application' AS meta, created_at FROM affiliates ORDER BY created_at DESC LIMIT 8`, [], "affiliates"),
  ]);

  const items = [
    ...signups.map((r: any) => ({ id: "org-" + r.id, type: "signup", label: r.label, meta: r.meta, created_at: r.created_at })),
    ...inquiries.map((r: any) => ({ id: "inq-" + r.id, type: "inquiry", label: r.label, meta: r.meta, created_at: r.created_at })),
    ...payouts.map((r: any) => ({ id: "pay-" + r.id, type: "payout", label: r.label, meta: r.meta, created_at: r.created_at })),
    ...affiliateSignups.map((r: any) => ({ id: "aff-" + r.id, type: "affiliate", label: r.label, meta: r.meta, created_at: r.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ items: items.slice(0, hasRange ? 40 : 20) });
}
