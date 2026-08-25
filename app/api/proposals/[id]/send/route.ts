import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getProposal } from "@/lib/proposals";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/send -- Sheet 8. Generates a real access token,
// builds the public link on jktl-website (admin.jktl.com.ng is internal-only
// -- see JKTL_CODEBASE_MAP.md), sends a real email via Resend, and moves the
// proposal to 'sent'. Can also be used to save as draft (send=false).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const proposal = await getProposal(id);
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.status !== "draft") return NextResponse.json({ error: "This proposal has already been sent" }, { status: 400 });

    const b = await req.json();
    const sendTo: string[] = (b.sendTo || []).filter(Boolean);
    if (b.saveAsDraft) {
      await sql`UPDATE proposals SET sent_to = ${JSON.stringify(sendTo)}, sent_cc = ${JSON.stringify(b.cc || [])}, sent_subject = ${b.subject || null}, sent_message = ${b.message || null}, updated_at = NOW() WHERE id = ${id}`;
      return NextResponse.json({ ok: true, savedDraft: true });
    }

    if (sendTo.length === 0) return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    if (!(b.subject || "").trim()) return NextResponse.json({ error: "Subject is required" }, { status: 400 });

    const token = randomBytes(24).toString("hex");
    const siteUrl = process.env.NEXT_PUBLIC_MAIN_SITE || "https://jktl.com.ng";
    const link = `${siteUrl}/proposal/${token}`;

    await sql`
      UPDATE proposals
      SET status = 'sent', access_token = ${token}, sent_to = ${JSON.stringify(sendTo)}, sent_cc = ${JSON.stringify(b.cc || [])},
          sent_subject = ${b.subject}, sent_message = ${b.message || null}, sent_at = NOW(),
          request_acceptance = ${b.requestAcceptance !== false}, expiry_date = ${b.expiryDate || null},
          contact_email = COALESCE(contact_email, ${sendTo[0]}), updated_at = NOW()
      WHERE id = ${id}
    `;

    if (b.sendEmail !== false) {
      const html = `<p>${(b.message || "").replace(/\n/g, "<br>")}</p><p style="margin-top:20px;"><a href="${link}" style="background:#C9A84C;color:#060E2A;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View Proposal</a></p><p style="color:#888;font-size:12px;margin-top:16px;">${proposal.proposal_number} &middot; ${proposal.name}</p>`;
      for (const to of sendTo) {
        await sendEmail({ to, subject: b.subject, html });
      }
      for (const cc of (b.cc || [])) {
        await sendEmail({ to: cc, subject: `CC: ${b.subject}`, html });
      }
    }

    return NextResponse.json({ ok: true, token, link });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
