"use client";
import { useState, useEffect, useCallback } from "react";

const sans = "'Plus Jakarta Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: "0.88rem", fontFamily: sans, outline: "none" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#0B1640" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(226,232,240,0.4)", marginBottom: 6 };
const btnGold: React.CSSProperties = { padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", background: "#C9A84C", color: "#060E2A", border: "none", cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.7)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" };

type Video = { id: string; page_key: string; title: string; description: string; duration: string; youtube_id: string; coming_soon: boolean; sort_order: number };
const PAGES = ["faithdesk", "detaildesk", "schooldesk"];
const blank = { title: "", description: "", duration: "", youtube_id: "", coming_soon: true, sort_order: 0 };

export default function VideosPage() {
  const [page, setPage] = useState("faithdesk");
  const [customPage, setCustomPage] = useState("");
  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof blank & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const activePage = page === "__custom" ? customPage.trim() : page;

  const load = useCallback(() => {
    if (!activePage) { setItems([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/watch-videos?page=${encodeURIComponent(activePage)}`).then((r) => r.json()).then((d) => { setItems(d.videos || []); setLoading(false); });
  }, [activePage]);
  useEffect(() => { load(); }, [load]);

  function set<K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) { setEditing((e) => e ? { ...e, [k]: v } : e); }

  async function save() {
    if (!editing) return;
    setMsg("");
    if (!editing.title.trim()) { setMsg("Title is required."); return; }
    if (!activePage) { setMsg("Choose or enter a page first."); return; }
    setSaving(true);
    const url = editing.id ? `/api/watch-videos/${editing.id}` : "/api/watch-videos";
    const res = await fetch(url, { method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editing, page_key: activePage }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Failed to save."); return; }
    setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this video?")) return;
    await fetch(`/api/watch-videos/${id}`, { method: "DELETE" }); load();
  }

  const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
  const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1100 }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Watch &amp; Learn Videos</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>Manage the video guides shown on each product (and service) page</p>
        </div>
        <button style={btnGold} onClick={() => { setEditing({ ...blank, sort_order: items.length }); setMsg(""); }}>+ New Video</button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 220 }}>
          <label style={labelStyle}>Page</label>
          <select style={selectStyle} value={page} onChange={(e) => { setPage(e.target.value); setEditing(null); }}>
            {PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="__custom">Other (service slug)…</option>
          </select>
        </div>
        {page === "__custom" && (
          <div style={{ minWidth: 240 }}>
            <label style={labelStyle}>Page key (e.g. seo, website-systems)</label>
            <input style={inputStyle} value={customPage} onChange={(e) => setCustomPage(e.target.value)} onBlur={load} placeholder="service slug" />
          </div>
        )}
      </div>

      {editing && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 24, marginBottom: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{editing.id ? "Edit Video" : "New Video"} <span style={{ fontFamily: mono, fontSize: "0.75rem", color: "rgba(226,232,240,0.35)" }}>· {activePage || "no page"}</span></h2>
          <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={editing.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={editing.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Duration</label><input style={inputStyle} placeholder="e.g. 8 min" value={editing.duration} onChange={(e) => set("duration", e.target.value)} /></div>
            <div><label style={labelStyle}>YouTube ID</label><input style={inputStyle} placeholder="e.g. dQw4w9WgXcQ" value={editing.youtube_id} onChange={(e) => set("youtube_id", e.target.value)} /></div>
            <div><label style={labelStyle}>Sort order</label><input style={inputStyle} type="number" value={editing.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(226,232,240,0.7)", fontSize: "0.85rem" }}>
            <input type="checkbox" checked={editing.coming_soon} onChange={(e) => set("coming_soon", e.target.checked)} /> Coming soon (shows placeholder instead of a playable video)
          </label>
          <p style={{ fontSize: "0.72rem", color: "rgba(226,232,240,0.35)" }}>Leave YouTube ID empty (or tick &quot;coming soon&quot;) to show the placeholder. Add a YouTube ID to make it playable.</p>
          {msg && <p style={{ color: "#F87171", fontSize: "0.82rem" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Video"}</button>
            <button style={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}>#</th><th style={th}>Title</th><th style={th}>Duration</th><th style={th}>YouTube</th><th style={th}>State</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading...</td></tr>
              : items.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No videos for {activePage || "this page"} yet</td></tr>
              : items.map((v) => (
                <tr key={v.id}>
                  <td style={{ ...td, fontFamily: mono, color: "#C9A84C" }}>{v.sort_order}</td>
                  <td style={td}><p style={{ fontWeight: 600, color: "#fff" }}>{v.title}</p><p style={{ fontSize: "0.74rem", color: "rgba(226,232,240,0.4)" }}>{v.description}</p></td>
                  <td style={td}>{v.duration || "—"}</td>
                  <td style={{ ...td, fontFamily: mono, fontSize: "0.74rem" }}>{v.youtube_id || "—"}</td>
                  <td style={td}>{v.coming_soon ? <span style={{ color: "#FCD34D" }}>Coming soon</span> : <span style={{ color: "#34D399" }}>Live</span>}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditing({ id: v.id, title: v.title, description: v.description || "", duration: v.duration || "", youtube_id: v.youtube_id || "", coming_soon: v.coming_soon, sort_order: v.sort_order }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(226,232,240,0.6)", fontSize: "0.78rem", marginRight: 10 }}>Edit</button>
                    <button onClick={() => remove(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", fontSize: "0.78rem" }}>Delete</button>
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
