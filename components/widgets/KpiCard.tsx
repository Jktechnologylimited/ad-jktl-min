import { colors, font } from "@/lib/design-tokens";
import TrendSparkline from "./TrendSparkline";

export interface KpiCardProps {
  label: string;
  value?: string | number;
  trendPct?: number;      // e.g. 12 or -3; omit if no comparison available
  trendLabel?: string;    // e.g. "vs last week"
  sparkline?: number[];   // omit to hide the mini chart
  accent?: string;
  pendingBatch?: string;  // e.g. "Batch 07" -- renders an honest pending state instead of a value
}

// Sheet 6: "KPI Card" -- real, reusable, presentational. All data comes in
// via props; this component has no opinion about where numbers come from.
export default function KpiCard({ label, value, trendPct, trendLabel, sparkline, accent = colors.primary, pendingBatch }: KpiCardProps) {
  const up = (trendPct ?? 0) >= 0;

  if (pendingBatch) {
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: colors.textLow, marginBottom: 8 }}>{label}</p>
        <p style={{ fontSize: "1.4rem", fontWeight: 700, color: colors.textFaint, lineHeight: 1, marginBottom: 6 }}>&mdash;</p>
        <p style={{ fontSize: "0.65rem", color: colors.textFaint, fontFamily: font.mono }}>Lands in {pendingBatch}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 600, color: colors.textLow, marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</p>
          {trendPct !== undefined && (
            <p style={{ fontSize: "0.7rem", color: up ? colors.success : colors.danger, marginTop: 6, fontFamily: font.mono }}>
              {up ? "\u2191" : "\u2193"} {Math.abs(trendPct)}% {trendLabel || ""}
            </p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && <TrendSparkline data={sparkline} color={accent} />}
      </div>
    </div>
  );
}
