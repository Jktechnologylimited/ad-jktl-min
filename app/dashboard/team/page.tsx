"use client";
import { useState, useEffect, useCallback } from "react";
import { ROLES, roleLabel } from "@/lib/roles";

const sans = "'Plus Jakarta Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";
const input: React.CSSProperties = { width: "100%", padding: "10px 13px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: "0.85rem", fontFamily: sans, outline: "none" };
const sel: React.CSSProperties = { ...input, background: "#0B1640" };
const lbl: React.CSSProperties = { display: "block", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(226,232,240,0.4)", marginBottom: 5 };
const gold: React.CSSProperties = { padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.07em", background: "#C9A84C", color: "#060E2A", border: "none", cursor: "pointer" };
const ghost: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, fontWeight: 600, fontSize: "0.74rem", background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.7)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" };
const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 };

type Staff = { id: string; name: string; email: string; role: string; phone?: string; active: boolean };
type Task = { id: string; title: string; description?: string; status: string; due_date?: string };
type Target = { id: string; label: string; metric?: string; target_value: number; current_value: number; period?: string };

export default function TeamPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [sel0, setSel0] = useState<Staff | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [msg, setMsg] = useState("");

  const [nf, setNf] = useState({ name: "", email: "", password: "", phone: "", role: "bdr" });
  const [editing, setEditing] = useState<Staff | null>(null);
  const [ef, setEf] = useState({ name: "", phone: "", role: "bdr", password: "" });
  const [tf, setTf] = useState({ title: "", description: "", due_date: "" });
  const [gf, setGf] = useState({ label: "", metric: "", target_value: "", period: "" });

  const loadStaff = useCallback(() => { fetch("/api/staff").then(r => r.json()).then(d => setStaff(d.staff || [])); }, []);
  useEffect(() => { loadStaff(); }, [loadStaff]);

  const loadWork = useCallback((id: string) => {
    fetch(`/api/tasks?staffId=${id}`).then(r => r.json()).then(d => setTasks(d.tasks || []));
    fetch(`/api/targets?staffId=${id}`).then(r => r.json()).then(d => setTargets(d.targets || []));
  }, []);
  useEffect(() => { if (sel0) loadWork(sel0.id); }, [sel0, loadWork]);

  async function createStaff() {
    setMsg("");
    const res = await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nf) });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error || "Failed"); return; }
    setNf({ name: "", email: "", password: "", phone: "", role: "bdr" }); loadStaff();
  }
  async function toggleActive(s: Staff) { await fetch(`/api/staff/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) }); loadStaff(); }
  async function delStaff(s: Staff) { if (!confirm(`Remove ${s.name}? Their tasks and targets are deleted too.`)) return; await fetch(`/api/staff/${s.id}`, { method: "DELETE" }); if (sel0?.id === s.id) setSel0(null); loadStaff(); }

  function startEdit(s: Staff) { setEditing(s); setEf({ name: s.name, phone: s.phone || "", role: s.role, password: "" }); setMsg(""); }
  async function saveEdit() {
    if (!editing) return;
    setMsg("");
    const body: Record<string, unknown> = { name: ef.name.trim(), phone: ef.phone, role: ef.role };
    if (ef.password) body.password = ef.password;
    const res = await fetch(`/api/staff/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error || "Failed to save"); return; }
    setEditing(null); loadStaff();
  }

  async function addTask() {
    if (!sel0 || !tf.title.trim()) return;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...tf, staff_id: sel0.id }) });
    setTf({ title: "", description: "", due_date: "" }); loadWork(sel0.id);
  }
  async function delTask(id: string) { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); if (sel0) loadWork(sel0.id); }
  async function addTarget() {
    if (!sel0 || !gf.label.trim()) return;
    await fetch("/api/targets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...gf, staff_id: sel0.id }) });
    setGf({ label: "", metric: "", target_value: "", period: "" }); loadWork(sel0.id);
  }
  async function delTarget(id: string) { await fetch(`/api/targets/${id}`, { method: "DELETE" }); if (sel0) loadWork(sel0.id); }

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 1150 }}>
      <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Team</h1>
      <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)", marginBottom: 22 }}>Create staff accounts (sales / business development) and manage their tasks and targets. Staff sign in with their email and see only Inquiries and their own work.</p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)", gap: 20, alignItems: "start" }}>
        {/* Left: staff list + create */}
        <div style={{ display: "grid", gap: 18 }}>
          <div style={card}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 14 }}>Add staff</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div><label style={lbl}>Full name</label><input style={input} value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} /></div>
              <div><label style={lbl}>Email (their login)</label><input style={input} value={nf.email} onChange={e => setNf({ ...nf, email: e.target.value })} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Temp password</label><input style={input} value={nf.password} onChange={e => setNf({ ...nf, password: e.target.value })} placeholder="8+ characters" /></div>
                <div><label style={lbl}>Phone</label><input style={input} value={nf.phone} onChange={e => setNf({ ...nf, phone: e.target.value })} /></div>
              </div>
              <div><label style={lbl}>Role</label>
                <select style={sel} value={nf.role} onChange={e => setNf({ ...nf, role: e.target.value })}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              {msg && <p style={{ color: "#F87171", fontSize: "0.8rem" }}>{msg}</p>}
              <button style={gold} onClick={createStaff}>Create staff</button>
              <p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.35)" }}>Share the email + temp password with them; they can change it later.</p>
            </div>
          </div>

          {editing && (
          <div style={card}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 14 }}>Edit {editing.name}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div><label style={lbl}>Full name</label><input style={input} value={ef.name} onChange={e => setEf({ ...ef, name: e.target.value })} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Phone</label><input style={input} value={ef.phone} onChange={e => setEf({ ...ef, phone: e.target.value })} /></div>
                <div><label style={lbl}>Role</label>
                  <select style={sel} value={ef.role} onChange={e => setEf({ ...ef, role: e.target.value })}>
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>New password (optional)</label><input style={input} value={ef.password} onChange={e => setEf({ ...ef, password: e.target.value })} placeholder="leave blank to keep current" /></div>
              <p style={{ fontSize: "0.7rem", color: "rgba(226,232,240,0.4)" }}>{ROLES.find(r => r.id === ef.role)?.desc}</p>
              {msg && <p style={{ color: "#F87171", fontSize: "0.8rem" }}>{msg}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button style={gold} onClick={saveEdit}>Save changes</button>
                <button style={ghost} onClick={() => { setEditing(null); setMsg(""); }}>Cancel</button>
              </div>
            </div>
          </div>
          )}

          <div style={card}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 12 }}>Staff ({staff.length})</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {staff.length === 0 && <p style={{ fontSize: "0.8rem", color: "rgba(226,232,240,0.3)", fontStyle: "italic" }}>No staff yet</p>}
              {staff.map(s => (
                <div key={s.id} onClick={() => setSel0(s)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${sel0?.id === s.id ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.06)"}`, background: sel0?.id === s.id ? "rgba(201,168,76,0.08)" : "transparent" }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#fff", fontSize: "0.85rem" }}>{s.name} <span style={{ color: "#C9A84C", fontSize: "0.66rem" }}>· {roleLabel(s.role)}</span></p>
                    <p style={{ fontSize: "0.72rem", color: "rgba(226,232,240,0.4)" }}>{s.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: "0.66rem", color: s.active ? "#34D399" : "#F87171" }}>{s.active ? "active" : "disabled"}</span>
                    <button onClick={() => startEdit(s)} style={{ ...ghost, padding: "5px 9px", fontSize: "0.68rem" }}>Edit</button>
                    <button onClick={() => toggleActive(s)} style={{ ...ghost, padding: "5px 9px", fontSize: "0.68rem" }}>{s.active ? "Disable" : "Enable"}</button>
                    <button onClick={() => delStaff(s)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", fontSize: "0.72rem" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: selected staff work */}
        <div style={card}>
          {!sel0 ? <p style={{ fontSize: "0.85rem", color: "rgba(226,232,240,0.35)", fontStyle: "italic" }}>Select a staff member to assign tasks and targets.</p> : (
            <div style={{ display: "grid", gap: 22 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{sel0.name}&apos;s work</h2>

              {/* Tasks */}
              <div>
                <h3 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 10 }}>Tasks</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr auto", gap: 8, marginBottom: 10 }}>
                  <input style={input} placeholder="Task title" value={tf.title} onChange={e => setTf({ ...tf, title: e.target.value })} />
                  <input style={input} type="date" value={tf.due_date} onChange={e => setTf({ ...tf, due_date: e.target.value })} />
                  <button style={gold} onClick={addTask}>Add</button>
                </div>
                <input style={{ ...input, marginBottom: 12 }} placeholder="Notes (optional)" value={tf.description} onChange={e => setTf({ ...tf, description: e.target.value })} />
                <div style={{ display: "grid", gap: 6 }}>
                  {tasks.length === 0 && <p style={{ fontSize: "0.78rem", color: "rgba(226,232,240,0.3)", fontStyle: "italic" }}>No tasks yet</p>}
                  {tasks.map(t => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 11px", borderRadius: 7, background: "rgba(255,255,255,0.03)" }}>
                      <div>
                        <p style={{ fontSize: "0.83rem", color: "#fff", fontWeight: 500 }}>{t.title}</p>
                        {t.due_date && <p style={{ fontSize: "0.68rem", color: "rgba(226,232,240,0.4)", fontFamily: mono }}>due {String(t.due_date).slice(0, 10)}</p>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: "0.66rem", padding: "3px 8px", borderRadius: 20, background: t.status === "done" ? "rgba(52,211,153,0.15)" : t.status === "in_progress" ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.07)", color: t.status === "done" ? "#34D399" : t.status === "in_progress" ? "#C9A84C" : "rgba(226,232,240,0.5)" }}>{t.status.replace("_", " ")}</span>
                        <button onClick={() => delTask(t.id)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.55)", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Targets */}
              <div>
                <h3 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 10 }}>Targets</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr auto", gap: 8, marginBottom: 12 }}>
                  <input style={input} placeholder="e.g. New clients" value={gf.label} onChange={e => setGf({ ...gf, label: e.target.value })} />
                  <input style={input} placeholder="Period e.g. Jun 2026" value={gf.period} onChange={e => setGf({ ...gf, period: e.target.value })} />
                  <input style={input} type="number" placeholder="Goal" value={gf.target_value} onChange={e => setGf({ ...gf, target_value: e.target.value })} />
                  <button style={gold} onClick={addTarget}>Add</button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {targets.length === 0 && <p style={{ fontSize: "0.78rem", color: "rgba(226,232,240,0.3)", fontStyle: "italic" }}>No targets yet</p>}
                  {targets.map(g => {
                    const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
                    return (
                      <div key={g.id} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <p style={{ fontSize: "0.83rem", color: "#fff", fontWeight: 500 }}>{g.label} {g.period && <span style={{ color: "rgba(226,232,240,0.4)", fontSize: "0.7rem" }}>· {g.period}</span>}</p>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontFamily: mono, fontSize: "0.74rem", color: "#C9A84C" }}>{g.current_value}/{g.target_value}</span>
                            <button onClick={() => delTarget(g.id)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.55)", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
                          </div>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#34D399" : "#C9A84C" }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
