"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Project {
  id: string; project_number: string; name: string; customer_id?: string; customer_name?: string; type: string; status: string;
  start_date?: string; due_date?: string; manager_name?: string; project_manager_staff_id?: string; description?: string;
  project_value: string; paid_amount: string; currency: string; created_at: string; updated_at: string;
}
interface Task { id: string; title: string; description?: string; status: string; priority: string; due_date?: string; staff_id?: string; staff_name?: string; }
interface Milestone { id: string; name: string; description?: string; start_date?: string; due_date?: string; status: string; progress_pct: number; }
interface TeamMember { id: string; staff_id: string; name: string; email: string; project_role?: string; assigned_tasks: string; completed_tasks: string; }
interface Staff { id: string; name: string; active: boolean; }

const INLINE_TABS = ["Overview", "Tasks", "Milestones", "Timeline", "Team", "Invoices", "Settings"] as const;
const LINK_TABS = [
  { label: "Files", href: "files" },
  { label: "Designs", href: "files?category=designs" },
  { label: "Feedback", href: "feedback" },
  { label: "Approvals", href: "approvals" },
  { label: "Handover", href: "handover" },
  { label: "Communication", href: "communication" },
  { label: "Activity", href: "activity" },
];
const TABS = [...INLINE_TABS] as const;
const TASK_COLS = [["todo", "To Do"], ["in_progress", "In Progress"], ["in_review", "In Review"], ["completed", "Completed"]] as const;
const STATUS_COLOR: Record<string, string> = { in_progress: "#60A5FA", completed: "#34D399", on_hold: "#F59E0B", not_started: "#94A3B8" };
const PRIORITY_COLOR: Record<string, string> = { high: colors.danger, medium: colors.warning, low: colors.textFaint };
function label(s: string) { return s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"; }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 };

function PendingTab({ title, batch }: { title: string; batch: string }) {
  return <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}><p style={{ fontSize: "0.85rem", color: colors.textFaint }}>{title} isn&apos;t built yet ({batch}).</p></div>;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState({ total: 0, completed: 0, pct: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", due_date: "", staff_id: "" });
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: "", description: "", startDate: "", dueDate: "" });
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ staffId: "", projectRole: "" });

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/tasks?projectId=${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/milestones`).then(r => r.json()),
      fetch(`/api/projects/${id}/team`).then(r => r.json()),
      fetch("/api/staff").then(r => r.json()).catch(() => ({ staff: [] })),
    ]).then(([p, t, m, tm, s]) => {
      setProject(p.project || null);
      setProgress(p.progress || { total: 0, completed: 0, pct: 0 });
      setTasks(t.tasks || []);
      setMilestones(m.milestones || []);
      setTeam(tm.team || []);
      setStaff((s.staff || []).filter((x: Staff) => x.active));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: string) {
    await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function addTask() {
    if (!newTask.title.trim() || !newTask.staff_id) return;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, ...newTask }) });
    setNewTask({ title: "", description: "", priority: "medium", due_date: "", staff_id: "" }); setShowAddTask(false); load();
  }
  async function moveTask(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function addMilestone() {
    if (!newMilestone.name.trim()) return;
    await fetch(`/api/projects/${id}/milestones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMilestone) });
    setNewMilestone({ name: "", description: "", startDate: "", dueDate: "" }); setShowAddMilestone(false); load();
  }
  async function updateMilestone(mid: string, patch: Partial<Milestone>) {
    await fetch(`/api/projects/${id}/milestones/${mid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    load();
  }
  async function addMember() {
    if (!newMember.staffId) return;
    await fetch(`/api/projects/${id}/team`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMember) });
    setNewMember({ staffId: "", projectRole: "" }); setShowAddMember(false); load();
  }
  async function removeMember(memberId: string) {
    await fetch(`/api/projects/${id}/team/${memberId}`, { method: "DELETE" });
    load();
  }
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!project) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: font.sans }}>
      <p style={{ color: colors.textFaint, marginBottom: 12 }}>Project not found.</p>
      <Link href="/dashboard/projects/all" style={{ color: colors.primary, fontSize: "0.85rem" }}>&larr; Back to Projects</Link>
    </div>
  );


  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1100 }}>
      <Link href="/dashboard/projects/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Projects</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, margin: "14px 0 6px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{project.name}</h1>
            <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[project.status] || colors.textFaint) + "20", color: STATUS_COLOR[project.status] || colors.textFaint }}>{label(project.status)}</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: colors.textFaint, marginTop: 4, fontFamily: font.mono }}>{project.project_number} {project.customer_name && `\u00b7 ${project.customer_name}`}</p>
        </div>
        {project.status === "completed" ? (
          <Link href={`/dashboard/projects/${id}/complete`} style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(52,211,153,0.15)", border: `1px solid ${colors.success}40`, color: colors.success, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>View Completion Summary</Link>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <select value={project.status} onChange={e => updateStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
              {["not_started", "in_progress", "on_hold"].map(s => <option key={s} value={s}>{label(s)}</option>)}
            </select>
            <Link href={`/dashboard/projects/${id}/complete`} style={{ padding: "9px 16px", borderRadius: 8, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none", whiteSpace: "nowrap" }}>Mark Completed</Link>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, margin: "16px 0 20px", overflowX: "auto" }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent", color: tab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>{t}</button>)}
        {LINK_TABS.map(t => <Link key={t.label} href={`/dashboard/projects/${id}/${t.href}`} style={{ padding: "9px 14px", color: colors.textFaint, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none", whiteSpace: "nowrap" }}>{t.label}</Link>)}
      </div>

      {tab === "Overview" && (
        <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Project Information</p>
            {[["Customer", project.customer_name], ["Type", label(project.type)], ["Start Date", fmtDate(project.start_date)], ["Due Date", fmtDate(project.due_date)], ["Project Manager", project.manager_name]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${colors.border}` }}><span style={{ fontSize: "0.78rem", color: colors.textFaint }}>{k}</span><span style={{ fontSize: "0.8rem", color: colors.textMed }}>{v || "\u2014"}</span></div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 10 }}>Progress</p>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 8 }}><div style={{ width: `${progress.pct}%`, height: "100%", background: colors.primary }} /></div>
              <p style={{ fontSize: "0.78rem", color: colors.textMed }}>{progress.pct}% &middot; {progress.completed}/{progress.total} tasks</p>
            </div>
            <div style={cardStyle}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 10 }}>Financials</p>
              {[["Project Value", fmtN(Number(project.project_value))], ["Paid", fmtN(Number(project.paid_amount))], ["Due", fmtN(Number(project.project_value) - Number(project.paid_amount))]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span style={{ fontSize: "0.76rem", color: colors.textFaint }}>{k}</span><span style={{ fontSize: "0.8rem", color: colors.textMed, fontFamily: font.mono }}>{v}</span></div>
              ))}
            </div>
          </div>
          {project.description && (
            <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 8 }}>Description</p>
              <p style={{ fontSize: "0.82rem", color: colors.textMed, lineHeight: 1.6 }}>{project.description}</p>
            </div>
          )}
        </div>
      )}

      {tab === "Tasks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={() => setShowAddTask(v => !v)} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>+ Add Task</button>
          </div>
          {showAddTask && (
            <div style={{ ...cardStyle, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} placeholder="Task title" style={inputStyle} />
              <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <select value={newTask.staff_id} onChange={e => setNewTask(t => ({ ...t, staff_id: e.target.value }))} style={inputStyle}>
                  <option value="">Assignee</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="date" value={newTask.due_date} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))} style={inputStyle} />
              </div>
              <button onClick={addTask} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Save</button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {TASK_COLS.map(([key, colLabel]) => (
              <div key={key} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, borderRadius: 10 }}>
                <div style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.border}` }}>
                  <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.8rem" }}>{colLabel} <span style={{ color: colors.textFaint, fontWeight: 400 }}>({tasks.filter(t => t.status === key).length})</span></p>
                </div>
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, minHeight: 80 }}>
                  {tasks.filter(t => t.status === key).map(t => (
                    <div key={t.id} style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
                      <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>{t.title}</p>
                      <p style={{ fontSize: "0.68rem", color: colors.textFaint, marginBottom: 6 }}>{t.staff_name || "Unassigned"} {t.due_date && `\u00b7 ${fmtDate(t.due_date)}`}</p>
                      <select value={t.status} onChange={e => moveTask(t.id, e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: "0.68rem" }}>
                        {TASK_COLS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Milestones" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Milestones</p>
            <button onClick={() => setShowAddMilestone(v => !v)} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>+ Add Milestone</button>
          </div>
          {showAddMilestone && (
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newMilestone.name} onChange={e => setNewMilestone(m => ({ ...m, name: e.target.value }))} placeholder="Milestone name" style={inputStyle} />
              <input value={newMilestone.description} onChange={e => setNewMilestone(m => ({ ...m, description: e.target.value }))} placeholder="Description" style={inputStyle} />
              <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input type="date" value={newMilestone.startDate} onChange={e => setNewMilestone(m => ({ ...m, startDate: e.target.value }))} style={inputStyle} />
                <input type="date" value={newMilestone.dueDate} onChange={e => setNewMilestone(m => ({ ...m, dueDate: e.target.value }))} style={inputStyle} />
              </div>
              <button onClick={addMilestone} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Save</button>
            </div>
          )}
          {milestones.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No milestones yet</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Milestone", "Due Date", "Status", "Progress"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{milestones.map((m, i) => (
                  <tr key={m.id}>
                    <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${colors.border}` }}>{i + 1}. {m.name}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtDate(m.due_date)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}>
                      <select value={m.status} onChange={e => updateMilestone(m.id, { status: e.target.value, progress_pct: e.target.value === "completed" ? 100 : m.progress_pct })} style={{ ...inputStyle, padding: "4px 8px", fontSize: "0.7rem", width: "auto" }}>
                        {["not_started", "in_progress", "completed"].map(s => <option key={s} value={s}>{label(s)}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}`, minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ width: `${m.progress_pct}%`, height: "100%", background: colors.primary }} /></div>
                        <span style={{ fontSize: "0.72rem", color: colors.textFaint }}>{m.progress_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Timeline" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 16 }}>Timeline</p>
          {milestones.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>Add milestones with start/due dates to see the timeline</p> : (() => {
            const dated = milestones.filter(m => m.start_date && m.due_date);
            if (dated.length === 0) return <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>Add start and due dates to milestones to see the timeline</p>;
            const allDates = dated.flatMap(m => [new Date(m.start_date!).getTime(), new Date(m.due_date!).getTime()]);
            const min = Math.min(...allDates), max = Math.max(...allDates);
            const span = Math.max(1, max - min);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowX: "auto" }}>
                {dated.map(m => {
                  const left = ((new Date(m.start_date!).getTime() - min) / span) * 100;
                  const width = Math.max(2, ((new Date(m.due_date!).getTime() - new Date(m.start_date!).getTime()) / span) * 100);
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 500 }}>
                      <span style={{ width: 160, flexShrink: 0, fontSize: "0.78rem", color: colors.textMed, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      <div style={{ flex: 1, position: "relative", height: 22, background: "rgba(255,255,255,0.03)", borderRadius: 4 }}>
                        <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "100%", borderRadius: 4, background: STATUS_COLOR[m.status === "completed" ? "completed" : m.status === "in_progress" ? "in_progress" : "not_started"], opacity: 0.85 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "Team" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Team</p>
            <button onClick={() => setShowAddMember(v => !v)} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>+ Add Member</button>
          </div>
          {showAddMember && (
            <div className="proj-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, marginBottom: 16 }}>
              <select value={newMember.staffId} onChange={e => setNewMember(m => ({ ...m, staffId: e.target.value }))} style={inputStyle}>
                <option value="">Select staff</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input value={newMember.projectRole} onChange={e => setNewMember(m => ({ ...m, projectRole: e.target.value }))} placeholder="Role (e.g. Developer)" style={inputStyle} />
              <button onClick={addMember} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Add</button>
            </div>
          )}
          {team.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No team members yet</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Member", "Role", "Assigned", "Completed", "Email", ""].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{team.map(m => (
                  <tr key={m.id}>
                    <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${colors.border}` }}>{m.name}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{m.project_role || "\u2014"}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{m.assigned_tasks}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{m.completed_tasks}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{m.email}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><button onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", color: colors.danger, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>Remove</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Invoices" && <PendingTab title="Invoices" batch="Batch 12, Finance" />}
      {tab === "Settings" && <PendingTab title="Project settings" batch="a future batch" />}
      <style>{`@media (max-width: 680px) { .proj-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
