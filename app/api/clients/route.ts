import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllOrgs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ orgs: [] });

  const status = req.nextUrl.searchParams.get("status") || "all";
  try {
    const orgs = await getAllOrgs(status);
    return NextResponse.json({ orgs });
  } catch (err) {
    return NextResponse.json({ orgs: [], error: String(err) });
  }
}
