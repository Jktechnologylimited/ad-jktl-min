import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

export interface ListWidgetItem {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;          // right-aligned small text (e.g. time, count)
  badge?: { label: string; color: string };
  href?: string;
  iconLabel?: string;     // 2-char initials shown in a small tile
  iconColor?: string;
}

export interface ListWidgetProps {
  title: string;
  items: ListWidgetItem[];
  emptyLabel?: string;
  viewAllHref?: string;
  loading?: boolean;
}

// Sheet 6: "List Widget" -- reusable for Recent Activities, Recent Signups,
// Upcoming Tasks, etc. Real data only; empty state is honest, not fake rows.
export default function ListWidget({ title, items, emptyLabel = "Nothing here yet", viewAllHref, loading }: ListWidgetProps) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{title}</p>
        {viewAllHref && <Link href={viewAllHref} style={{ fontSize: "0.72rem", color: colors.primary, textDecoration: "none" }}>View all &rarr;</Link>}
      </div>
      {loading ? (
        <p style={{ fontSize: "0.8rem", color: colors.textFaint, textAlign: "center", padding: "20px 0" }}>Loading&hellip;</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: colors.textFaint, textAlign: "center", padding: "20px 0", fontStyle: "italic" }}>{emptyLabel}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map(it => {
            const Row = (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, textDecoration: "none" }}>
                {it.iconLabel && (
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: (it.iconColor || colors.primary) + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.58rem", fontWeight: 700, color: it.iconColor || colors.primary }}>{it.iconLabel}</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.primary}</p>
                  {it.secondary && <p style={{ fontSize: "0.68rem", color: colors.textFaint }}>{it.secondary}</p>}
                </div>
                {it.badge && (
                  <span style={{ fontFamily: font.mono, fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, flexShrink: 0, background: it.badge.color + "20", color: it.badge.color }}>
                    {it.badge.label}
                  </span>
                )}
                {it.meta && <span style={{ fontSize: "0.68rem", color: colors.textFaint, flexShrink: 0 }}>{it.meta}</span>}
              </div>
            );
            return it.href
              ? <Link key={it.id} href={it.href} style={{ textDecoration: "none" }}>{Row}</Link>
              : <div key={it.id}>{Row}</div>;
          })}
        </div>
      )}
    </div>
  );
}
