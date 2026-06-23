import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ALL_KPI_KEYS } from "@/lib/kpis";

export const dynamic = "force-dynamic";

const intOr0 = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

// GET /api/kpis?staffId=&days=28  -> entries (owner can pass staffId; staff gets own)
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ entries: [] });

  const days = Math.min(120, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 28));
  const targetId = s.role === "owner" ? (req.nextUrl.searchParams.get("staffId") || null) : s.staffId;
  if (!targetId) return NextResponse.json({ entries: [] });

  try {
    const entries = await sql`
      SELECT * FROM kpi_entries
      WHERE staff_id = ${targetId} AND entry_date >= CURRENT_DATE - ${days}::int
      ORDER BY entry_date DESC`;
    return NextResponse.json({ entries });
  } catch (err) {
    return NextResponse.json({ error: String(err), entries: [] }, { status: 500 });
  }
}

// POST /api/kpis { date, <metric keys...> } -> the signed-in staff upserts their own entry.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!s.staffId) return NextResponse.json({ error: "Only staff log KPIs" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const b = await req.json();
    const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : null;
    if (!date) return NextResponse.json({ error: "Valid date required" }, { status: 400 });

    // Build column list + values dynamically over all known metric keys.
    const cols = ALL_KPI_KEYS.filter((k) => /^[a-z_]+$/.test(k)); // safety: identifier whitelist
    const v: Record<string, number> = {};
    for (const c of cols) v[c] = intOr0(b[c]);

    const setList = cols.map((c) => `${c} = ${v[c]}`).join(", ");
    const colList = cols.join(", ");
    const valList = cols.map((c) => v[c]).join(", ");

    await sql.query(
      `INSERT INTO kpi_entries (staff_id, entry_date, ${colList})
       VALUES ($1, $2, ${valList})
       ON CONFLICT (staff_id, entry_date) DO UPDATE SET ${setList}, updated_at = NOW()`,
      [s.staffId, date]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
