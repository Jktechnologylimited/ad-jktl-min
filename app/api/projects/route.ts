import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listProjects, generateProjectNumber } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ projects: [], total: 0, page: 1, pageSize: 10 });

  const p = req.nextUrl.searchParams;
  try {
    const result = await listProjects({
      status: p.get("status") || undefined,
      type: p.get("type") || undefined,
      customerId: p.get("customerId") || undefined,
      managerId: p.get("managerId") || undefined,
      name: p.get("name") || undefined,
      page: Number(p.get("page")) || 1,
      pageSize: Number(p.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err), projects: [], total: 0 }, { status: 500 });
  }
}

// POST /api/projects -- can be created standalone, or from an opportunity
// (project_requested flag set at close, Batch 04), a proposal (Sheet 9's
// "Create Project" next step, Batch 05), or a customer's Quick Actions
// (Batch 06) -- all pre-fill via opportunityId/proposalId/customerId and
// inherit project_value from the linked proposal/opportunity when present.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Project name is required" }, { status: 400 });

    const projectNumber = await generateProjectNumber();
    const rows = await sql`
      INSERT INTO projects
        (project_number, name, customer_id, opportunity_id, proposal_id, type, start_date, due_date,
         project_manager_staff_id, description, project_value, currency)
      VALUES
        (${projectNumber}, ${name}, ${b.customerId || null}, ${b.opportunityId || null}, ${b.proposalId || null},
         ${b.type || "website"}, ${b.startDate || null}, ${b.dueDate || null}, ${b.projectManagerStaffId || session.staffId || null},
         ${b.description || null}, ${Number(b.projectValue) || 0}, ${b.currency || "NGN"})
      RETURNING id, project_number
    `;
    const projectId = rows[0].id;

    if (b.projectManagerStaffId) {
      await sql`INSERT INTO project_team_members (project_id, staff_id, project_role) VALUES (${projectId}, ${b.projectManagerStaffId}, 'Project Manager') ON CONFLICT DO NOTHING`;
    }
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${projectId}, 'created', 'Project created', ${session.staffId || null})`;

    // Opportunity->Project: clears project_requested now that the real
    // project exists, so the prompt doesn't keep resurfacing.
    if (b.opportunityId) {
      await sql`UPDATE opportunities SET project_requested = false WHERE id = ${b.opportunityId}`;
    }

    return NextResponse.json({ ok: true, id: projectId, projectNumber: rows[0].project_number });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
