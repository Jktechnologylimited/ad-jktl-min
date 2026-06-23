"use client";
import { useState, useEffect, useCallback } from "react";
import { kpiSetForRole, weeklyTotals, localDate, type KpiEntry } from "@/lib/kpis";

const sans = "'Plus Jakarta Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 };
const sel: React.CSSProperties = { padding: "6px 10px", background: "#0B1640", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 7, color: "#fff", fontSize: "0.76rem", fontFamily: sans, outline: "none", cursor: "pointer" };
const numI: React.CSSProperties = { width: 72, padding: "6px 9px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 7, color: "#fff", fontSize: "0.78rem", fontFamily: mono, outline: "none" };
const kpiInput: React.CSSProperties = { width: "100%", padding: "9px 11px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: "0.95rem", fontFamily: mono, outline: "none" };
const goldBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.06em", background: "#C9A84C", color: "#060E2A", border: "none", cursor: "pointer" };

type Task = { id: string; title: string; description?: string; status: string; due_date?: string };
type Target = { id: string; label: string; metric?: string; target_value: number; current_value: number; period?: string };

export default function MyWorkPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [me, setMe] = useState<{ role: string; name: string | null; staffId: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiEntry[]>([]);
  const [kf, setKf] = useState<Record<string, number>>({ messages_sent: 0, conversations: 0, qualified_leads: 0, demos_booked: 0, follow_ups: 0 });
  const [kpiMsg, setKpiMsg] = useState("");
  const today = localDate();

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/me").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/targets").then(r => r.json()),
      fetch("/api/kpis?days=28").then(r => r.json()),
    ]).then(([m, t, g, k]) => {
      setMe(m); setTasks(t.tasks || []); setTargets(g.targets || []);
      const entries: KpiEntry[] = k.entries || [];
      setKpis(entries);
      const set = kpiSetForRole(m.role);
      const te = entries.find(e => String(e.entry_date).slice(0, 10) === localDate());
      if (set) { const next: Record<string, number> = {}; for (const mm of set.metrics) next[mm.key] = te ? (Number(te[mm.key]) || 0) : 0; setKf(next); }
      setLoading(false);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }
  async function setProgress(g: Target, current_value: number) {
    setTargets(gs => gs.map(x => x.id === g.id ? { ...x, current_value } : x));
    await fetch(`/api/targets/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_value }) });
  }
  async function saveKpis() {
    setKpiMsg("");
    const res = await fetch("/api/kpis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today, ...kf }) });
    if (!res.ok) { const d = await res.json(); setKpiMsg(d.error || "Failed to save"); return; }
    setKpiMsg("Saved \u2713");
    const k = await fetch("/api/kpis?days=28").then(r => r.json());
    setKpis(k.entries || []);
    setTimeout(() => setKpiMsg(""), 2500);
  }

  if (loading) return <div style={{ padding: 36, color: "rgba(226,232,240,0.4)", fontFamily: sans }}>Loading…</div>;

  if (me && me.role === "owner") return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 700 }}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>My Work</h1>
      <p style={{ fontSize: "0.85rem", color: "rgba(226,232,240,0.5)" }}>This view is for staff members. As the owner, assign and track tasks and targets from the <strong style={{ color: "#C9A84C" }}>Team</strong> page.</p>
    </div>
  );

  const weekly = weeklyTotals(kpis);
  const kpiSet = kpiSetForRole(me?.role);
  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 820 }}>
      <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>My Work{me?.name ? `, ${me.name.split(" ")[0]}` : ""}</h1>
      <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)", marginBottom: 24 }}>Your tasks and targets. Update your status and progress as you go.</p>

      {kpiSet && (<div style={{ ...card, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <h2 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C" }}>Today&apos;s numbers <span style={{ fontFamily: mono, color: "rgba(226,232,240,0.35)", letterSpacing: 0, textTransform: "none" }}>· {today} · {kpiSet.label}</span></h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {kpiMsg && <span style={{ fontSize: "0.74rem", color: "#34D399" }}>{kpiMsg}</span>}
            <button style={goldBtn} onClick={saveKpis}>Save today</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 12 }}>
          {kpiSet.metrics.map(m => (
            <div key={m.key}>
              <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(226,232,240,0.55)", marginBottom: 5 }}>{m.label}</label>
              <input type="number" min={0} value={kf[m.key]} onChange={e => setKf({ ...kf, [m.key]: Math.max(0, Number(e.target.value) || 0) })} style={kpiInput} />
            </div>
          ))}
        </div>
      </div>)}

      {kpiSet && (<div style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 14 }}>This week</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {kpiSet.metrics.map(m => {
            const total = weekly[m.key] || 0;
            const hasT = m.weeklyMin != null;
            const pct = hasT ? Math.min(100, Math.round((total / (m.weeklyMin as number)) * 100)) : 0;
            return (
              <div key={m.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff" }}>{m.label}</span>
                  <span style={{ fontFamily: mono, fontSize: "0.78rem", color: "#C9A84C" }}>{total}{hasT && <span style={{ color: "rgba(226,232,240,0.4)" }}> / {m.weeklyMin}–{m.weeklyMax}</span>}</span>
                </div>
                {hasT && (
                  <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: total >= (m.weeklyMin as number) ? "#34D399" : "#C9A84C", transition: "width .3s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.35)", marginTop: 12 }}>Weekly totals reset every Monday.</p>
      </div>)}

      <div style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 12 }}>Tasks</h2>
        <div style={{ display: "grid", gap: 7 }}>
          {tasks.length === 0 && <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.3)", fontStyle: "italic" }}>No tasks assigned yet.</p>}
          {tasks.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
              <div>
                <p style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 500 }}>{t.title}</p>
                {t.description && <p style={{ fontSize: "0.74rem", color: "rgba(226,232,240,0.45)" }}>{t.description}</p>}
                {t.due_date && <p style={{ fontSize: "0.68rem", color: "rgba(226,232,240,0.4)", fontFamily: mono }}>due {String(t.due_date).slice(0, 10)}</p>}
              </div>
              <select style={sel} value={t.status} onChange={e => setStatus(t.id, e.target.value)}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 12 }}>Targets</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {targets.length === 0 && <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.3)", fontStyle: "italic" }}>No targets set yet.</p>}
          {targets.map(g => {
            const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
            return (
              <div key={g.id} style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 500 }}>{g.label} {g.period && <span style={{ color: "rgba(226,232,240,0.4)", fontSize: "0.72rem" }}>· {g.period}</span>}</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={numI} type="number" defaultValue={g.current_value} onBlur={e => setProgress(g, Number(e.target.value) || 0)} />
                    <span style={{ fontFamily: mono, fontSize: "0.76rem", color: "rgba(226,232,240,0.5)" }}>/ {g.target_value}</span>
                  </div>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#34D399" : "#C9A84C" }} /></div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.32)", marginTop: 10 }}>Tip: type your new number and click away to save.</p>
      </div>
    </div>
  );
}
