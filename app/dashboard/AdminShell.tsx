"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { roleAllowsPath } from "@/lib/roles";
import { colors, font } from "@/lib/design-tokens";
import Topbar, { SearchEntry } from "@/components/shell/Topbar";
import MobileBottomNav from "@/components/shell/MobileBottomNav";
import BusinessSwitcher from "@/components/shell/BusinessSwitcher";

// Nested nav taxonomy (Batch 01). Every existing page from the prior flat
// nav is preserved here as a real child item -- nothing removed or hidden.
// `pending: true` marks modules whose batch hasn't landed yet (Projects,
// Support) -- the nav entry and page are real, the feature isn't, and the
// page says so honestly rather than faking one.
interface Leaf { href: string; label: string; all?: boolean; pending?: boolean; }
interface Group { label: string; children: Leaf[]; }
type NavItem = Leaf | Group;
const isGroup = (i: NavItem): i is Group => "children" in i;

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/my-work", label: "My Work", all: true },
  { label: "CRM", children: [
    { href: "/dashboard/inquiries", label: "Leads", all: true },
    { href: "/dashboard/services", label: "Service Inquiries" },
  ]},
  { label: "Customers", children: [
    { href: "/dashboard/clients", label: "Clients" },
    { href: "/dashboard/onboarding", label: "Onboarding" },
  ]},
  { label: "Projects", children: [
    { href: "/dashboard/projects", label: "Overview", pending: true },
  ]},
  { label: "Support", children: [
    { href: "/dashboard/support", label: "Overview", pending: true },
  ]},
  { label: "Billing", children: [
    { href: "/dashboard/subscriptions", label: "Subscriptions" },
    { href: "/dashboard/payouts", label: "Payouts" },
  ]},
  { label: "Offerings", children: [
    { href: "/dashboard/desk-products", label: "Desk Products" },
    { href: "/dashboard/agency-services", label: "Agency Services" },
  ]},
  { label: "CMS", children: [
    { href: "/dashboard/homepage", label: "Homepage" },
    { href: "/dashboard/blog", label: "Blog & News" },
    { href: "/dashboard/case-studies", label: "Case Studies" },
    { href: "/dashboard/testimonials", label: "Testimonials" },
    { href: "/dashboard/videos", label: "Watch Videos" },
    { href: "/dashboard/jobs", label: "Jobs" },
  ]},
  { href: "/dashboard/affiliates", label: "Affiliates" },
  { label: "Reports", children: [
    { href: "/dashboard/analytics", label: "Analytics" },
  ]},
  { label: "Settings", children: [
    { href: "/dashboard/settings", label: "General" },
    { href: "/dashboard/team", label: "Team" },
  ]},
];

const SIDEBAR_W = 240;
const SIDEBAR_W_COLLAPSED = 68;

function leafAllowed(role: string, item: Leaf): boolean {
  return roleAllowsPath(role, item.href);
}

export default function AdminShell({ children, role = "owner", name }: { children: React.ReactNode; role?: string; name?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Restore sidebar collapse preference (client-side convenience only).
  useEffect(() => {
    const saved = window.localStorage.getItem("jktl_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    window.localStorage.setItem("jktl_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Role-filtered nav: owner sees everything; other roles only see leaves
  // their role is allowed to reach (same rule as before), groups with zero
  // visible children are dropped entirely.
  const visibleNav = useMemo(() => {
    if (role === "owner") return NAV;
    return NAV.map(item => {
      if (!isGroup(item)) return leafAllowed(role, item) ? item : null;
      const kids = item.children.filter(c => leafAllowed(role, c));
      return kids.length > 0 ? { ...item, children: kids } : null;
    }).filter((x): x is NavItem => x !== null);
  }, [role]);

  // Auto-expand whichever group contains the active page.
  useEffect(() => {
    for (const item of visibleNav) {
      if (isGroup(item) && item.children.some(c => pathname === c.href || pathname.startsWith(c.href + "/"))) {
        setOpenGroups(g => ({ ...g, [item.label]: true }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Flat search index (real pages only) for the topbar's global search.
  const searchIndex: SearchEntry[] = useMemo(() => {
    const out: SearchEntry[] = [];
    for (const item of visibleNav) {
      if (isGroup(item)) {
        for (const c of item.children) if (!c.pending) out.push({ label: c.label, href: c.href, group: item.label });
      } else {
        out.push({ label: item.label, href: item.href, group: "General" });
      }
    }
    return out;
  }, [visibleNav]);

  // Breadcrumb + page title derived from the current path -- no per-page changes needed.
  const { section, title } = useMemo(() => {
    for (const item of visibleNav) {
      if (isGroup(item)) {
        const match = item.children.find(c => pathname === c.href || pathname.startsWith(c.href + "/"));
        if (match) return { section: item.label, title: match.label };
      } else if (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))) {
        return { section: null as string | null, title: item.label };
      }
    }
    return { section: null as string | null, title: "Command Centre" };
  }, [visibleNav, pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const w = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "18px 14px" : "18px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <Image src="/logo.png" alt="JKTL" width={34} height={34} style={{ objectFit: "contain", flexShrink: 0 }} />
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: font.sans, fontWeight: 800, fontSize: "0.82rem", color: "#fff", lineHeight: 1 }}>Command Centre</p>
            <p style={{ fontFamily: font.mono, fontSize: "0.5rem", color: "rgba(201,168,76,0.7)", letterSpacing: "0.12em", marginTop: 3 }}>{role === "owner" ? "JKTL INTERNAL" : "STAFF"}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {visibleNav.map((item, i) => {
          if (isGroup(item)) {
            const isOpen = collapsed ? true : !!openGroups[item.label];
            const groupActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + "/"));
            return (
              <div key={item.label} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => !collapsed && setOpenGroups(g => ({ ...g, [item.label]: !g[item.label] }))}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", width: "100%",
                    padding: "9px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.03em",
                    background: "none", border: "none", cursor: collapsed ? "default" : "pointer",
                    color: groupActive ? colors.primary : colors.textFaint, fontFamily: font.sans,
                  }}>
                  {collapsed ? item.label.slice(0, 2).toUpperCase() : (
                    <>
                      <span>{item.label}</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  )}
                </button>
                {!collapsed && isOpen && item.children.map(c => {
                  const active = pathname === c.href || pathname.startsWith(c.href + "/");
                  return (
                    <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 8px 24px", borderRadius: 6,
                        fontSize: "0.79rem", fontWeight: 500, textDecoration: "none", marginBottom: 1,
                        background: active ? "rgba(201,168,76,0.08)" : "transparent",
                        color: active ? colors.primary : colors.textLow,
                        borderLeft: active ? `2px solid ${colors.primary}` : "2px solid transparent",
                      }}>
                      {c.label}
                      {c.pending && <span style={{ fontSize: "0.5rem", fontWeight: 700, color: colors.textFaint, fontFamily: font.mono, letterSpacing: "0.05em" }}>SOON</span>}
                    </Link>
                  );
                })}
              </div>
            );
          }
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", padding: "9px 12px", borderRadius: 6,
                fontSize: "0.82rem", fontWeight: 500, textDecoration: "none", marginBottom: 2,
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                color: active ? colors.primary : colors.textLow,
                borderLeft: active ? `2px solid ${colors.primary}` : "2px solid transparent",
              }}>
              {collapsed ? item.label.slice(0, 2).toUpperCase() : item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px", borderTop: `1px solid ${colors.border}` }}>
        {!collapsed && (
          <a href={process.env.NEXT_PUBLIC_MAIN_SITE || "http://localhost:3000"} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", color: colors.textFaint, textDecoration: "none", marginBottom: 4 }}>
            jktl.com.ng &#8599;
          </a>
        )}
        <button onClick={() => setCollapsed(v => !v)} className="hidden md:flex"
          style={{ alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", width: "100%", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: colors.textFaint }}>
          {collapsed ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
          ) : "\u2190 Collapse"}
        </button>
        {!collapsed && (
          <button onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", width: "100%", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", textAlign: "left", marginTop: 2 }}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg, fontFamily: font.sans }}>

      {/* Desktop sidebar */}
      <aside style={{ width: w, flexShrink: 0, background: colors.surface, borderRight: `1px solid ${colors.border}`, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, display: "none", transition: "width 0.15s" }}
        className="md:block" id="admin-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_W, background: colors.surface, borderRight: `1px solid ${colors.border}`, zIndex: 70 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }} className="admin-main">

        {/* Topbar (desktop + mobile) */}
        <div className="hidden md:block">
          <Topbar name={name} role={role} searchIndex={searchIndex} onOpenSwitcher={() => setSwitcherOpen(true)} onToggleMobileSidebar={() => setMobileOpen(true)} />
        </div>
        <div className="md:hidden">
          <Topbar name={name} role={role} searchIndex={searchIndex} onOpenSwitcher={() => setSwitcherOpen(true)} onToggleMobileSidebar={() => setMobileOpen(true)} />
        </div>

        {/* Breadcrumb */}
        <div style={{ padding: "14px 24px 0" }}>
          <p style={{ fontFamily: font.mono, fontSize: "0.68rem", color: colors.textFaint }}>
            Command Centre{section && <> &nbsp;/&nbsp; {section}</>} &nbsp;/&nbsp; <span style={{ color: colors.textMed }}>{title}</span>
          </p>
        </div>

        <div style={{ flex: 1, paddingBottom: 70 }}>
          {children}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />

      {switcherOpen && <BusinessSwitcher onClose={() => setSwitcherOpen(false)} />}

      <style>{`
        @media (min-width: 768px) {
          #admin-sidebar { display: block !important; }
          .md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
          .md\\:flex { display: flex !important; }
          .admin-main { margin-left: ${w}px !important; }
        }
        @media (max-width: 1023px) {
          .lg\\:inline { display: none !important; }
        }
      `}</style>
    </div>
  );
}
