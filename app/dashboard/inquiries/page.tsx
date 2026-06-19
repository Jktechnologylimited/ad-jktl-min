"use client";
import { useState, useEffect, useCallback } from "react";

type Inquiry = {
  id: string; name: string; email: string; phone: string; business_name: string;
  service: string; budget: string; timeline: string; message: string;
  source: string; meta: Record<string, unknown>; status: string; created_at: string;
};

const sans = "'Plus Jakarta Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";
function fmtDate(d: string) { return new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
const sourceLabel: Record<string, string> = { "services-inquiry": "Services", contact: "Contact", waitlist: "Waitlist", inquiry: "General" };
const statusColor: Record<string, string> = { new: "#34D399", read: "#94A3B8", archived: "#64748B" };

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "archived">("all");
  const [open, setOpen] = useState<Inquiry | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/inquiries").then((r) => r.json()).then((d) => { setItems(d.inquiries || []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
    setOpen((o) => (o && o.id === id ? { ...o, status } : o));
  }
  async function remove(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
    setItems((arr) => arr.filter((x) => x.id !== id)); setOpen(null);
  }
  function openOne(it: Inquiry) { setOpen(it); if (it.status === "new") setStatus(it.id, "read"); }

  const shown = items.filter((x) => filter === "all" ? true : filter === "new" ? x.status === "new" : x.status === "archived");
  const newCount = items.filter((x) => x.status === "new").length;

  const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
  const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>
          Inquiries {newCount > 0 && <span style={{ fontSize: "0.7rem", background: "#34D399", color: "#04210f", borderRadius: 20, padding: "2px 9px", marginLeft: 6, verticalAlign: "middle" }}>{newCount} new</span>}
        </h1>
        <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>Every enquiry, contact message and waitlist signup from the public site</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "new", "archived"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 7, fontSize: "0.74rem", fontWeight: 700, textTransform: "capitalize", border: "none", cursor: "pointer",
              background: filter === f ? "#C9A84C" : "rgba(255,255,255,0.06)", color: filter === f ? "#060E2A" : "rgba(226,232,240,0.6)" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}></th><th style={th}>From</th><th style={th}>Source</th><th style={th}>Service</th><th style={th}>Received</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading...</td></tr>
              : shown.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No enquiries{filter !== "all" ? ` (${filter})` : ""} yet</td></tr>
              : shown.map((it) => (
                <tr key={it.id} onClick={() => openOne(it)} style={{ cursor: "pointer", background: it.status === "new" ? "rgba(52,211,153,0.04)" : "transparent" }}>
                  <td style={{ ...td, width: 8 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: statusColor[it.status] || "#64748B" }} /></td>
                  <td style={td}><p style={{ fontWeight: it.status === "new" ? 700 : 600, color: "#fff" }}>{it.name || it.email || "—"}</p><p style={{ fontSize: "0.72rem", color: "rgba(226,232,240,0.4)" }}>{it.email}</p></td>
                  <td style={td}>{sourceLabel[it.source] || it.source}</td>
                  <td style={td}>{it.service || "—"}</td>
                  <td style={{ ...td, fontSize: "0.74rem", whiteSpace: "nowrap" }}>{fmtDate(it.created_at)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    {it.status !== "archived"
                      ? <button onClick={() => setStatus(it.id, "archived")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.45)", fontSize: "0.74rem", marginRight: 10 }}>Archive</button>
                      : <button onClick={() => setStatus(it.id, "read")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.45)", fontSize: "0.74rem", marginRight: 10 }}>Restore</button>}
                    <button onClick={() => remove(it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", fontSize: "0.74rem" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setOpen(null)} />
          <div style={{ position: "relative", width: "min(520px,100%)", background: "#060E2A", borderLeft: "1px solid rgba(255,255,255,0.1)", height: "100%", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>{open.name || "Enquiry"}</h2>
                <p style={{ fontSize: "0.78rem", color: "rgba(226,232,240,0.4)" }}>{sourceLabel[open.source] || open.source} · {fmtDate(open.created_at)}</p>
              </div>
              <button onClick={() => setOpen(null)} style={{ background: "none", border: "none", color: "rgba(226,232,240,0.5)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {([["Email", open.email], ["Phone", open.phone], ["Business", open.business_name], ["Service", open.service], ["Budget", open.budget], ["Timeline", open.timeline]] as [string, string][])
                .filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, fontSize: "0.85rem" }}>
                  <span style={{ color: "rgba(226,232,240,0.4)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: 1 }}>{k}</span>
                  <span style={{ color: "#fff" }}>{k === "Email" ? <a href={`mailto:${v}`} style={{ color: "#C9A84C" }}>{v}</a> : k === "Phone" ? <a href={`tel:${v}`} style={{ color: "#C9A84C" }}>{v}</a> : v}</span>
                </div>
              ))}
              {open.message && (
                <div style={{ marginTop: 6 }}>
                  <p style={{ color: "rgba(226,232,240,0.4)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Message</p>
                  <p style={{ color: "rgba(226,232,240,0.85)", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.04)", padding: 14, borderRadius: 8 }}>{open.message}</p>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <a href={`mailto:${open.email}`} style={{ flex: 1, textAlign: "center", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", background: "#C9A84C", color: "#060E2A", textDecoration: "none" }}>Reply by email</a>
              {open.status !== "archived"
                ? <button onClick={() => setStatus(open.id, "archived")} style={{ padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.7)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Archive</button>
                : <button onClick={() => setStatus(open.id, "read")} style={{ padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.7)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Restore</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
