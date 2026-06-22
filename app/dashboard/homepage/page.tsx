"use client";
import { useState, useEffect } from "react";
import { inputStyle, labelStyle, btnGold, sans } from "../Editor";
import { homepageDefaults, type HomepageContent } from "@/lib/homepage-defaults";

const card: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 22, marginBottom: 18, display: "grid", gap: 14 };
const sectionTitle: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 700, color: "#fff" };
const ta: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: "vertical" };

export default function HomepageEditor() {
  const [c, setC] = useState<HomepageContent>(homepageDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/site-content").then((r) => r.json()).then((d) => { if (d.homepage) setC(d.homepage); setLoading(false); });
  }, []);

  // set a field: section -> key (supports nested cta via key "primaryCta.label")
  function set(section: keyof HomepageContent, key: string, value: string) {
    setC((prev) => {
      const next = structuredClone(prev) as Record<string, Record<string, unknown>>;
      if (key.includes(".")) {
        const [a, b] = key.split(".");
        (next[section as string][a] as Record<string, unknown>)[b] = value;
      } else {
        next[section as string][key] = value;
      }
      return next as unknown as HomepageContent;
    });
  }

  async function save() {
    setMsg(""); setSaving(true);
    const res = await fetch("/api/site-content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ homepage: c }) });
    const d = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Saved. Live on the homepage." : (d.error || "Failed to save."));
  }

  if (loading) return <div style={{ padding: 36, fontFamily: sans, color: "rgba(226,232,240,0.4)" }}>Loading…</div>;

  const Field = ({ section, k, label, area }: { section: keyof HomepageContent; k: string; label: string; area?: boolean }) => {
    const sec = c[section] as Record<string, unknown>;
    const val = k.includes(".")
      ? String(((sec[k.split(".")[0]] as Record<string, unknown>)[k.split(".")[1]]) ?? "")
      : String(sec[k] ?? "");
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        {area
          ? <textarea style={ta} value={val} onChange={(e) => set(section, k, e.target.value)} />
          : <input style={inputStyle} value={val} onChange={(e) => set(section, k, e.target.value)} />}
      </div>
    );
  };

  return (
    <div style={{ padding: "clamp(20px,4vw,36px)", fontFamily: sans, maxWidth: 900 }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", position: "sticky", top: 0 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.1rem,3vw,1.4rem)", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Homepage</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(226,232,240,0.4)" }}>Edit the copy shown on jktl.com.ng. Products, services and testimonials are managed in their own sections.</p>
        </div>
        <button style={btnGold} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
      {msg && <p style={{ color: msg.startsWith("Saved") ? "#34D399" : "#F87171", fontSize: "0.84rem", marginBottom: 14 }}>{msg}</p>}

      <div style={card}>
        <p style={sectionTitle}>Hero</p>
        <Field section="hero" k="badge" label="Badge" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field section="hero" k="headlineLine1" label="Headline (line 1)" />
          <Field section="hero" k="headlineAccent" label="Headline (gold accent)" />
        </div>
        <Field section="hero" k="subhead" label="Subheadline" area />
        <Field section="hero" k="note" label="Small note line" />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Field section="hero" k="primaryCta.label" label="Primary button label" />
          <Field section="hero" k="primaryCta.href" label="Primary button link" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Field section="hero" k="secondaryCta.label" label="Secondary button label" />
          <Field section="hero" k="secondaryCta.href" label="Secondary button link" />
        </div>
      </div>

      <div style={card}>
        <p style={sectionTitle}>Founder</p>
        <Field section="founder" k="heading" label="Heading (use a new line for the line break)" area />
      </div>

      <div style={card}>
        <p style={sectionTitle}>Desk Suite</p>
        <Field section="deskSuite" k="heading" label="Heading" />
        <Field section="deskSuite" k="subhead" label="Subheading" />
      </div>

      <div style={card}>
        <p style={sectionTitle}>How It Works</p>
        <Field section="howItWorks" k="heading" label="Heading" />
        <Field section="howItWorks" k="subhead" label="Subheading" />
      </div>

      <div style={card}>
        <p style={sectionTitle}>Agency Services</p>
        <Field section="agencyServices" k="heading" label="Heading" />
        <Field section="agencyServices" k="subhead" label="Subheading" area />
      </div>

      <div style={card}>
        <p style={sectionTitle}>Testimonials</p>
        <Field section="testimonials" k="heading" label="Heading" />
        <Field section="testimonials" k="subhead" label="Subheading" />
        <p style={{ fontSize: "0.76rem", color: "rgba(226,232,240,0.35)" }}>The quotes themselves are managed under Testimonials. This section only shows on the site once at least one testimonial is published.</p>
      </div>

      <div style={card}>
        <p style={sectionTitle}>Final CTA</p>
        <Field section="finalCta" k="heading" label="Heading" />
        <Field section="finalCta" k="subhead" label="Subheading" area />
      </div>

      <button style={{ ...btnGold, marginTop: 4 }} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
    </div>
  );
}
