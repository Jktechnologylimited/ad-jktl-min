"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const S = {
  page:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080F25", padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif" } as React.CSSProperties,
  card:  { width: "100%", maxWidth: 400 } as React.CSSProperties,
  box:   { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "32px" } as React.CSSProperties,
  label: { display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(226,232,240,0.4)", marginBottom: 6 },
  input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: "0.9rem", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" } as React.CSSProperties,
  btn:   { width: "100%", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", background: "#C9A84C", color: "#060E2A", border: "none", cursor: "pointer" } as React.CSSProperties,
  err:   { padding: "12px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: "0.82rem" } as React.CSSProperties,
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError("Email and password required"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally  { setLoading(false); }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.png" alt="JK Technology Limited" width={56} height={56} style={{ objectFit: "contain", margin: "0 auto 14px", display: "block" }} />
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Command Centre</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>JK Technology Limited -- Owner access only</p>
        </div>

        <div style={S.box}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="your@email.com" autoComplete="email" />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Your password" autoComplete="current-password" />
            </div>
            {error && <div style={S.err}>{error}</div>}
            <button onClick={handleLogin} disabled={loading}
              style={{ ...S.btn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign In to Command Centre"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.68rem", marginTop: 20, color: "rgba(226,232,240,0.2)" }}>
          admin.jktl.com.ng -- Restricted access
        </p>
      </div>
    </div>
  );
}
