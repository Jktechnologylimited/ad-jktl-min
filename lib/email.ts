// Shared Resend helper -- extracted from the pattern already used in
// app/api/clients/invite and app/api/affiliates/approve-payout, so new
// features (like Batch 04's "Notify team members") don't re-inline the
// same fetch call a third time.
const FROM = "JK Technology Limited <verify-accounts-jktl@mail.ibiz.name.ng>";

export async function sendEmail(opts: { to: string; subject: string; html: string; from?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set -- skipping send to", opts.to, "subject:", opts.subject);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: opts.from || FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error("[email] Resend rejected send:", await res.text().catch(() => ""));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false };
  }
}
