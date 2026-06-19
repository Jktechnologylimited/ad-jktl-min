"use client";
import { useState, useEffect, useCallback } from "react";
import { inputStyle, selectStyle, labelStyle, btnGold, btnGhost, sans, mono, MarkdownEditor } from "../Editor";

type Post = {
  id: string; title: string; slug: string; cover_image: string; excerpt: string;
  body: string; author: string; type: string; status: string; published_at: string | null;
};
const blank = { title: "", slug: "", cover_image: "", excerpt: "", body: "", author: "", type: "blog", status: "draft" };
const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(226,232,240,0.75)", verticalAlign: "top" };
const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)", whiteSpace: "nowrap" };
const badge = (pub: boolean): React.CSSProperties => ({ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: pub ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: pub ? "#34D399" : "#FCD34D" });
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-"); }

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof blank & { id?: string; slugTouched?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/posts").then((r) => r.json()).then((d) => { setPosts(d.posts || []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  function set(k: string, v: string) { setEditing((e) => e ? { ...e, [k]: v } : e); }
  function setTitle(v: string) {
    setEditing((e) => {
      if (!e) return e;
      return { ...e, title: v, slug: e.slugTouched ? e.slug : slugify(v) };
    });
  }

  async function save() {
    if (!editing) return;
    setMsg("");
    if (!editing.title.trim() || !editing.slug.trim()) { setMsg("Title and slug are required."); return; }
    setSaving(true);
    const url = editing.id ? `/api/posts/${editing.id}` : "/api/posts";
    const method = editing.id ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Failed to save."); return; }
    setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Blog & News</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>Write and publish posts to jktl.com.ng/blog</p>
        </div>
        <button style={btnGold} onClick={() => { setEditing({ ...blank }); setMsg(""); }}>+ New Post</button>
      </div>

      {editing && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 24, marginBottom: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{editing.id ? "Edit Post" : "New Post"}</h2>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={editing.title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-cols-1 md:grid-cols-2">
            <div>
              <label style={labelStyle}>Slug * <span style={{ color: "rgba(226,232,240,0.25)", fontFamily: mono }}>/blog/{editing.slug || "..."}</span></label>
              <input style={inputStyle} value={editing.slug} onChange={(e) => setEditing((p) => p ? { ...p, slug: slugify(e.target.value), slugTouched: true } : p)} />
            </div>
            <div><label style={labelStyle}>Author</label><input style={inputStyle} value={editing.author} onChange={(e) => set("author", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-cols-1 md:grid-cols-2">
            <div>
              <label style={labelStyle}>Type</label>
              <select style={selectStyle} value={editing.type} onChange={(e) => set("type", e.target.value)}>
                <option value="blog">Blog</option><option value="news">News</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={editing.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Cover image URL</label><input style={inputStyle} placeholder="https://..." value={editing.cover_image} onChange={(e) => set("cover_image", e.target.value)} /></div>
          <div><label style={labelStyle}>Excerpt</label><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={editing.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></div>
          <div>
            <label style={labelStyle}>Body (markdown)</label>
            <MarkdownEditor value={editing.body} onChange={(v) => set("body", v)} minHeight={300} />
          </div>
          {msg && <p style={{ color: "#F87171", fontSize: "0.82rem" }}>{msg}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Post"}</button>
            <button style={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: sans }}>
            <thead><tr><th style={th}>Title</th><th style={th}>Type</th><th style={th}>Status</th><th style={th}>Published</th><th style={th}></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>Loading...</td></tr>
              : posts.length === 0 ? <tr><td colSpan={5} style={{ ...td, textAlign: "center", padding: 32, fontStyle: "italic", color: "rgba(226,232,240,0.3)" }}>No posts yet</td></tr>
              : posts.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...td }}>
                    <p style={{ fontWeight: 600, color: "#fff" }}>{p.title}</p>
                    <p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.35)", fontFamily: mono, marginTop: 2 }}>/blog/{p.slug}</p>
                  </td>
                  <td style={{ ...td, textTransform: "capitalize" }}>{p.type}</td>
                  <td style={td}><span style={badge(p.status === "published")}>{p.status}</span></td>
                  <td style={{ ...td, fontSize: "0.75rem" }}>{fmtDate(p.published_at)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditing({ id: p.id, title: p.title, slug: p.slug, cover_image: p.cover_image || "", excerpt: p.excerpt || "", body: p.body || "", author: p.author || "", type: p.type, status: p.status, slugTouched: true }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
