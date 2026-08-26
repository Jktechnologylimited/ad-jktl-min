"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Msg { id: string; title: string; body?: string; actor_name?: string; created_at: string; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) + " " + new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }); }
const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };

export default function ProjectCommunicationPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"messages" | "notes" | "mentions">("messages");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [notes, setNotes] = useState<Msg[]>([]);
  const [me, setMe] = useState<{ name?: string; staffId?: string } | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    Promise.all([
      fetch(`/api/projects/${id}/activity?type=message`).then(r => r.json()),
      fetch(`/api/projects/${id}/activity?type=note`).then(r => r.json()),
      fetch("/api/me").then(r => r.json()).catch(() => null),
    ]).then(([m, n, meData]) => {
      setMessages((m.activities || []).slice().reverse());
      setNotes((n.activities || []).slice().reverse());
      setMe(meData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, notes, tab]);

  async function send() {
    if (!text.trim()) return;
    const type = tab === "notes" ? "note" : "message";
    await fetch(`/api/projects/${id}/activity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, title: type === "note" ? "Internal note" : "Message", body: text.trim() }) });
    setText(""); load();
  }

  const all = [...messages, ...notes];
  const mentions = me?.name ? all.filter(m => m.body?.toLowerCase().includes(`@${me.name!.split(" ")[0].toLowerCase()}`)) : [];
  const list = tab === "messages" ? messages : tab === "notes" ? notes : mentions;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 800, display: "flex", flexDirection: "column", height: "calc(100vh - 40px)" }}>
      <Link href={`/dashboard/projects/${id}`} style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Project</Link>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: "14px 0 12px" }}>Project Communication</h1>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, marginBottom: 16 }}>
        {(["messages", "notes", "mentions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent", color: tab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", textTransform: "capitalize" }}>{t === "notes" ? "Internal Notes" : t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
        {loading ? <p style={{ textAlign: "center", color: colors.textFaint, padding: 20 }}>Loading...</p> : list.length === 0 ? (
          <p style={{ textAlign: "center", color: colors.textFaint, padding: 20, fontSize: "0.82rem", fontStyle: "italic" }}>{tab === "mentions" ? "No mentions yet" : "No messages yet"}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.map(m => (
              <div key={m.id} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, color: colors.primary }}>{(m.actor_name || "??").slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{m.actor_name || "Unknown"} <span style={{ fontWeight: 400, color: colors.textFaint, fontSize: "0.7rem" }}>{fmtDate(m.created_at)}</span></p>
                  <p style={{ fontSize: "0.82rem", color: colors.textMed, marginTop: 2 }}>{m.body || m.title}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {tab !== "mentions" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type your message..." style={{ ...inputStyle, flex: 1 }} />
          <button onClick={send} style={{ padding: "9px 18px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>Send</button>
        </div>
      )}
    </div>
  );
}
