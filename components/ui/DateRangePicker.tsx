"use client";
import { useState, useRef, useEffect } from "react";
import { colors, font } from "@/lib/design-tokens";

export interface DateRange { from: string; to: string; label: string; }

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Today",      range: () => ({ from: iso(new Date()), to: iso(new Date()), label: "Today" }) },
  { label: "Last 7 Days",  range: () => ({ from: iso(daysAgo(6)), to: iso(new Date()), label: "Last 7 Days" }) },
  { label: "Last 30 Days", range: () => ({ from: iso(daysAgo(29)), to: iso(new Date()), label: "Last 30 Days" }) },
  { label: "This Year",    range: () => ({ from: `${new Date().getFullYear()}-01-01`, to: iso(new Date()), label: "This Year" }) },
];

// Real, functional date-range control -- native date inputs (no calendar
// library dependency) plus quick presets. onChange fires real from/to values
// consumers use to filter real queries.
export default function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [fromDraft, setFromDraft] = useState(value.from);
  const [toDraft, setToDraft] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => { setFromDraft(value.from); setToDraft(value.to); }, [value]);

  function applyCustom() {
    if (!fromDraft || !toDraft || fromDraft > toDraft) return;
    onChange({ from: fromDraft, to: toDraft, label: `${fromDraft} \u2013 ${toDraft}` });
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
        background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: colors.textMed,
        fontFamily: font.sans, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        {value.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 260, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", zIndex: 200, padding: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { onChange(p.range()); setOpen(false); }}
                style={{ textAlign: "left", padding: "8px 10px", borderRadius: 6, background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: colors.textMed, fontFamily: font.sans }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 8 }}>Custom range</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="date" value={fromDraft} max={toDraft || undefined} onChange={e => setFromDraft(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.78rem" }} />
              <input type="date" value={toDraft} min={fromDraft || undefined} onChange={e => setToDraft(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.78rem" }} />
              <button onClick={applyCustom} style={{ padding: "8px", borderRadius: 6, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: font.sans }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function defaultRange(): DateRange {
  return { from: iso(daysAgo(6)), to: iso(new Date()), label: "Last 7 Days" };
}
