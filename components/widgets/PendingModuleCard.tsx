import { colors, font } from "@/lib/design-tokens";

// Not part of the wireframe's widget sheet, but needed to keep every dashboard
// card honest: several wireframe widgets (Sales Pipeline, Projects Status,
// Open Tickets) depend on modules that haven't been built yet (CRM/Proposals
// = Batch 03/05, Projects = Batch 07, Support = Batch 10). This renders the
// same card shape with a plain statement of fact instead of invented numbers.
export default function PendingModuleCard({ title, batchLabel }: { title: string; batchLabel: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
      <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", marginBottom: 14 }}>{title}</p>
      <div style={{ padding: "26px 10px", textAlign: "center" }}>
        <p style={{ fontSize: "0.78rem", color: colors.textFaint, fontFamily: font.mono }}>Lands in {batchLabel}</p>
      </div>
    </div>
  );
}
