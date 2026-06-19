"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { section: "Overview" },
  { href: "/dashboard",               label: "Dashboard"   },
  { section: "Business" },
  { href: "/dashboard/clients",       label: "Clients"     },
  { href: "/dashboard/onboarding",    label: "Onboarding"  },
  { href: "/dashboard/subscriptions", label: "Subscriptions"},
  { section: "Content" },
  { href: "/dashboard/desk-products",   label: "Desk Products"  },
  { href: "/dashboard/agency-services", label: "Agency Services"},
  { href: "/dashboard/jobs",          label: "Jobs"        },
  { href: "/dashboard/blog",          label: "Blog & News" },
  { href: "/dashboard/case-studies",  label: "Case Studies"},
  { section: "Growth" },
  { href: "/dashboard/affiliates",    label: "Affiliates"  },
  { href: "/dashboard/payouts",       label: "Payouts"     },
  { href: "/dashboard/services",      label: "Services"    },
  { section: "Data" },
  { href: "/dashboard/analytics",     label: "Analytics"   },
  { href: "/dashboard/settings",      label: "Settings"    },
];

const mono = "'JetBrains Mono', monospace";
const sans = "'Plus Jakarta Sans', sans-serif";
const SIDEBAR_W = 240;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
        <Image src="/logo.png" alt="JKTL" width={34} height={34} style={{ objectFit: "contain", flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: sans, fontWeight: 800, fontSize: "0.82rem", color: "#fff", lineHeight: 1 }}>Command Centre</p>
          <p style={{ fontFamily: mono, fontSize: "0.5rem", color: "rgba(201,168,76,0.7)", letterSpacing: "0.12em", marginTop: 3 }}>JKTL INTERNAL</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {NAV.map((item, i) => {
          if ("section" in item) return (
            <p key={i} style={{ fontFamily: mono, fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "rgba(226,232,240,0.2)", padding: "14px 10px 6px" }}>
              {item.section}
            </p>
          );
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href!));
          return (
            <Link key={item.href} href={item.href!}
              onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", padding: "9px 12px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 500, textDecoration: "none", marginBottom: 2, transition: "all 0.15s",
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                color: active ? "#C9A84C" : "rgba(226,232,240,0.5)",
                borderLeft: active ? "2px solid #C9A84C" : "2px solid transparent" }}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <a href={process.env.NEXT_PUBLIC_MAIN_SITE || "http://localhost:3000"} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", color: "rgba(226,232,240,0.4)", textDecoration: "none", marginBottom: 4 }}>
          jktl.com.ng ↗
        </a>
        <button onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", width: "100%", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", textAlign: "left" as const }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080F25", fontFamily: sans }}>

      {/* Desktop sidebar */}
      <aside style={{ width: SIDEBAR_W, flexShrink: 0, background: "#060E2A", borderRight: "1px solid rgba(255,255,255,0.07)", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, display: "none" }}
        className="md:block" id="admin-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setOpen(false)} />
          <aside style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_W, background: "#060E2A", borderRight: "1px solid rgba(255,255,255,0.07)", zIndex: 70 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 0, minWidth: 0 }} className="md:ml-60">

        {/* Mobile topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, background: "#060E2A", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 30 }}
          className="md:hidden">
          <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.6)", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>Command Centre</span>
          <div style={{ width: 28 }} />
        </div>

        {children}
      </div>

      {/* Tailwind md:block helper */}
      <style>{`
        @media (min-width: 768px) {
          #admin-sidebar { display: block !important; }
          .md\\:block { display: block !important; }
          .md\\:ml-60 { margin-left: ${SIDEBAR_W}px !important; }
          .md\\:hidden { display: none !important; }
          .md\\:flex { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
