import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

export interface TableColumn<T> { key: keyof T; label: string; render?: (row: T) => React.ReactNode; }

// Sheet 6: "Table Widget" -- generic, reusable across any module's list view.
export default function TableWidget<T extends { id: string }>({
  title, columns, rows, viewAllHref, emptyLabel = "Nothing here yet", loading,
}: {
  title: string; columns: TableColumn<T>[]; rows: T[]; viewAllHref?: string; emptyLabel?: string; loading?: boolean;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{title}</p>
        {viewAllHref && <Link href={viewAllHref} style={{ fontSize: "0.72rem", color: colors.primary, textDecoration: "none" }}>View all &rarr;</Link>}
      </div>
      {loading ? (
        <p style={{ fontSize: "0.8rem", color: colors.textFaint, textAlign: "center", padding: "20px 0" }}>Loading&hellip;</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: colors.textFaint, textAlign: "center", padding: "20px 0", fontStyle: "italic" }}>{emptyLabel}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font.sans }}>
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={String(c.key)} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  {columns.map(c => (
                    <td key={String(c.key)} style={{ padding: "9px 10px", fontSize: "0.78rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
