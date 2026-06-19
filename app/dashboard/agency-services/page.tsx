"use client";
import { useState, useEffect, useCallback } from "react";
import { inputStyle, selectStyle, labelStyle, btnGold, btnGhost, sans, mono, ListEditor } from "../Editor";

type Service = {
  id: string; slug: string; label: string; short_label: string; number: string; icon: string;
  tier: string; tagline: string; description: string; demo_slug: string;
  price_from: string; price_to: string; price_alt: string; price_monthly: string;
  delivery_note: string; highlight: boolean; features: string[]; best_for: string[];
  status: string; sort_order: number;
};
const blank = {
  slug: "", label: "", short_label: "", number: "", icon: "", tier: "", tagline: "", description: "",
  demo_slug: "", price_from: "", price_to: "", price_alt: "", price_monthly: "", delivery_note: "",
  highlight: false, features: [] as string[], best_for: [] as string[], status: "published", sort_order: 0,
};
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
const badge = (pub: boolean): React.CSSProperties => ({ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: pub ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: pub ? "#34D399" : "#FCD34D" });

export default function AgencyServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof blank & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/agency-services").then((r) => r.json()).then((d) => { setItems(d.services || []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) { setEditing((e) => e ? { ...e, [k]: v } : e); }

  async function save() {
    if (!editing) return;
    setMsg("");
    if (!editing.label.trim()) { setMsg("Label is required."); return; }
    setSaving(true);
    const url = editing.id ? `/api/agency-services/${editing.id}` : "/api/agency-services";
    const res = await fetch(url, { method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editing, slug: editing.slug || editing.label }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Failed to save."); return; }
    setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/agency-services/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Agency Services</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>The service catalogue shown on jktl.com.ng/services</p>
        </div>
        <button style={btnGold} onClick={() => { setEditing({ ...blank }); setMsg(""); }}>+ New Service</button>
      </div>

      {editing && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 24, marginBottom: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{editing.id ? "Edit Service" : "New Service"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Label *</label><input style={inputStyle} value={editing.label} onChange={(e) => set("label", e.target.value)} /></div>
            <div><label style={labelStyle}>Short label</label><input style={inputStyle} value={editing.short_label} onChange={(e) => set("short_label", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Slug <span style={{ color: "rgba(226,232,240,0.25)", fontFamily: mono }}>(auto)</span></label><input style={inputStyle} value={editing.slug} onChange={(e) => set("slug", e.target.value)} /></div>
            <div><label style={labelStyle}>Number</label><input style={inputStyle} value={editing.number} onChange={(e) => set("number", e.target.value)} /></div>
            <div><label style={labelStyle}>Tier</label><input style={inputStyle} value={editing.tier} onChange={(e) => set("tier", e.target.value)} /></div>
            <div><label style={labelStyle}>Sort order</label><input style={inputStyle} type="number" value={editing.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
          </div>
          <div><label style={labelStyle}>Tagline</label><input style={inputStyle} value={editing.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={editing.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Price from</label><input style={inputStyle} value={editing.price_from} onChange={(e) => set("price_from", e.target.value)} /></div>
            <div><label style={labelStyle}>Price to</label><input style={inputStyle} value={editing.price_to} onChange={(e) => set("price_to", e.target.value)} /></div>
            <div><label style={labelStyle}>Price alt</label><input style={inputStyle} value={editing.price_alt} onChange={(e) => set("price_alt", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Price monthly</label><input style={inputStyle} value={editing.price_monthly} onChange={(e) => set("price_monthly", e.target.value)} /></div>
            <div><label style={labelStyle}>Delivery note</label><input style={inputStyle} value={editing.delivery_note} onChange={(e) => set("delivery_note", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Demo link</label><input style={inputStyle} value={editing.demo_slug} onChange={(e) => set("demo_slug", e.target.value)} /></div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={editing.status} onChange={(e) => set("status", e.target.value)}>
                <option value="published">Published</option><option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(226,232,240,0.7)", fontSize: "0.85rem" }}>
            <input type="checkbox" checked={editing.highlight} onChange={(e) => set("highlight", e.target.checked)} /> Highlight this service
          </label>
          <div><label style={labelStyle}>Features</label><ListEditor items={editing.features} onChange={(v) => set("features", v)} placeholder="Add feature" /></div>
          <div><label style={labelStyle}>Best for</label><ListEditor items={editing.best_for} onChange={(v) => set("best_for", v)} placeholder="Add audience" /></div>
          {msg && <p style={{ color: "#F87171", fontSize: "0.82rem" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Service"}</button>
            <button style={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}>#</th><th style={th}>Service</th><th style={th}>Tier</th><th style={th}>Price</th><th style={th}>Status</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading...</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No services yet — run the seed route to import existing ones</td></tr>
              : items.map((s) => (
                <tr key={s.id}>
                  <td style={{ ...td, fontFamily: mono, color: "#C9A84C" }}>{s.number || "—"}</td>
                  <td style={td}><p style={{ fontWeight: 600, color: "#fff" }}>{s.label}</p><p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.35)", fontFamily: mono, marginTop: 2 }}>/services/{s.slug}</p></td>
                  <td style={td}>{s.tier || "—"}</td>
                  <td style={td}>{s.price_from || "—"}</td>
                  <td style={td}><span style={badge(s.status === "published")}>{s.status}</span></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditing({ ...blank, ...s, features: s.features || [], best_for: s.best_for || [] }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.6)", fontSize: "0.78rem", marginRight: 10 }}>Edit</button>
                    <button onClick={() => remove(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", fontSize: "0.78rem" }}>Delete</button>
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
