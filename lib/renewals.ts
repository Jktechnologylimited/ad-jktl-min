// Real, shared renewal-date math -- extracted from Batch 06's
// /api/customers/[id]/maintenance so it isn't duplicated a second time
// here. Hosting/plan renewal is genuinely derivable from real subscription
// data (activated_at + monthly_fee); domain expiry is NOT (no registrar
// integration exists), so that stays a manually-entered field, never computed.

export interface RenewableOrg {
  monthly_fee: string | number | null;
  activated_at: string | null;
}

export function computeHostingRenewal(org: RenewableOrg): { renewalDate: string; amountPerYear: number } | null {
  const monthlyFee = Number(org.monthly_fee) || 0;
  if (monthlyFee <= 0) return null;
  const now = new Date();
  const activated = org.activated_at ? new Date(org.activated_at) : now;
  const renewal = new Date(activated);
  renewal.setFullYear(now.getFullYear());
  if (renewal < now) renewal.setFullYear(now.getFullYear() + 1);
  return { renewalDate: renewal.toISOString().slice(0, 10), amountPerYear: monthlyFee * 12 };
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}
