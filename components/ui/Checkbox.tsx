"use client";
import { colors, font } from "@/lib/design-tokens";

export default function Checkbox({ label, checked, onChange, ...rest }: { label?: string; checked: boolean; onChange: (v: boolean) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked" | "type">) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: font.sans, fontSize: "0.82rem", color: colors.textMed }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: colors.primary, cursor: "pointer" }} {...rest} />
      {label}
    </label>
  );
}
