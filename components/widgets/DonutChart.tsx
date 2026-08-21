import { colors, font } from "@/lib/design-tokens";

export interface DonutSlice { label: string; value: number; color: string; }

// Sheet 6: "Donut Chart" -- pure SVG, no charting library dependency.
export default function DonutChart({ slices, size = 120, thickness = 18 }: { slices: DonutSlice[]; size?: number; thickness?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {total > 0 && slices.map(s => {
          const frac = s.value / total;
          const dash = frac * circumference;
          const el = (
            <circle key={s.label} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`} strokeLinecap="butt" />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {total === 0 ? (
          <span style={{ fontSize: "0.76rem", color: colors.textFaint, fontStyle: "italic" }}>No data yet</span>
        ) : slices.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.76rem", color: colors.textMed, fontFamily: font.sans }}>
              {s.label} <span style={{ color: colors.textFaint }}>({s.value}{total ? `, ${Math.round((s.value / total) * 100)}%` : ""})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
