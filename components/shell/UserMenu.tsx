"use client";
import { colors, font } from "@/lib/design-tokens";
import { useRouter } from "next/navigation";

export default function UserMenu({ name, role, onClose, onOpenSwitcher }: { name?: string; role?: string; onClose: () => void; onOpenSwitcher: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const item = (label: string, onClick: () => void, badge?: string) => (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
      padding: "9px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      fontSize: "0.82rem", color: colors.textMed, fontFamily: font.sans,
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}>
      {label}
      {badge && <span style={{ fontSize: "0.55rem", fontWeight: 700, background: "rgba(201,168,76,0.15)", color: colors.primary, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" }}>{badge}</span>}
    </button>
  );

  return (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 240, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", zIndex: 200, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: colors.primary, fontFamily: font.mono }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || "Signed in"}</p>
          <p style={{ fontSize: "0.65rem", color: colors.primary, fontFamily: font.mono, letterSpacing: "0.06em" }}>{role === "owner" ? "OWNER" : (role || "").toUpperCase()}</p>
        </div>
      </div>
      <div style={{ padding: "6px 0" }}>
        {item("My Profile", () => { onClose(); })}
        {item("Business Switcher", () => { onClose(); onOpenSwitcher(); }, "NEW")}
        {item("Account Settings", () => { onClose(); window.location.href = "/dashboard/settings"; })}
      </div>
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: "6px 0" }}>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", width: "100%", padding: "9px 14px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
          fontSize: "0.82rem", fontWeight: 600, color: colors.danger, fontFamily: font.sans,
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}
