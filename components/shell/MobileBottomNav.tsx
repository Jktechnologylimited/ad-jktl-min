"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors } from "@/lib/design-tokens";

const TABS = [
  { href: "/dashboard", label: "Home", icon: (a: boolean) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a ? colors.primary : "currentColor"} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
  { href: "/dashboard/clients", label: "CRM", icon: (a: boolean) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a ? colors.primary : "currentColor"} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },
  { href: "/dashboard/projects", label: "Projects", icon: (a: boolean) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a ? colors.primary : "currentColor"} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { href: "/dashboard/support", label: "Support", icon: (a: boolean) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a ? colors.primary : "currentColor"} strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg> },
];

// Bottom tab bar for mobile -- "Menu" opens the existing sidebar overlay.
export default function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="md:hidden" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      display: "flex", background: colors.surface, borderTop: `1px solid ${colors.border}`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {TABS.map(t => {
        const active = pathname === t.href || (t.href !== "/dashboard" && pathname.startsWith(t.href));
        return (
          <Link key={t.href} href={t.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 0 8px", textDecoration: "none" }}>
            {t.icon(active)}
            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: active ? colors.primary : colors.textFaint }}>{t.label}</span>
          </Link>
        );
      })}
      <button onClick={onOpenMenu} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 0 8px", background: "none", border: "none", cursor: "pointer" }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth="1.8"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        <span style={{ fontSize: "0.6rem", fontWeight: 600, color: colors.textFaint }}>Menu</span>
      </button>
    </nav>
  );
}
