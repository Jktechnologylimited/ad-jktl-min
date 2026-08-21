import { colors, font } from "@/lib/design-tokens";

// Honest pending state -- this module ships in Batch 07 per the approved
// implementation order. No fake data, no stubbed feature; the nav entry is
// real, this screen just says so plainly.
export default function ProjectsPage() {
  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans }}>
      <div style={{ maxWidth: 440, margin: "60px auto 0", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(201,168,76,0.1)", border: `1px solid ${colors.primary}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Projects is coming</h1>
        <p style={{ fontSize: "0.85rem", color: colors.textLow, lineHeight: 1.6 }}>
          This module is scheduled for Batch 07 of the JKTL platform build. The nav entry is live now so the information architecture is in place -- the feature itself will land in its approved batch.
        </p>
      </div>
    </div>
  );
}
