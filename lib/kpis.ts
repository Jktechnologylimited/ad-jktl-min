// Role-aware KPI definitions. Each role logs the metric set relevant to its job.
export interface KpiMetric {
  key: string;
  label: string;
  short: string;
  weeklyMin?: number;
  weeklyMax?: number;
}

export interface KpiSet { id: string; label: string; metrics: KpiMetric[]; }

export const KPI_SETS: Record<string, KpiSet> = {
  sales: {
    id: "sales",
    label: "Sales / Outreach",
    metrics: [
      { key: "messages_sent",   label: "Messages sent",         short: "Msg",   weeklyMin: 150, weeklyMax: 250 },
      { key: "conversations",   label: "Conversations started", short: "Conv",  weeklyMin: 10,  weeklyMax: 20 },
      { key: "qualified_leads", label: "Qualified leads",       short: "Leads" },
      { key: "demos_booked",    label: "Demos booked",          short: "Demos", weeklyMin: 3,   weeklyMax: 5 },
      { key: "follow_ups",      label: "Follow-ups done",       short: "F/up" },
    ],
  },
  recruitment: {
    id: "recruitment",
    label: "Recruitment",
    metrics: [
      { key: "candidates_sourced", label: "Candidates sourced",   short: "Sourced", weeklyMin: 30, weeklyMax: 50 },
      { key: "screens",            label: "Screens / CV reviews", short: "Screens", weeklyMin: 15, weeklyMax: 25 },
      { key: "interviews",         label: "Interviews conducted", short: "Intvw",   weeklyMin: 5,  weeklyMax: 10 },
      { key: "offers",             label: "Offers made",          short: "Offers",  weeklyMin: 1,  weeklyMax: 3 },
      { key: "hires",              label: "Hires closed",         short: "Hires" },
    ],
  },
};

// Which metric set each role logs. Roles not listed have no KPI tracking.
export const ROLE_KPI_SET: Record<string, string> = {
  bdr: "sales",
  support: "sales",
  hiring: "recruitment",
};

export function kpiSetForRole(role?: string | null): KpiSet | null {
  const id = ROLE_KPI_SET[role || ""];
  return id ? KPI_SETS[id] : null;
}

// Every numeric metric key across all sets (for the DB layer + totals).
export const ALL_KPI_KEYS = Array.from(new Set(Object.values(KPI_SETS).flatMap((s) => s.metrics.map((m) => m.key))));

export type KpiEntry = { entry_date: string } & Record<string, number>;

export function localDate(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function weekStart(d = new Date()): string {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = dt.getDay();
  dt.setDate(dt.getDate() + ((day === 0 ? -6 : 1) - day));
  return localDate(dt);
}

export function weeklyTotals(entries: KpiEntry[]): Record<string, number> {
  const start = weekStart();
  const totals: Record<string, number> = {};
  for (const k of ALL_KPI_KEYS) totals[k] = 0;
  for (const e of entries) {
    if (String(e.entry_date).slice(0, 10) >= start) {
      for (const k of ALL_KPI_KEYS) totals[k] += Number(e[k]) || 0;
    }
  }
  return totals;
}
