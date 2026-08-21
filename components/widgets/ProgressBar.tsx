import { colors, font } from "@/lib/design-tokens";

// Sheet 6: "Progress Bar" -- label + percentage bar.
export default function ProgressBar({ label, pct, color = colors.primary }: { label: string; pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: "0.8rem", color: colors.textMed, fontFamily: font.sans }}>{label}</span>
        <span style={{ fontSize: "0.78rem", color: "#fff", fontFamily: font.mono, fontWeight: 700 }}>{clamped}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${clamped}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}
