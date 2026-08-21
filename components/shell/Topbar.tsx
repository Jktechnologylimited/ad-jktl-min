"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { colors, font } from "@/lib/design-tokens";
import NotificationsPanel from "./NotificationsPanel";
import UserMenu from "./UserMenu";

export interface SearchEntry { label: string; href: string; group: string; }

export default function Topbar({
  name, role, searchIndex, onOpenSwitcher, onToggleMobileSidebar,
}: {
  name?: string; role?: string; searchIndex: SearchEntry[];
  onOpenSwitcher: () => void; onToggleMobileSidebar: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowResults(false); setShowNotifs(false); setShowUser(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = q.trim().length > 0
    ? searchIndex.filter(e => e.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div ref={boxRef} style={{
      display: "flex", alignItems: "center", gap: 14, height: 60, padding: "0 24px",
      background: colors.surface, borderBottom: `1px solid ${colors.border}`, position: "sticky", top: 0, zIndex: 40,
    }}>
      {/* Mobile hamburger */}
      <button onClick={onToggleMobileSidebar} className="md:hidden" style={{ background: "none", border: "none", color: colors.textLow, cursor: "pointer", padding: 4, flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>

      {/* Search */}
      <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search anything..."
          style={{ width: "100%", padding: "9px 13px 9px 34px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" }}
        />
        {showResults && q.trim().length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", zIndex: 200, maxHeight: 300, overflowY: "auto" }}>
            {results.length === 0 ? (
              <p style={{ padding: 16, fontSize: "0.78rem", color: colors.textFaint, textAlign: "center" }}>No pages match &ldquo;{q}&rdquo;</p>
            ) : results.map(r => (
              <button key={r.href} onClick={() => { router.push(r.href); setQ(""); setShowResults(false); }}
                style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <p style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{r.label}</p>
                <p style={{ fontSize: "0.65rem", color: colors.textFaint, fontFamily: font.mono }}>{r.group}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div style={{ position: "relative" }}>
        <button onClick={() => { setShowNotifs(v => !v); setShowUser(false); }} style={{ background: "none", border: "none", color: colors.textLow, cursor: "pointer", padding: 6, position: "relative" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        </button>
        {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
      </div>

      {/* Help */}
      <button onClick={() => router.push("/dashboard/help")} style={{ background: "none", border: "none", color: colors.textLow, cursor: "pointer", padding: 6 }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
      </button>

      {/* User menu */}
      <div style={{ position: "relative" }}>
        <button onClick={() => { setShowUser(v => !v); setShowNotifs(false); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 4px" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: colors.primary, fontFamily: font.mono }}>{initials}</span>
          </div>
          <span className="hidden lg:inline" style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.textMed }}>{name || "Signed in"}</span>
        </button>
        {showUser && <UserMenu name={name} role={role} onClose={() => setShowUser(false)} onOpenSwitcher={onOpenSwitcher} />}
      </div>
    </div>
  );
}
