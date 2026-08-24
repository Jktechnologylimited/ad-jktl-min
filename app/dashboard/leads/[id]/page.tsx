"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Lead {
  id: string; first_name?: string; last_name?: string; name?: string; email?: string; phone?: string;
  business_name?: string; website?: string; industry?: string; employees?: string; source: string;
  status: string; owner_name?: string; owner_staff_id?: string; tags?: string[]; next_follow_up?: string;
  created_at: string; converted_at?: string;
}
interface Activity { id: string; type: string; title: string; body?: string; actor_name?: string; created_at: string; }
interface Task { id: string; title: string; description?: string; status: string; priority: string; due_date?: string; staff_name?: string; created_at: string; }
interface Staff { id: string; name: string; active: boolean; }

const STATUS_COLOR: Record<string, string> = { new: "#60A5FA", contacted: "#C9A84C", qualified: "#A78BFA", proposal: "#F59E0B", converted: "#34D399" };
const STATUSES = ["new", "contacted", "qualified", "proposal", "converted"];
const TABS = ["Overview", "Activity", "Notes", "Tasks", "Files", "Related"] as const;
const ACTIVITY_ICON: Record<string, string> = { created: "NW", email: "EM", call: "CL", status_change: "ST", note: "NT", meeting: "MT", task: "TK" };
const PRIORITY_COLOR: Record<string, string> = { high: colors.danger, medium: colors.warning, low: colors.textFaint };

function leadName(l: Lead) { return (l.first_name || l.last_name) ? `${l.first_name || ""} ${l.last_name || ""}`.trim() : (l.name || "Unnamed lead"); }
function initials(n: string) { return n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?"; }
function timeAgo(d: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [taskFilter, setTaskFilter] = useState<"upcoming" | "completed" | "all">("upcoming");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", due_date: "" });
  const [showAddTask, setShowAddTask] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/leads/${id}`).then(r => r.json()),
      fetch(`/api/leads/${id}/activities`).then(r => r.json()),
      fetch(`/api/tasks?leadId=${id}`).then(r => r.json()),
      fetch("/api/staff").then(r => r.json()).catch(() => ({ staff: [] })),
    ]).then(([l, a, t, s]) => {
      setLead(l.lead || null);
      setActivities(a.activities || []);
      setTasks(t.tasks || []);
      setStaff((s.staff || []).filter((x: Staff) => x.active));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: string) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function addNote() {
    if (!note.trim()) return;
    await fetch(`/api/leads/${id}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "note", title: "Note added", body: note.trim() }) });
    setNote("");
    load();
  }

  async function addTask() {
    if (!newTask.title.trim()) return;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: id, ...newTask }) });
    setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
    setShowAddTask(false);
    load();
  }

  async function toggleTask(taskId: string, done: boolean) {
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: done ? "done" : "todo" }) });
    load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!lead) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: font.sans }}>
      <p style={{ color: colors.textFaint, marginBottom: 12 }}>Lead not found.</p>
      <Link href="/dashboard/leads/all" style={{ color: colors.primary, fontSize: "0.85rem" }}>&larr; Back to Leads</Link>
    </div>
  );

  const notes = activities.filter(a => a.type === "note");
  const upcomingTasks = tasks.filter(t => t.status !== "done");
  const completedTasks = tasks.filter(t => t.status === "done");
  const visibleTasks = taskFilter === "upcoming" ? upcomingTasks : taskFilter === "completed" ? completedTasks : tasks;

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1000 }}>
      <Link href="/dashboard/leads/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Leads</Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, margin: "14px 0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: font.mono, fontWeight: 700, color: colors.primary }}>{initials(lead.business_name || leadName(lead))}</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{lead.business_name || leadName(lead)}</h1>
              <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[lead.status] || colors.textFaint) + "20", color: STATUS_COLOR[lead.status] || colors.textFaint }}>{lead.status}</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, marginTop: 2 }}>
              {leadName(lead)} {lead.email && <>&middot; {lead.email}</>} {lead.phone && <>&middot; {lead.phone}</>}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {lead.status !== "converted" && (
            <Link href={`/dashboard/leads/${id}/convert`} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>Convert to Opportunity</Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 14px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent",
            color: tab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {t}{t === "Tasks" && upcomingTasks.length > 0 ? ` (${upcomingTasks.length})` : ""}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "Overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Lead Information</p>
            {[["Company", lead.business_name], ["Industry", lead.industry], ["Employees", lead.employees], ["Website", lead.website], ["Source", lead.source], ["Owner", lead.owner_name || "Unassigned"], ["Created", new Date(lead.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: "0.78rem", color: colors.textFaint }}>{k}</span>
                <span style={{ fontSize: "0.8rem", color: colors.textMed, textTransform: k === "Source" ? "capitalize" : "none" }}>{v || "\u2014"}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Lead Status</p>
              <label style={{ display: "block", fontSize: "0.68rem", color: colors.textFaint, marginBottom: 5 }}>Status</label>
              <select value={lead.status} onChange={e => updateStatus(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
                {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
              {lead.next_follow_up && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", color: colors.textFaint }}>Next Follow-up</span>
                  <span style={{ fontSize: "0.8rem", color: colors.textMed }}>{new Date(lead.next_follow_up).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 10 }}>Add a Quick Note</p>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about this lead..." rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
              <button onClick={addNote} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY */}
      {tab === "Activity" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 16 }}>Activity Timeline</p>
          {activities.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No activity yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {activities.map(a => (
                <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.55rem", fontWeight: 700, color: colors.primary }}>{ACTIVITY_ICON[a.type] || "??"}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.83rem", fontWeight: 600, color: "#fff" }}>{a.title}</p>
                    {a.body && <p style={{ fontSize: "0.78rem", color: colors.textMed, marginTop: 2 }}>{a.body}</p>}
                    <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 3, fontFamily: font.mono }}>{timeAgo(a.created_at)}{a.actor_name ? ` by ${a.actor_name}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTES */}
      {tab === "Notes" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Notes</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about this lead..." rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
          <button onClick={addNote} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", marginBottom: 18 }}>Add Note</button>
          {notes.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No notes yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notes.map(n => (
                <div key={n.id} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
                  <p style={{ fontSize: "0.82rem", color: colors.textMed }}>{n.body}</p>
                  <p style={{ fontSize: "0.66rem", color: colors.textFaint, marginTop: 6, fontFamily: font.mono }}>{timeAgo(n.created_at)}{n.actor_name ? ` by ${n.actor_name}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TASKS */}
      {tab === "Tasks" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {(["upcoming", "completed", "all"] as const).map(f => (
                <button key={f} onClick={() => setTaskFilter(f)} style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: "0.76rem", fontWeight: 700, textTransform: "capitalize", cursor: "pointer",
                  background: taskFilter === f ? colors.primary : "transparent", color: taskFilter === f ? colors.primaryText : colors.textMed, border: `1px solid ${taskFilter === f ? colors.primary : colors.border}`,
                }}>
                  {f} {f === "upcoming" ? `(${upcomingTasks.length})` : f === "completed" ? `(${completedTasks.length})` : `(${tasks.length})`}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddTask(v => !v)} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>+ Add Task</button>
          </div>

          {showAddTask && (
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} placeholder="Task title" style={inputStyle} />
              <textarea value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} placeholder="Description" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))} style={inputStyle}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
                <input type="date" value={newTask.due_date} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))} style={inputStyle} />
              </div>
              <button onClick={addTask} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Save Task</button>
            </div>
          )}

          {visibleTasks.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No {taskFilter !== "all" ? taskFilter : ""} tasks</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleTasks.map(t => (
                <div key={t.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
                  <input type="checkbox" checked={t.status === "done"} onChange={e => toggleTask(t.id, e.target.checked)} style={{ marginTop: 3, accentColor: colors.primary, width: 15, height: 15, cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.83rem", fontWeight: 600, color: "#fff", textDecoration: t.status === "done" ? "line-through" : "none", opacity: t.status === "done" ? 0.5 : 1 }}>{t.title}</p>
                    {t.description && <p style={{ fontSize: "0.76rem", color: colors.textFaint, marginTop: 2 }}>{t.description}</p>}
                    <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginTop: 4, fontFamily: font.mono }}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "No due date"} {t.staff_name ? `\u00b7 ${t.staff_name}` : ""}
                    </p>
                  </div>
                  <span style={{ fontFamily: font.mono, fontSize: "0.58rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", background: (PRIORITY_COLOR[t.priority] || colors.textFaint) + "20", color: PRIORITY_COLOR[t.priority] || colors.textFaint, flexShrink: 0 }}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILES / RELATED -- honest pending states */}
      {(tab === "Files" || tab === "Related") && (
        <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "0.85rem", color: colors.textFaint }}>
            {tab === "Files" ? "File attachments aren't wired up yet in this batch." : "Related Opportunities & Customers will appear here once those modules land (Batch 04/06)."}
          </p>
        </div>
      )}
    </div>
  );
}
