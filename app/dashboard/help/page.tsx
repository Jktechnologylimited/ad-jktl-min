import { colors, font } from "@/lib/design-tokens";

export default function HelpPage() {
  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 560 }}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Help &amp; Support</h1>
      <p style={{ fontSize: "0.85rem", color: colors.textLow, marginBottom: 28 }}>Need a hand with the Command Centre? Reach out directly.</p>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 4 }}>Email</p>
          <a href="mailto:info@jktl.com.ng" style={{ fontSize: "0.9rem", color: colors.primary, textDecoration: "none" }}>info@jktl.com.ng</a>
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 4 }}>Phone / WhatsApp</p>
          <a href="https://wa.me/2347036580994" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.9rem", color: colors.primary, textDecoration: "none" }}>+234 703 658 0994</a>
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 4 }}>Account issues</p>
          <p style={{ fontSize: "0.85rem", color: colors.textMed, lineHeight: 1.6 }}>Password resets for staff accounts are handled by the Owner via Team &rarr; select staff member &rarr; reset password.</p>
        </div>
      </div>
    </div>
  );
}
