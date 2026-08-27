import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { computeHostingRenewal, daysUntil } from "@/lib/renewals";

export const dynamic = "force-dynamic";

// GET /api/clients/renewals -- every client (organisation), with real
// hosting/plan renewal computed from activated_at + monthly_fee, and real
// (manually-entered) domain expiry where staff have set it. Sorted by
// whichever date is soonest across both dimensions.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ clients: [], counts: {} });

  try {
    const orgs = await sql`
      SELECT id, org_name, product, plan, subdomain, custom_domain, monthly_fee, status,
             activated_at, domain_registrar, domain_expiry_date
      FROM organisations
      ORDER BY created_at DESC
    `;

    const clients = orgs.map((o: any) => {
      const hosting = computeHostingRenewal(o);
      const hostingDays = hosting ? daysUntil(hosting.renewalDate) : null;
      const domainDays = daysUntil(o.domain_expiry_date);
      const soonest = [hostingDays, domainDays].filter((d): d is number => d !== null).sort((a, b) => a - b)[0] ?? null;
      return {
        id: o.id, orgName: o.org_name, product: o.product, plan: o.plan,
        subdomain: o.subdomain, customDomain: o.custom_domain, status: o.status,
        domainRegistrar: o.domain_registrar, domainExpiryDate: o.domain_expiry_date, domainDaysLeft: domainDays,
        hostingRenewalDate: hosting?.renewalDate ?? null, hostingAmountPerYear: hosting?.amountPerYear ?? null, hostingDaysLeft: hostingDays,
        soonestDaysLeft: soonest,
      };
    }).sort((a: any, b: any) => {
      if (a.soonestDaysLeft === null) return 1;
      if (b.soonestDaysLeft === null) return -1;
      return a.soonestDaysLeft - b.soonestDaysLeft;
    });

    const withinDomain = (n: number) => clients.filter((c: any) => c.domainDaysLeft !== null && c.domainDaysLeft <= n).length;
    const withinHosting = (n: number) => clients.filter((c: any) => c.hostingDaysLeft !== null && c.hostingDaysLeft <= n).length;

    const counts = {
      domainExpiring7: withinDomain(7), domainExpiring30: withinDomain(30),
      hostingRenewing7: withinHosting(7), hostingRenewing30: withinHosting(30),
      domainOverdue: clients.filter((c: any) => c.domainDaysLeft !== null && c.domainDaysLeft < 0).length,
      hostingOverdue: clients.filter((c: any) => c.hostingDaysLeft !== null && c.hostingDaysLeft < 0).length,
      noDomainDateSet: clients.filter((c: any) => c.status === "active" && c.customDomain && !c.domainExpiryDate).length,
    };

    return NextResponse.json({ clients, counts });
  } catch (err) {
    return NextResponse.json({ clients: [], counts: {}, error: String(err) }, { status: 500 });
  }
}
