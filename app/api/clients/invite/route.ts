import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, product, orgName, trainingUrl } = await req.json();
  if (!email || !name) return NextResponse.json({ error: "Email and name required" }, { status: 400 });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const ACCOUNTS_URL = process.env.NEXT_PUBLIC_ACCOUNTS_URL || "https://accounts.jktl.com.ng";
  const FROM = "JK Technology Limited <verify-accounts-jktl@mail.ibiz.name.ng>";

  const productColors: Record<string, string> = {
    faithdesk: "#8B5CF6",
    detaildesk: "#F59E0B",
    schooldesk: "#10B981",
  };
  const productLabels: Record<string, string> = {
    faithdesk: "FaithDesk",
    detaildesk: "DetailDesk",
    schooldesk: "SchoolDesk",
  };

  const color = productColors[product] || "#C9A84C";
  const productLabel = productLabels[product] || product;
  const firstName = name.split(" ")[0];
  const signUpUrl = `${ACCOUNTS_URL}/sign-up`;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060E2A;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <div style="background:#0B1640;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
      <div style="background:#060E2A;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="font-family:monospace;font-size:11px;color:#C9A84C;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 4px;">JK Technology Limited</p>
        <p style="font-size:12px;color:rgba(226,232,240,0.4);margin:0;">${productLabel}</p>
      </div>
      <div style="padding:32px;">
        <div style="width:48px;height:4px;background:${color};border-radius:2px;margin-bottom:20px;"></div>
        <h2 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 12px;">
          Welcome to ${productLabel}, ${firstName}!
        </h2>
        <p style="font-size:15px;color:rgba(226,232,240,0.6);margin:0 0 24px;line-height:1.6;">
          Your ${productLabel} system for <strong style="color:#fff;">${orgName}</strong> is live and ready to use.
          Create your JKTL account to access your dashboard, manage billing, and watch training videos.
        </p>

        <a href="${signUpUrl}?email=${encodeURIComponent(email)}"
          style="display:block;background:${color};color:${product === "detaildesk" ? "#060E2A" : "#fff"};font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;text-align:center;margin-bottom:24px;">
          Create Your Account
        </a>

        ${trainingUrl ? `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="font-size:12px;color:rgba(226,232,240,0.4);text-transform:uppercase;letter-spacing:0.1em;font-family:monospace;margin:0 0 8px;">Training Video</p>
          <p style="font-size:14px;color:rgba(226,232,240,0.7);margin:0 0 12px;line-height:1.5;">
            Watch this video to get started with your ${productLabel} system.
          </p>
          <a href="${trainingUrl}"
            style="display:inline-block;background:rgba(255,255,255,0.08);color:#fff;font-weight:600;font-size:13px;text-decoration:none;padding:10px 20px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">
            Watch Training Video &rarr;
          </a>
        </div>
        ` : ""}

        <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:16px 20px;">
          <p style="font-size:13px;font-weight:700;color:#C9A84C;margin:0 0 8px;">Need help?</p>
          <p style="font-size:13px;color:rgba(226,232,240,0.55);margin:0;line-height:1.5;">
            WhatsApp us: <a href="https://wa.me/2347036580994" style="color:#C9A84C;">+234 703 658 0994</a><br/>
            Email: <a href="mailto:info@jktl.com.ng" style="color:#C9A84C;">info@jktl.com.ng</a>
          </p>
        </div>
      </div>
      <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="font-size:11px;color:rgba(226,232,240,0.2);margin:0;">JK Technology Limited -- CAC RC-8754824 -- jktl.com.ng</p>
      </div>
    </div>
  </div></body></html>`;

  if (!RESEND_KEY) {
    console.log(`[DEV] Invite email to ${email}`);
    return NextResponse.json({ ok: true, dev: true });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: `Your ${productLabel} system is ready -- Create your account`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Resend error: ${err}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
