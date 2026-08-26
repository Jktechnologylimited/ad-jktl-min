"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface FileItem { id: string; name: string; category: string; design_type?: string; file_type?: string; file_url: string; size_bytes?: number; uploaded_by_name?: string; created_at: string; }
const CATEGORIES = ["requirements", "designs", "development", "content", "invoices", "other"];
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function fmtSize(b?: number) { if (!b) return "\u2014"; if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`; return `${(b / (1024 * 1024)).toFixed(1)} MB`; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }); }
const inputStyle: React.CSSProperties = { padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.8rem", outline: "none" };

export default function ProjectFilesPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>}><FilesInner /></Suspense>;
}

function FilesInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDesignsView = category === "designs";

  function load() {
    setLoading(true);
    const qs = category ? `?category=${category}` : "";
    fetch(`/api/projects/${id}/files${qs}`).then(r => r.json()).then(d => { setFiles(d.files || []); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id, category]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", isDesignsView ? "designs" : (category || "other"));
    if (isDesignsView) fd.append("designType", "wireframe");
    try {
      const res = await fetch(`/api/projects/${id}/files`, { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Upload failed"); }
      else load();
    } catch { setError("Upload failed. Please try again."); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeFile(fileId: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/projects/${id}/files/${fileId}`, { method: "DELETE" });
    load();
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1100 }}>
      <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, margin: "14px 0 16px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{isDesignsView ? "Wireframes / Designs" : "Files & Documents"}</h1>
        <div>
          <input ref={fileInputRef} type="file" onChange={handleUpload} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.8rem", cursor: uploading ? "default" : "pointer", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? "Uploading..." : isDesignsView ? "+ New Design" : "+ Upload"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: colors.danger, fontSize: "0.8rem", marginBottom: 14 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..." style={{ ...inputStyle, maxWidth: 240 }} />
        <button onClick={() => setCategory("")} style={{ padding: "7px 13px", borderRadius: 7, fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", background: category === "" ? colors.primary : "rgba(255,255,255,0.05)", color: category === "" ? colors.primaryText : colors.textMed, border: `1px solid ${category === "" ? colors.primary : colors.border}` }}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ padding: "7px 13px", borderRadius: 7, fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", background: category === c ? colors.primary : "rgba(255,255,255,0.05)", color: category === c ? colors.primaryText : colors.textMed, border: `1px solid ${category === c ? colors.primary : colors.border}` }}>{label(c)}</button>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: "0.82rem" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: "0.82rem", fontStyle: "italic" }}>No files yet &mdash; upload one to get started</p>
        ) : isDesignsView ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14 }}>
            {filtered.map(f => (
              <div key={f.id} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${colors.border}` }}>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", aspectRatio: "4/3", background: "rgba(255,255,255,0.03)" }}>
                  {/\.(png|jpe?g|gif|webp)$/i.test(f.name) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.file_url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: font.mono, fontSize: "0.6rem", color: colors.textFaint }}>{f.file_type}</span></div>
                  )}
                </a>
                <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.76rem", color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</p>
                    <p style={{ fontSize: "0.64rem", color: colors.textFaint }}>{fmtDate(f.created_at)}</p>
                  </div>
                  <button onClick={() => removeFile(f.id)} style={{ background: "none", border: "none", color: colors.danger, fontSize: "0.9rem", cursor: "pointer", flexShrink: 0 }}>&times;</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Name", "Type", "Uploaded By", "Date", "Size", ""].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(f => (
                <tr key={f.id}>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{f.name}</a></td>
                  <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{f.file_type || "\u2014"}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{f.uploaded_by_name || "\u2014"}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{fmtDate(f.created_at)}</td>
                  <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{fmtSize(f.size_bytes)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><button onClick={() => removeFile(f.id)} style={{ background: "none", border: "none", color: colors.danger, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
