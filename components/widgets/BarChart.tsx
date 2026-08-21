import { colors, font } from "@/lib/design-tokens";

export interface BarDatum { label: string; value: number; }

// Sheet 6: "Bar Chart" -- pure SVG/DOM bars, no charting library.
export default function BarChart({ data, color = colors.primary, height = 140 }: { data: BarDatum[]; color?: string; height?: number }) {
  if (data.length === 0) return <p style={{ fontSize: "0.78rem", color: colors.textFaint, fontStyle: "italic" }}>No data yet</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
      {data.map(d => (
        <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
          <div title={String(d.value)} style={{ width: "100%", maxWidth: 28, borderRadius: "3px 3px 0 0", background: color, height: `${Math.max(2, (d.value / max) * (height - 20))}px`, transition: "height 0.3s" }} />
          <span style={{ fontSize: "0.6rem", color: colors.textFaint, marginTop: 6, fontFamily: font.mono }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
