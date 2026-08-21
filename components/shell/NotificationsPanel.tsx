"use client";
import { useState, useEffect } from "react";
import { colors, font } from "@/lib/design-tokens";

interface Notification { id: string; title: string; body?: string; created_at: string; }

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setItems(d.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, maxWidth: "90vw", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", zIndex: 200 }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff", fontFamily: font.sans }}>Notifications</p>
        <button onClick={onClose} style={{ background: "none", border: "none", color: colors.textFaint, cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>&times;</button>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: "center", fontSize: "0.8rem", color: colors.textFaint }}>Loading&hellip;</p>
        ) : items.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "0.82rem", color: colors.textLow, marginBottom: 4 }}>No notifications yet</p>
            <p style={{ fontSize: "0.72rem", color: colors.textFaint }}>You&apos;ll see updates here as CRM, Projects and Support activity comes online.</p>
          </div>
        ) : (
          items.map(n => (
            <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}` }}>
              <p style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600, marginBottom: 2 }}>{n.title}</p>
              {n.body && <p style={{ fontSize: "0.76rem", color: colors.textLow }}>{n.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
