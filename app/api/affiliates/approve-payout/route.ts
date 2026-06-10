import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = "JK Technology Limited <verify-accounts-jktl@mail.ibiz.name.ng>";
const APP_URL = process.env.NEXT_PUBLIC_MAIN_SITE || "https://jktl.com.ng";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) { console.log(`[DEV] Email to ${to}: ${subject}`); return; }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  }).catch(err => console.error("Resend error:", err));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "No database" }, { status: 503 });

  const { action, id } = await req.json();
  const { sql } = await import("@/lib/db");

  try {
    if (action === "approve") {
      // Update status
      await sql`UPDATE affiliates SET status = 'active', updated_at = NOW() WHERE id = ${id}`;

      // Fetch affiliate details for email
      const rows = await sql`SELECT first_name, last_name, email, referral_code FROM affiliates WHERE id = ${id} LIMIT 1`;
      if (rows[0]) {
        const { first_name, last_name, email, referral_code } = rows[0] as Record<string, string>;
        await sendEmail(email,
          "Congratulations -- Your JKTL Affiliate Application is Approved!",
          `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060E2A;font-family:Arial,sans-serif;">
          <div style="max-width:520px;margin:40px auto;padding:0 20px;">
            <div style="background:#0B1640;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
              <div style="padding:24px 32px;background:#060E2A;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="font-size:11px;color:#C9A84C;letter-spacing:0.15em;text-transform:uppercase;margin:0;">JK Technology Limited -- Affiliate Programme</p>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 12px;">You're Approved, ${first_name}!</h2>
                <p style="color:rgba(226,232,240,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">
                  Welcome to the JKTL Affiliate Programme. You can now log in to your dashboard and start earning.
                </p>
                <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                  <p style="font-size:11px;color:rgba(226,232,240,0.4);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">Your Referral Code</p>
                  <p style="font-size:24px;font-weight:700;color:#C9A84C;font-family:monospace;margin:0;">${referral_code}</p>
                </div>
                <p style="color:rgba(226,232,240,0.5);font-size:13px;margin:0 0 20px;">
                  Your referral link: <span style="color:#C9A84C;">${APP_URL}/affiliates/join?ref=${referral_code}</span>
                </p>
                <a href="${APP_URL}/affiliates/dashboard"
                  style="display:block;background:#C9A84C;color:#060E2A;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;padding:14px 32px;border-radius:8px;text-align:center;">
                  Go to My Dashboard
                </a>
              </div>
              <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="font-size:11px;color:rgba(226,232,240,0.2);margin:0;">JK Technology Limited -- CAC RC-8754824</p>
              </div>
            </div>
          </div></body></html>`
        );
      }

    } else if (action === "reject") {
      await sql`UPDATE affiliates SET status = 'rejected', updated_at = NOW() WHERE id = ${id}`;

      const rows = await sql`SELECT first_name, email FROM affiliates WHERE id = ${id} LIMIT 1`;
      if (rows[0]) {
        const { first_name, email } = rows[0] as Record<string, string>;
        await sendEmail(email,
          "Update on Your JKTL Affiliate Application",
          `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060E2A;font-family:Arial,sans-serif;">
          <div style="max-width:520px;margin:40px auto;padding:0 20px;">
            <div style="background:#0B1640;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
              <div style="padding:24px 32px;background:#060E2A;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="font-size:11px;color:#C9A84C;letter-spacing:0.15em;text-transform:uppercase;margin:0;">JK Technology Limited -- Affiliate Programme</p>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#fff;margin:0 0 12px;">Hi ${first_name},</h2>
                <p style="color:rgba(226,232,240,0.6);font-size:15px;line-height:1.6;margin:0 0 20px;">
                  Thank you for applying to the JKTL Affiliate Programme. After reviewing your application, we are unable to approve it at this time.
                </p>
                <p style="color:rgba(226,232,240,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                  If you believe this is an error or would like to discuss further, please reach out to us directly.
                </p>
                <a href="mailto:info@jktl.com.ng"
                  style="display:block;background:rgba(255,255,255,0.06);color:rgba(226,232,240,0.8);font-weight:600;font-size:13px;text-decoration:none;padding:14px 32px;border-radius:8px;text-align:center;border:1px solid rgba(255,255,255,0.1);">
                  Contact Us -- info@jktl.com.ng
                </a>
              </div>
              <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                <p style="font-size:11px;color:rgba(226,232,240,0.2);margin:0;">JK Technology Limited -- CAC RC-8754824</p>
              </div>
            </div>
          </div></body></html>`
        );
      }

    } else if (action === "mark-paid") {
      await sql`UPDATE payout_requests SET status = 'paid', paid_at = NOW() WHERE id = ${id}`;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
