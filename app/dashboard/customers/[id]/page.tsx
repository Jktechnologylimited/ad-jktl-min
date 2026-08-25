"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { colors, font } from "@/lib/design-tokens";

interface Customer {
  id: string; customer_number: string; name: string; status: string; rating: number;
  primary_contact_name?: string; primary_contact_role?: string; primary_contact_email?: string; primary_contact_phone?: string;
  location?: string; customer_since: string; owner_name?: string;
}
interface Business { id: string; name: string; is_primary: boolean; industry?: string; employees?: string; website?: string; status: string; created_at: string; }
interface Contact { id: string; name: string; position?: string; email?: string; phone?: string; is_primary: boolean; }
interface Offering { id: string; product: string; plan: string; setup_fee: string; monthly_fee: string; status: string; activated_at?: string; }
interface DealItem { id: string; name?: string; proposal_number?: string; stage?: string; status: string; estimated_value?: string; total?: string; }
interface ProjectItem { id: string; project_number: string; name: string; type: string; status: string; due_date?: string; }
interface MaintenanceItem { service: string; plan: string; renewalDate: string; amountPerYear: number; status: string; }
interface Activity { id: string; type: string; title: string; body?: string; actor_name?: string; created_at: string; }

const TABS = ["Overview", "Businesses", "Contacts", "Commercial", "Projects", "Support", "Files", "Maintenance", "Logs"] as const;
const STATUS_COLOR: Record<string, string> = { active: "#34D399", onboarding: "#60A5FA", inactive: "#94A3B8", prospect: "#C9A84C" };
const ACTIVITY_ICON: Record<string, string> = { created: "NW", email: "EM", call: "CL", status_change: "ST", note: "NT", meeting: "MT", task: "TK" };
function fmtN(n: number) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "\u2014"; }
function timeAgo(d: string) { const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000)); if (m < 60) return `${m}m ago`; if (m < 1440) return `${Math.floor(m / 60)}h ago`; return `${Math.floor(m / 1440)}d ago`; }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${colors.border}`, color: "#fff", fontFamily: font.sans, fontSize: "0.82rem", outline: "none" };
const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 };

function PendingTab({ title, batch }: { title: string; batch: string }) {
  return <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}><p style={{ fontSize: "0.85rem", color: colors.textFaint }}>{title} isn&apos;t built yet ({batch}).</p></div>;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [opportunities, setOpportunities] = useState<DealItem[]>([]);
  const [proposals, setProposals] = useState<DealItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [commercialTab, setCommercialTab] = useState<"offerings" | "deals" | "invoices" | "payments" | "subs">("offerings");
  const [loading, setLoading] = useState(true);

  const [showAddBiz, setShowAddBiz] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: "", industry: "", employees: "", website: "" });
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", position: "", email: "", phone: "" });
  const [note, setNote] = useState("");

  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [editBizForm, setEditBizForm] = useState({ name: "", industry: "", employees: "", website: "", status: "active" });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactForm, setEditContactForm] = useState({ name: "", position: "", email: "", phone: "" });

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/customers/${id}`).then(r => r.json()),
      fetch(`/api/customers/${id}/businesses`).then(r => r.json()),
      fetch(`/api/customers/${id}/contacts`).then(r => r.json()),
      fetch(`/api/customers/${id}/commercial`).then(r => r.json()),
      fetch(`/api/customers/${id}/maintenance`).then(r => r.json()),
      fetch(`/api/customers/${id}/activity`).then(r => r.json()),
      fetch(`/api/projects?customerId=${id}&pageSize=50`).then(r => r.json()).catch(() => ({ projects: [] })),
    ]).then(([c, b, ct, com, m, a, proj]) => {
      setCustomer(c.customer || null);
      setBusinesses(b.businesses || []);
      setContacts(ct.contacts || []);
      setOfferings(com.purchasedOfferings || []);
      setOpportunities(com.opportunities || []);
      setProposals(com.proposals || []);
      setMaintenance(m.items || []);
      setActivities(a.activities || []);
      setProjects(proj.projects || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function addBusiness() {
    if (!newBiz.name.trim()) return;
    await fetch(`/api/customers/${id}/businesses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBiz) });
    setNewBiz({ name: "", industry: "", employees: "", website: "" }); setShowAddBiz(false); load();
  }
  async function addContact() {
    if (!newContact.name.trim()) return;
    await fetch(`/api/customers/${id}/contacts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newContact) });
    setNewContact({ name: "", position: "", email: "", phone: "" }); setShowAddContact(false); load();
  }

  function startEditBiz(b: Business) {
    setEditingBizId(b.id);
    setEditBizForm({ name: b.name, industry: b.industry || "", employees: b.employees || "", website: b.website || "", status: b.status });
  }
  async function saveEditBiz(businessId: string) {
    await fetch(`/api/customers/${id}/businesses/${businessId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editBizForm) });
    setEditingBizId(null); load();
  }
  async function deleteBusiness(businessId: string) {
    if (!confirm("Remove this business?")) return;
    await fetch(`/api/customers/${id}/businesses/${businessId}`, { method: "DELETE" });
    load();
  }
  async function setPrimaryBiz(businessId: string) {
    await fetch(`/api/customers/${id}/businesses/${businessId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_primary: true }) });
    load();
  }

  function startEditContact(c: Contact) {
    setEditingContactId(c.id);
    setEditContactForm({ name: c.name, position: c.position || "", email: c.email || "", phone: c.phone || "" });
  }
  async function saveEditContact(contactId: string) {
    await fetch(`/api/customers/${id}/contacts/${contactId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editContactForm) });
    setEditingContactId(null); load();
  }
  async function deleteContact(contactId: string) {
    if (!confirm("Remove this contact?")) return;
    await fetch(`/api/customers/${id}/contacts/${contactId}`, { method: "DELETE" });
    load();
  }
  async function setPrimaryContact(contactId: string) {
    await fetch(`/api/customers/${id}/contacts/${contactId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_primary: true }) });
    load();
  }
  async function addNote() {
    if (!note.trim()) return;
    await fetch(`/api/customers/${id}/activity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "note", title: "Note added", body: note.trim() }) });
    setNote(""); load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint, fontFamily: font.sans }}>Loading...</div>;
  if (!customer) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: font.sans }}>
      <p style={{ color: colors.textFaint, marginBottom: 12 }}>Customer not found.</p>
      <Link href="/dashboard/customers/all" style={{ color: colors.primary, fontSize: "0.85rem" }}>&larr; Back to Customers</Link>
    </div>
  );

  const revenueYtd = offerings.filter(o => o.status === "active").reduce((s, o) => s + Number(o.monthly_fee) * 12, 0);
  const outstanding = offerings.filter(o => o.status === "pending_payment").reduce((s, o) => s + Number(o.setup_fee), 0);

  const quickActions = [
    { label: "Create Proposal", href: `/dashboard/proposals/new?customerId=${id}` },
    { label: "Create Project", href: `/dashboard/projects/new?customerId=${id}` },
    { label: "Create Invoice", href: "/dashboard/billing" },
    { label: "New Support Ticket", href: "/dashboard/support" },
    { label: "Send Message", href: "#note" },
    { label: "Upload File", href: "#files" },
    { label: "Schedule Meeting", href: "#note" },
    { label: "Add Note", href: "#note" },
    { label: "View Reports", href: "/dashboard/analytics" },
  ];

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: font.sans, maxWidth: 1100 }}>
      <Link href="/dashboard/customers/all" style={{ fontSize: "0.78rem", color: colors.textFaint, textDecoration: "none" }}>&larr; Back to Customers</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, margin: "14px 0 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: font.mono, fontWeight: 700, color: colors.primary }}>{customer.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{customer.name}</h1>
              <span style={{ fontFamily: font.mono, fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px", borderRadius: 4, textTransform: "uppercase", background: (STATUS_COLOR[customer.status] || colors.textFaint) + "20", color: STATUS_COLOR[customer.status] || colors.textFaint }}>{customer.status} Customer</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, marginTop: 2 }}>
              {customer.primary_contact_name} {customer.primary_contact_role && `\u00b7 ${customer.primary_contact_role}`} {customer.primary_contact_email && `\u00b7 ${customer.primary_contact_email}`} {customer.location && `\u00b7 ${customer.location}`}
            </p>
            <p style={{ fontSize: "0.72rem", color: colors.textFaint, marginTop: 3, fontFamily: font.mono }}>Customer Since: {fmtDate(customer.customer_since)} &middot; {customer.customer_number}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, margin: "16px 0 20px", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent", color: tab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div>
          <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={cardStyle}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Summary</p>
              {[["Customer Type", "Business"], ["Status", customer.status], ["Rating", "\u2605".repeat(customer.rating || 0) + "\u2606".repeat(5 - (customer.rating || 0))], ["Total Revenue (YTD)", fmtN(revenueYtd)], ["Outstanding", fmtN(outstanding)], ["Open Opportunities", String(opportunities.filter(o => o.status === "open").length)]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: "0.78rem", color: colors.textFaint }}>{k}</span><span style={{ fontSize: "0.8rem", color: colors.textMed, textTransform: k === "Status" ? "capitalize" : "none" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={cardStyle}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 12 }}>Primary Contact</p>
                <p style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600 }}>{customer.primary_contact_name || "\u2014"}</p>
                <p style={{ fontSize: "0.78rem", color: colors.textFaint, marginTop: 2 }}>{customer.primary_contact_role}</p>
                <p style={{ fontSize: "0.78rem", color: colors.textMed, marginTop: 8 }}>{customer.primary_contact_email}</p>
                <p style={{ fontSize: "0.78rem", color: colors.textMed }}>{customer.primary_contact_phone}</p>
              </div>
              <div id="note" style={cardStyle}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 10 }}>Send a Message / Add a Note</p>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write a note..." rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
                <button onClick={addNote} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Save</button>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 14 }}>Quick Actions</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
              {quickActions.map(a => (
                <Link key={a.label} href={a.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "14px 10px", borderRadius: 8, fontSize: "0.76rem", fontWeight: 600, color: colors.textMed, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, textDecoration: "none" }}>{a.label}</Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Businesses" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{customer.name} has {businesses.length} business{businesses.length === 1 ? "" : "es"}</p>
            <button onClick={() => setShowAddBiz(v => !v)} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>+ Add Business</button>
          </div>
          {showAddBiz && (
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newBiz.name} onChange={e => setNewBiz(b => ({ ...b, name: e.target.value }))} placeholder="Business name" style={inputStyle} />
              <input value={newBiz.industry} onChange={e => setNewBiz(b => ({ ...b, industry: e.target.value }))} placeholder="Industry" style={inputStyle} />
              <input value={newBiz.employees} onChange={e => setNewBiz(b => ({ ...b, employees: e.target.value }))} placeholder="Employees (e.g. 11 - 50)" style={inputStyle} />
              <input value={newBiz.website} onChange={e => setNewBiz(b => ({ ...b, website: e.target.value }))} placeholder="Website" style={inputStyle} />
              <button onClick={addBusiness} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Save</button>
            </div>
          )}
          <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {businesses.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No businesses yet</p> : businesses.map(b => (
              <div key={b.id} style={{ padding: 16, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
                {editingBizId === b.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input value={editBizForm.name} onChange={e => setEditBizForm(f => ({ ...f, name: e.target.value }))} placeholder="Business name" style={inputStyle} />
                    <input value={editBizForm.industry} onChange={e => setEditBizForm(f => ({ ...f, industry: e.target.value }))} placeholder="Industry" style={inputStyle} />
                    <input value={editBizForm.employees} onChange={e => setEditBizForm(f => ({ ...f, employees: e.target.value }))} placeholder="Employees" style={inputStyle} />
                    <input value={editBizForm.website} onChange={e => setEditBizForm(f => ({ ...f, website: e.target.value }))} placeholder="Website" style={inputStyle} />
                    <select value={editBizForm.status} onChange={e => setEditBizForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                      <option value="active">Active</option><option value="inactive">Inactive</option>
                    </select>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => saveEditBiz(b.id)} style={{ padding: "7px 14px", borderRadius: 6, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.74rem", cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditingBizId(null)} style={{ padding: "7px 14px", borderRadius: 6, background: "none", border: `1px solid ${colors.border}`, color: colors.textMed, fontSize: "0.74rem", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{b.name}</p>
                      {b.is_primary && <span style={{ fontFamily: font.mono, fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(201,168,76,0.2)", color: colors.primary }}>PRIMARY</span>}
                    </div>
                    {[["Industry", b.industry], ["Employees", b.employees], ["Website", b.website], ["Status", b.status], ["Joined", fmtDate(b.created_at)]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.78rem" }}><span style={{ color: colors.textFaint }}>{k}</span><span style={{ color: colors.textMed }}>{v || "\u2014"}</span></div>
                    ))}
                    <div style={{ display: "flex", gap: 12, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.border}` }}>
                      <button onClick={() => startEditBiz(b)} style={{ background: "none", border: "none", color: colors.primary, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>Edit</button>
                      {!b.is_primary && <button onClick={() => setPrimaryBiz(b.id)} style={{ background: "none", border: "none", color: colors.textMed, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>Set Primary</button>}
                      <button onClick={() => deleteBusiness(b.id)} style={{ background: "none", border: "none", color: colors.danger, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>Remove</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Contacts" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>All contacts under {customer.name}</p>
            <button onClick={() => setShowAddContact(v => !v)} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>+ Add Contact</button>
          </div>
          {showAddContact && (
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} placeholder="Name" style={inputStyle} />
              <input value={newContact.position} onChange={e => setNewContact(c => ({ ...c, position: e.target.value }))} placeholder="Position" style={inputStyle} />
              <input value={newContact.email} onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))} placeholder="Email" style={inputStyle} />
              <input value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))} placeholder="Phone" style={inputStyle} />
              <button onClick={addContact} style={{ padding: "8px 16px", borderRadius: 7, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", alignSelf: "flex-start" }}>Save</button>
            </div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Name", "Position", "Email", "Phone", "", "Actions"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {contacts.length === 0 ? <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: colors.textFaint, fontSize: "0.8rem", fontStyle: "italic" }}>No contacts yet</td></tr> : contacts.map(c => (
                  editingContactId === c.id ? (
                    <tr key={c.id}>
                      <td colSpan={6} style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.02)" }}>
                        <div className="cust-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <input value={editContactForm.name} onChange={e => setEditContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" style={inputStyle} />
                          <input value={editContactForm.position} onChange={e => setEditContactForm(f => ({ ...f, position: e.target.value }))} placeholder="Position" style={inputStyle} />
                          <input value={editContactForm.email} onChange={e => setEditContactForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" style={inputStyle} />
                          <input value={editContactForm.phone} onChange={e => setEditContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => saveEditContact(c.id)} style={{ padding: "6px 12px", borderRadius: 6, background: colors.primary, color: colors.primaryText, border: "none", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer" }}>Save</button>
                          <button onClick={() => setEditingContactId(null)} style={{ padding: "6px 12px", borderRadius: 6, background: "none", border: `1px solid ${colors.border}`, color: colors.textMed, fontSize: "0.72rem", cursor: "pointer" }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.id}>
                      <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${colors.border}` }}>{c.name}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{c.position || "\u2014"}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{c.email || "\u2014"}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{c.phone || "\u2014"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}>{c.is_primary && <span style={{ color: colors.primary }}>&#9733;</span>}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => startEditContact(c)} style={{ background: "none", border: "none", color: colors.primary, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>Edit</button>
                          {!c.is_primary && <button onClick={() => setPrimaryContact(c.id)} style={{ background: "none", border: "none", color: colors.textMed, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>Set Primary</button>}
                          <button onClick={() => deleteContact(c.id)} style={{ background: "none", border: "none", color: colors.danger, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Commercial" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${colors.border}`, overflowX: "auto" }}>
            {(["offerings", "deals", "invoices", "payments", "subs"] as const).map(t => (
              <button key={t} onClick={() => setCommercialTab(t)} style={{ padding: "8px 12px", background: "none", border: "none", borderBottom: commercialTab === t ? `2px solid ${colors.primary}` : "2px solid transparent", color: commercialTab === t ? colors.primary : colors.textFaint, fontWeight: 700, fontSize: "0.76rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                {t === "offerings" ? "Purchased Offerings" : t === "deals" ? "Proposals / Deals" : t === "invoices" ? "Invoices" : t === "payments" ? "Payments" : "Subscriptions"}
              </button>
            ))}
          </div>
          {commercialTab === "offerings" && (
            offerings.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No purchased offerings yet &mdash; link a product/tenant via Subscriptions &rarr; Clients.</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Offering", "Plan", "Setup Price", "Recurring", "Status", "Start Date"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{offerings.map(o => (
                    <tr key={o.id}>
                      <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${colors.border}`, textTransform: "capitalize" }}>{o.product}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{o.plan}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtN(Number(o.setup_fee))}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtN(Number(o.monthly_fee))}/yr</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: (STATUS_COLOR[o.status] || colors.textFaint) + "20", color: STATUS_COLOR[o.status] || colors.textFaint }}>{o.status}</span></td>
                      <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtDate(o.activated_at)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )
          )}
          {commercialTab === "deals" && (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.textFaint, marginBottom: 8 }}>OPPORTUNITIES</p>
              {opportunities.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", marginBottom: 16 }}>None linked yet</p> : opportunities.map(o => (
                <Link key={o.id} href={`/dashboard/opportunities/${o.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", textDecoration: "none", borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff" }}>{o.name} <span style={{ color: colors.textFaint, fontSize: "0.72rem" }}>({o.stage})</span></span>
                  <span style={{ fontSize: "0.78rem", color: colors.primary, fontFamily: font.mono }}>{fmtN(Number(o.estimated_value))}</span>
                </Link>
              ))}
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.textFaint, margin: "18px 0 8px" }}>PROPOSALS</p>
              {proposals.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>None linked yet</p> : proposals.map(p => (
                <Link key={p.id} href={`/dashboard/proposals/${p.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", textDecoration: "none", borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: "0.82rem", color: "#fff", fontFamily: font.mono }}>{p.proposal_number} <span style={{ color: colors.textFaint, fontSize: "0.72rem", fontFamily: font.sans }}>({p.status})</span></span>
                  <span style={{ fontSize: "0.78rem", color: colors.primary, fontFamily: font.mono }}>{fmtN(Number(p.total))}</span>
                </Link>
              ))}
            </div>
          )}
          {(commercialTab === "invoices" || commercialTab === "payments" || commercialTab === "subs") && (
            <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>{commercialTab === "invoices" ? "Invoices" : commercialTab === "payments" ? "Payments" : "Subscription management"} isn&apos;t built yet (Batch 12, Finance).</p>
          )}
        </div>
      )}

      {tab === "Projects" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>All projects for {customer.name}</p>
            <Link href={`/dashboard/projects/new?customerId=${id}`} style={{ padding: "7px 14px", borderRadius: 7, background: colors.primary, color: colors.primaryText, fontWeight: 700, fontSize: "0.76rem", textDecoration: "none" }}>+ New Project</Link>
          </div>
          {projects.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No projects yet</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {projects.map(p => (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: 6, textDecoration: "none", borderBottom: `1px solid ${colors.border}` }}>
                  <div>
                    <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: "0.72rem", color: colors.textFaint, marginLeft: 8, fontFamily: font.mono }}>{p.project_number}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(96,165,250,0.2)", color: "#60A5FA", textTransform: "uppercase" }}>{p.status.replace("_", " ")}</span>
                    <span style={{ fontSize: "0.74rem", color: colors.textFaint, fontFamily: font.mono }}>{fmtDate(p.due_date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "Support" && <PendingTab title="Support & Communication" batch="Batch 10" />}
      {tab === "Files" && <div id="files"><PendingTab title="Files & Documents" batch="a future batch" /></div>}

      {tab === "Maintenance" && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 4 }}>Maintenance &amp; Renewals</p>
          <p style={{ fontSize: "0.76rem", color: colors.textFaint, marginBottom: 16 }}>Active maintenance / subscriptions.</p>
          {maintenance.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic" }}>No active subscriptions</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Service", "Plan", "Renewal Date", "Amount / Year", "Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "0.64rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{maintenance.map((m, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 10px", fontSize: "0.82rem", color: "#fff", borderBottom: `1px solid ${colors.border}`, textTransform: "capitalize" }}>{m.service}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}` }}>{m.plan}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.78rem", color: colors.textFaint, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtDate(m.renewalDate)}</td>
                    <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: colors.textMed, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono }}>{fmtN(m.amountPerYear)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${colors.border}` }}><span style={{ fontFamily: font.mono, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(52,211,153,0.2)", color: colors.success }}>{m.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Logs" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Activity Timeline</p>
          </div>
          <p style={{ fontSize: "0.76rem", color: colors.textFaint, marginBottom: 16 }}>All activities across businesses, deals and communications.</p>
          {activities.length === 0 ? <p style={{ fontSize: "0.8rem", color: colors.textFaint, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No activity yet</p> : (
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
      <style>{`@media (max-width: 680px) { .cust-2col { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
