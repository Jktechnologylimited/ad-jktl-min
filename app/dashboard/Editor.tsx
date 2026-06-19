"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export const sans = "'Plus Jakarta Sans', sans-serif";
export const mono = "'JetBrains Mono', monospace";

export const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff",
  fontSize: "0.88rem", fontFamily: sans, outline: "none",
};
export const selectStyle: React.CSSProperties = {
  ...inputStyle, background: "#0B1640",
};
export const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "rgba(226,232,240,0.4)", marginBottom: 6,
};
export const btnGold: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem",
  textTransform: "uppercase", letterSpacing: "0.08em", background: "#C9A84C",
  color: "#060E2A", border: "none", cursor: "pointer", whiteSpace: "nowrap",
};
export const btnGhost: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem",
  background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.7)",
  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
};

// Live markdown editor: textarea on the left, rendered preview on the right.
export function MarkdownEditor({ value, onChange, minHeight = 220 }: {
  value: string; onChange: (v: string) => void; minHeight?: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {(["write", "preview"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: "5px 12px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em", border: "none", cursor: "pointer",
              background: tab === t ? "#C9A84C" : "rgba(255,255,255,0.06)",
              color: tab === t ? "#060E2A" : "rgba(226,232,240,0.55)" }}>
            {t}
          </button>
        ))}
      </div>
      {tab === "write" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, minHeight, resize: "vertical", fontFamily: mono, fontSize: "0.82rem", lineHeight: 1.6 }} />
      ) : (
        <div className="md-preview" style={{ minHeight, padding: "14px 16px", background: "rgba(255,255,255,0.04)",
          border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(226,232,240,0.85)", fontSize: "0.9rem", lineHeight: 1.7 }}>
          <ReactMarkdown>{value || "_Nothing to preview yet._"}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// Editable list of plain strings (features, bestFor, useCases).
export function ListEditor({ items, onChange, placeholder = "Add item" }: {
  items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {list.map((val, i) => (
        <div key={i} style={{ display: "flex", gap: 8 }}>
          <input style={inputStyle} value={val}
            onChange={(e) => { const next = [...list]; next[i] = e.target.value; onChange(next); }} />
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
            style={{ ...btnGhost, padding: "0 14px", color: "rgba(239,68,68,0.7)" }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, ""])}
        style={{ ...btnGhost, justifySelf: "start" }}>+ {placeholder}</button>
    </div>
  );
}

export type Domain = { label: string; example: string; type: string };

// Editable list of domain rows ({ label, example, type }).
export function DomainsEditor({ items, onChange }: {
  items: Domain[]; onChange: (v: Domain[]) => void;
}) {
  const list = Array.isArray(items) ? items : [];
  function upd(i: number, k: keyof Domain, v: string) {
    const next = list.map((d, j) => (j === i ? { ...d, [k]: v } : d));
    onChange(next);
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {list.map((d, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.8fr auto", gap: 8 }}>
          <input style={inputStyle} placeholder="Label" value={d.label} onChange={(e) => upd(i, "label", e.target.value)} />
          <input style={inputStyle} placeholder="example.com" value={d.example} onChange={(e) => upd(i, "example", e.target.value)} />
          <input style={inputStyle} placeholder="type" value={d.type} onChange={(e) => upd(i, "type", e.target.value)} />
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
            style={{ ...btnGhost, padding: "0 14px", color: "rgba(239,68,68,0.7)" }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { label: "", example: "", type: "public" }])}
        style={{ ...btnGhost, justifySelf: "start" }}>+ Add domain</button>
    </div>
  );
}
