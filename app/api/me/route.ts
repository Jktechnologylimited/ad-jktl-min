import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email: s.email, role: s.role, name: s.name || null, staffId: s.staffId || null });
}
