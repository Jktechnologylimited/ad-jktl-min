"use client";
import { colors, font } from "@/lib/design-tokens";

export interface SelectOption { value: string; label: string; }

export default function Select({ options, style, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <select
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 8,
        background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`,
        color: colors.textHi, fontFamily: font.sans, fontSize: "0.86rem", outline: "none",
        ...style,
      }}
      {...rest}
    >
      {options.map(o => <option key={o.value} value={o.value} style={{ background: colors.surface }}>{o.label}</option>)}
    </select>
  );
}
