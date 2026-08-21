"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { colors, font } from "@/lib/design-tokens";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError("Email and password required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg, padding: 24, fontFamily: font.sans }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.png" alt="JK Technology Limited" width={56} height={56} style={{ objectFit: "contain", margin: "0 auto 14px", display: "block" }} />
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: "0.82rem", color: colors.textFaint }}>Sign in to your JKTL Command Centre account</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 6 }}>Email Address</label>
              <Input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="your@email.com" autoComplete="email" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.textFaint, marginBottom: 6 }}>Password</label>
              <Input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Your password" autoComplete="current-password" />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
              <button onClick={() => setShowForgot(v => !v)} type="button"
                style={{ background: "none", border: "none", padding: 0, fontSize: "0.78rem", color: colors.primary, cursor: "pointer", fontFamily: font.sans }}>
                Forgot password?
              </button>
            </div>
            {showForgot && (
              <p style={{ fontSize: "0.76rem", color: colors.textLow, lineHeight: 1.5, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 8 }}>
                Staff password resets are handled by the Owner via Team &rarr; select your name &rarr; reset password. Contact your administrator.
              </p>
            )}

            {error && (
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: colors.danger, fontSize: "0.82rem" }}>
                {error}
              </div>
            )}

            <Button onClick={handleLogin} disabled={loading} style={{ width: "100%", textTransform: "uppercase", letterSpacing: "0.06em", padding: "13px" }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.72rem", marginTop: 20, color: colors.textFaint }}>
          Don&apos;t have an account? <span style={{ color: colors.textLow }}>Contact JKTL</span>
        </p>
        <p style={{ textAlign: "center", fontSize: "0.65rem", marginTop: 8, color: "rgba(226,232,240,0.15)" }}>
          &copy; {new Date().getFullYear()} JK Technology Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}
