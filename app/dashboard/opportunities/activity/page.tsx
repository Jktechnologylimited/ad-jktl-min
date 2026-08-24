"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Activity { id: string; type: string; title: string; body?: string; actor_name?: string; opportunity_name: string; customer_name: string; opportunity_id: string; created_at: string; }
const TABS = [
  { label: "All Activities", type: "" },
  { label: "Calls", type: "call" },
  { label: "Emails", type: "email" },
  { label: "Meetings", type: "meeting" },
  { label: "Tasks", type: "task" },
  { label: "Notes", type: "note" },
];
const ACTIVITY_ICON: Record<string, string> = { created: "NW", email: "EM", call: "CL", status_change: "ST", note: "NT", meeting: "MT", task: "TK" };
function timeAgo(d: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function SalesActivityPage() {
  const [tab, setTab] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = tab ? `?type=${tab}` : "";
    fetch(`/api/opportunities/activity${qs}`).then(r => r.json()).then(d => { setActivities(d.activities || []); setLoading(false); }).catch(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff" }}>Sales Activities</h1>
        <p style={{ fontSize: "0.78rem", color: colors.textFaint }}>Log activity from within an opportunity&apos;s own page</p>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.type} onClick={() => setTab(t.type)} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: tab === t.type ? `2px solid ${colors.primary}` : "2px solid transparent", color: tab === t.type ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: "0.82rem" }}>Loading...</p>
        ) : activities.length === 0 ? (
          <p style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: "0.82rem", fontStyle: "italic" }}>No activity yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activities.map(a => (
              <Link key={a.id} href={`/dashboard/opportunities/${a.opportunity_id}`} style={{ display: "flex", gap: 12, padding: "10px 4px", borderBottom: `1px solid ${colors.border}`, textDecoration: "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: font.mono, fontSize: "0.58rem", fontWeight: 700, color: colors.primary }}>{ACTIVITY_ICON[a.type] || "??"}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>{a.title} <span style={{ color: colors.textFaint, fontWeight: 400 }}>({a.opportunity_name})</span></p>
                  {a.body && <p style={{ fontSize: "0.78rem", color: colors.textMed, marginTop: 2 }}>{a.body}</p>}
                  <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 3, fontFamily: font.mono }}>{timeAgo(a.created_at)}{a.actor_name ? ` \u00b7 ${a.actor_name}` : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
