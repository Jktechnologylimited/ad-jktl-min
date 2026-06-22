"use client";
import { useState, useEffect, useCallback } from "react";
import { inputStyle, selectStyle, labelStyle, btnGold, btnGhost, sans, mono, ListEditor, DomainsEditor, Domain } from "../Editor";

type Product = {
  id: string; product_key: string; name: string; tagline: string; description: string;
  status: string; color: string; slug: string; href: string; get_started_href: string; icon: string;
  features: string[]; domains: Domain[]; use_cases: string[]; sort_order: number;
  setup_price: number | null; monthly_price: number | null; price_note: string;
};
const blank = {
  name: "", slug: "", tagline: "", description: "", status: "live", color: "#8B5CF6",
  href: "", get_started_href: "", icon: "", features: [] as string[], domains: [] as Domain[],
  use_cases: [] as string[], sort_order: 0,
  setup_price: "" as number | string, monthly_price: "" as number | string, price_note: "",
};
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
const badge = (live: boolean): React.CSSProperties => ({ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: live ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: live ? "#34D399" : "#FCD34D" });

export default function DeskProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof blank & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/desk-products").then((r) => r.json()).then((d) => { setItems(d.products || []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) { setEditing((e) => e ? { ...e, [k]: v } : e); }

  async function save() {
    if (!editing) return;
    setMsg("");
    if (!editing.name.trim()) { setMsg("Name is required."); return; }
    setSaving(true);
    const url = editing.id ? `/api/desk-products/${editing.id}` : "/api/desk-products";
    const res = await fetch(url, { method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editing, slug: editing.slug || editing.name }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Failed to save."); return; }
    setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/desk-products/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Desk Products</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>The product suite shown on jktl.com.ng/desk</p>
        </div>
        <button style={btnGold} onClick={() => { setEditing({ ...blank }); setMsg(""); }}>+ New Product</button>
      </div>

      {editing && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 24, marginBottom: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{editing.id ? "Edit Product" : "New Product"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={editing.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label style={labelStyle}>Slug <span style={{ color: "rgba(226,232,240,0.25)", fontFamily: mono }}>(auto)</span></label><input style={inputStyle} value={editing.slug} onChange={(e) => set("slug", e.target.value)} /></div>
            <div><label style={labelStyle}>Icon (e.g. FD)</label><input style={inputStyle} value={editing.icon} onChange={(e) => set("icon", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Tagline</label><input style={inputStyle} value={editing.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={editing.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={editing.status} onChange={(e) => set("status", e.target.value)}>
                <option value="live">Live</option><option value="coming-soon">Coming soon</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Brand colour</label>
              <input style={{ ...inputStyle, padding: 4, height: 40 }} type="color" value={editing.color} onChange={(e) => set("color", e.target.value)} />
            </div>
            <div><label style={labelStyle}>Sort order</label><input style={inputStyle} type="number" value={editing.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
            <div><label style={labelStyle}>Product page link</label><input style={inputStyle} value={editing.href} onChange={(e) => set("href", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Get-started link</label><input style={inputStyle} value={editing.get_started_href} onChange={(e) => set("get_started_href", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: 14 }}>
            <div><label style={labelStyle}>Setup price (₦)</label><input style={inputStyle} type="number" placeholder="e.g. 200000" value={editing.setup_price} onChange={(e) => set("setup_price", e.target.value)} /></div>
            <div><label style={labelStyle}>Monthly price (₦)</label><input style={inputStyle} type="number" placeholder="e.g. 30000" value={editing.monthly_price} onChange={(e) => set("monthly_price", e.target.value)} /></div>
            <div><label style={labelStyle}>Price note</label><input style={inputStyle} placeholder="e.g. Waitlist — lock in pricing" value={editing.price_note} onChange={(e) => set("price_note", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Features</label><ListEditor items={editing.features} onChange={(v) => set("features", v)} placeholder="Add feature" /></div>
          <div><label style={labelStyle}>Domains</label><DomainsEditor items={editing.domains} onChange={(v) => set("domains", v)} /></div>
          <div><label style={labelStyle}>Use cases</label><ListEditor items={editing.use_cases} onChange={(v) => set("use_cases", v)} placeholder="Add use case" /></div>
          {msg && <p style={{ color: "#F87171", fontSize: "0.82rem" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Product"}</button>
            <button style={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}>Product</th><th style={th}>Tagline</th><th style={th}>Status</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading...</td></tr>
              : items.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No products yet — run the seed route to import existing ones</td></tr>
              : items.map((p) => (
                <tr key={p.id}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: "0.62rem", fontWeight: 700, background: (p.color || "#666") + "22", color: p.color || "#888" }}>{p.icon || "—"}</span>
                      <div><p style={{ fontWeight: 600, color: "#fff" }}>{p.name}</p><p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.35)", fontFamily: mono }}>/{p.slug}</p></div>
                    </div>
                  </td>
                  <td style={td}>{p.tagline || "—"}</td>
                  <td style={td}><span style={badge(p.status === "live")}>{p.status}</span></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditing({ ...blank, ...p, features: p.features || [], domains: p.domains || [], use_cases: p.use_cases || [], setup_price: p.setup_price ?? "", monthly_price: p.monthly_price ?? "", price_note: p.price_note || "" }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.6)", fontSize: "0.78rem", marginRight: 10 }}>Edit</button>
                    <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", fontSize: "0.78rem" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
