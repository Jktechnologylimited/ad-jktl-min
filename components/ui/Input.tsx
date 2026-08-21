"use client";
import { colors, font } from "@/lib/design-tokens";

export default function Input({ style, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 8,
        background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`,
        color: colors.textHi, fontFamily: font.sans, fontSize: "0.86rem", outline: "none",
        transition: "border-color 0.15s",
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = colors.primary; }}
      onBlur={e => { e.currentTarget.style.borderColor = colors.border; }}
      {...rest}
    />
  );
}
