import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { STAGES } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

// GET /api/opportunities/board -- Sheet 4 (Kanban). Returns each stage's
// full totals plus a capped preview of cards (the wireframe itself shows
// "+N more" rather than every card) -- avoids loading potentially hundreds
// of rows into the browser at once.
const PREVIEW_PER_COLUMN = 6;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ columns: [] });

  try {
    const columns = await Promise.all(STAGES.map(async stage => {
      const [totals, cards] = await Promise.all([
        sql`SELECT COUNT(*) AS count, COALESCE(SUM(estimated_value), 0) AS value FROM opportunities WHERE stage = ${stage}`,
        sql`SELECT id, name, customer_name, estimated_value FROM opportunities WHERE stage = ${stage} ORDER BY created_at DESC LIMIT ${PREVIEW_PER_COLUMN}`,
      ]);
      const count = Number(totals[0]?.count || 0);
      return { stage, count, value: Number(totals[0]?.value || 0), cards, moreCount: Math.max(0, count - cards.length) };
    }));
    return NextResponse.json({ columns });
  } catch (err) {
    return NextResponse.json({ error: String(err), columns: [] }, { status: 500 });
  }
}
