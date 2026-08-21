"use client";
import { colors, font } from "@/lib/design-tokens";

export default function Radio({ label, checked, onChange, name, ...rest }: { label?: string; checked: boolean; onChange: () => void; name: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked" | "type">) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: font.sans, fontSize: "0.82rem", color: colors.textMed }}>
      <input type="radio" name={name} checked={checked} onChange={onChange}
        style={{ width: 16, height: 16, accentColor: colors.primary, cursor: "pointer" }} {...rest} />
      {label}
    </label>
  );
}
