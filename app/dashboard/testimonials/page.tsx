"use client";
import { useState, useEffect, useCallback } from "react";
import { inputStyle, selectStyle, labelStyle, btnGold, btnGhost, sans, mono } from "../Editor";

type Testimonial = {
  id: string; quote: string; author_name: string; author_role: string;
  company: string; avatar_url: string; rating: number; status: string; sort_order: number;
};
const blank = { quote: "", author_name: "", author_role: "", company: "", avatar_url: "", rating: 5, status: "published", sort_order: 0 };
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
const badge = (pub: boolean): React.CSSProperties => ({ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: pub ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: pub ? "#34D399" : "#FCD34D" });

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof blank & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/testimonials").then((r) => r.json()).then((d) => { setItems(d.testimonials || []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) { setEditing((e) => e ? { ...e, [k]: v } : e); }

  async function save() {
    if (!editing) return;
    setMsg("");
    if (!editing.quote.trim() || !editing.author_name.trim()) { setMsg("Quote and author name are required."); return; }
    setSaving(true);
    const url = editing.id ? `/api/testimonials/${editing.id}` : "/api/testimonials";
    const res = await fetch(url, { method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Failed to save."); return; }
    setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1100 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Testimonials</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>Client quotes shown in the testimonials section on the homepage</p>
        </div>
        <button style={btnGold} onClick={() => { setEditing({ ...blank }); setMsg(""); }}>+ New Testimonial</button>
      </div>

      {editing && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 24, marginBottom: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{editing.id ? "Edit Testimonial" : "New Testimonial"}</h2>
          <div><label style={labelStyle}>Quote *</label><textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={editing.quote} onChange={(e) => set("quote", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Author name *</label><input style={inputStyle} value={editing.author_name} onChange={(e) => set("author_name", e.target.value)} /></div>
            <div><label style={labelStyle}>Role / title</label><input style={inputStyle} value={editing.author_role} onChange={(e) => set("author_role", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Company</label><input style={inputStyle} value={editing.company} onChange={(e) => set("company", e.target.value)} /></div>
            <div><label style={labelStyle}>Avatar image URL</label><input style={inputStyle} placeholder="https://..." value={editing.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Rating</label>
              <select style={selectStyle} value={editing.rating} onChange={(e) => set("rating", Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={editing.status} onChange={(e) => set("status", e.target.value)}>
                <option value="published">Published</option><option value="draft">Draft</option>
              </select>
            </div>
            <div><label style={labelStyle}>Sort order</label><input style={inputStyle} type="number" value={editing.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
          </div>
          {msg && <p style={{ color: "#F87171", fontSize: "0.82rem" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Testimonial"}</button>
            <button style={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}>Quote</th><th style={th}>Author</th><th style={th}>Rating</th><th style={th}>Status</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading…</td></tr>
              : items.length === 0 ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No testimonials yet</td></tr>
              : items.map((t) => (
                <tr key={t.id}>
                  <td style={{ ...td, maxWidth: 420 }}><span style={{ color: "rgba(226,232,240,0.8)" }}>&ldquo;{t.quote.length > 120 ? t.quote.slice(0, 120) + "…" : t.quote}&rdquo;</span></td>
                  <td style={td}><p style={{ fontWeight: 600, color: "#fff" }}>{t.author_name}</p><p style={{ fontSize: "0.72rem", color: "rgba(226,232,240,0.4)" }}>{[t.author_role, t.company].filter(Boolean).join(", ")}</p></td>
                  <td style={{ ...td, color: "#C9A84C", fontFamily: mono }}>{"★".repeat(t.rating || 5)}</td>
                  <td style={td}><span style={badge(t.status === "published")}>{t.status}</span></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditing({ ...blank, ...t }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.6)", fontSize: "0.78rem", marginRight: 10 }}>Edit</button>
                    <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", fontSize: "0.78rem" }}>Delete</button>
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
