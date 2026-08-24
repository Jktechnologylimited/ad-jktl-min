import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getOpportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

// POST /api/opportunities/[id]/close -- Sheet 8. Real close action (won or
// lost). "Create project from this opportunity" is captured as a real flag
// (project_requested) rather than creating a fake Projects entity -- Projects
// is Batch 07's job. This mirrors exactly how Batch 03's lead-convert flow
// left conversion_data for this batch to inherit; project_requested is what
// Batch 07 should read when it lands. See JKTL_CODEBASE_MAP.md.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const opp = await getOpportunity(id);
    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (opp.status !== "open") return NextResponse.json({ error: "This opportunity is already closed" }, { status: 400 });

    const b = await req.json();
    const outcome = b.outcome === "won" ? "won" : b.outcome === "lost" ? "lost" : null;
    if (!outcome) return NextResponse.json({ error: "Outcome must be 'won' or 'lost'" }, { status: 400 });
    if (!(b.reason || "").trim()) return NextResponse.json({ error: "Reason / notes is required" }, { status: 400 });
    if (outcome === "won" && (!b.actualValue || !b.wonDate)) {
      return NextResponse.json({ error: "Actual value and won date are required for a won opportunity" }, { status: 400 });
    }

    const stage = outcome === "won" ? "Closed Won" : "Closed Lost";
    const status = outcome === "won" ? "closed_won" : "closed_lost";
    const projectRequested = outcome === "won" && !!b.createProject;

    await sql`
      UPDATE opportunities
      SET stage = ${stage}, status = ${status}, close_reason = ${b.reason.trim()},
          actual_value = ${outcome === "won" ? Number(b.actualValue) : null},
          won_date = ${outcome === "won" ? b.wonDate : null},
          project_requested = ${projectRequested},
          closed_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `;
    await sql`
      INSERT INTO lead_activities (opportunity_id, type, title, body, actor_staff_id)
      VALUES (${id}, 'status_change', ${`Closed as ${outcome === "won" ? "Won" : "Lost"}`}, ${b.reason.trim()}, ${session.staffId || null})
    `;

    return NextResponse.json({ ok: true, stage, projectRequested });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
