"use client";
import { colors, font } from "@/lib/design-tokens";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

// Primary / Secondary, with real hover + disabled states (matches the
// wireframe's Buttons sheet).
export default function Button({ variant = "primary", style, disabled, children, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 8,
    fontFamily: font.sans,
    fontWeight: 700,
    fontSize: "0.82rem",
    border: variant === "secondary" ? `1.5px solid ${colors.borderStrong}` : "none",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "filter 0.15s, background 0.15s",
    background: variant === "primary" ? colors.primary : "transparent",
    color: variant === "primary" ? colors.primaryText : colors.textMed,
  };
  return (
    <button
      disabled={disabled}
      style={{ ...base, ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
