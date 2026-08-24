"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Card { id: string; name: string; customer_name: string; estimated_value: string; }
interface Column { stage: string; count: number; value: number; cards: Card[]; moreCount: number; }

const STAGE_COLOR: Record<string, string> = { Qualification: "#60A5FA", Proposal: "#C9A84C", Negotiation: "#A78BFA", "Closed Won": "#34D399", "Closed Lost": "#F87171" };
function fmtN(n: number) { return "\u20a6" + (n / 1000000).toFixed(1) + "M"; }

export default function PipelineBoardPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/opportunities/board").then(r => r.json()).then(d => { setColumns(d.columns || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Deals Pipeline</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>Grouped by stage &middot; click a card to open it</p>
        </div>
        <Link href="/dashboard/opportunities/new" style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ New Opportunity</Link>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 }}>
          {columns.map(col => (
            <div key={col.stage} style={{ minWidth: 260, flex: "1 0 260px", background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, borderRadius: 10, borderTop: `3px solid ${STAGE_COLOR[col.stage] || colors.textFaint}` }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.border}` }}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{col.stage} <span style={{ color: colors.textFaint, fontWeight: 400 }}>({col.count})</span></p>
                <p style={{ fontSize: "0.76rem", color: STAGE_COLOR[col.stage] || colors.textFaint, fontFamily: font.mono, marginTop: 2 }}>{fmtN(col.value)}</p>
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {col.cards.length === 0 ? (
                  <p style={{ fontSize: "0.76rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>No deals here</p>
                ) : col.cards.map(c => (
                  <Link key={c.id} href={`/dashboard/opportunities/${c.id}`} style={{ display: "block", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, textDecoration: "none" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff", marginBottom: 2 }}>{c.name}</p>
                    <p style={{ fontSize: "0.7rem", color: colors.textFaint, marginBottom: 6 }}>{c.customer_name}</p>
                    <p style={{ fontSize: "0.76rem", color: colors.primary, fontFamily: font.mono, fontWeight: 700 }}>{fmtN(Number(c.estimated_value))}</p>
                  </Link>
                ))}
                {col.moreCount > 0 && (
                  <Link href={`/dashboard/opportunities/all?stage=${encodeURIComponent(col.stage)}`} style={{ textAlign: "center", fontSize: "0.74rem", color: colors.primary, textDecoration: "none", padding: "6px 0" }}>+{col.moreCount} more</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
