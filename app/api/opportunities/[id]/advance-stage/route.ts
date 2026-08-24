import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getOpportunity, STAGES } from "@/lib/opportunities";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/opportunities/[id]/advance-stage -- Sheet 7. Moves to the next
// stage in STAGES, logs the update summary + next-step as a real activity,
// optionally creates a real follow-up task, and optionally sends a real
// email to the opportunity's owner ("Notify team members" -- there is no
// broader team-distribution-list concept in this codebase yet, so this
// notifies the assigned owner, which is the one real, unambiguous recipient).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const opp = await getOpportunity(id);
    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    const idx = STAGES.indexOf(opp.stage);
    if (idx === -1 || idx >= STAGES.length - 1 || opp.stage.startsWith("Closed")) {
      return NextResponse.json({ error: "This opportunity has no next stage. Use Close instead." }, { status: 400 });
    }
    const nextStage = STAGES[idx + 1];

    const b = await req.json();
    const summary = (b.updateSummary || "").trim();
    if (!summary) return NextResponse.json({ error: "Update summary is required" }, { status: 400 });

    await sql`UPDATE opportunities SET stage = ${nextStage}, updated_at = NOW() WHERE id = ${id}`;
    await sql`
      INSERT INTO lead_activities (opportunity_id, type, title, body, actor_staff_id)
      VALUES (${id}, 'status_change', ${`Moved from ${opp.stage} to ${nextStage}`}, ${summary}, ${session.staffId || null})
    `;

    if (b.nextStepPlan) {
      await sql`
        INSERT INTO lead_activities (opportunity_id, type, title, body, actor_staff_id)
        VALUES (${id}, 'note', 'Next step / action plan', ${b.nextStepPlan}, ${session.staffId || null})
      `;
    }

    if (b.createFollowUpTask) {
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 3);
      await sql`
        INSERT INTO staff_tasks (staff_id, opportunity_id, title, description, due_date, priority)
        VALUES (${opp.owner_staff_id || session.staffId}, ${id}, ${`Follow up: ${opp.name}`}, ${b.nextStepPlan || summary}, ${dueDate.toISOString().slice(0, 10)}, 'high')
      `;
    }

    let notified = false;
    if (b.notifyTeam && opp.owner_staff_id) {
      const staffRows = await sql`SELECT email, name FROM staff WHERE id = ${opp.owner_staff_id} LIMIT 1`;
      const owner = staffRows[0];
      if (owner?.email) {
        const result = await sendEmail({
          to: owner.email,
          subject: `${opp.name} moved to ${nextStage}`,
          html: `<p>Hi ${owner.name || ""},</p><p><strong>${opp.name}</strong> (${opp.customer_name}) moved from ${opp.stage} to <strong>${nextStage}</strong>.</p><p>${summary}</p>`,
        });
        notified = result.ok;
      }
    }

    return NextResponse.json({ ok: true, nextStage, notified });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
