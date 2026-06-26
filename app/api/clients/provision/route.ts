import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Owner triggers provisioning for an organisation. Proxies to the SchoolDesk
// admin provisioner, keeping PROVISION_SECRET server-side.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ADMIN = process.env.SCHOOLDESK_ADMIN_URL;
  const SECRET = process.env.PROVISION_SECRET;
  if (!ADMIN || !SECRET) {
    return NextResponse.json({ error: "SCHOOLDESK_ADMIN_URL / PROVISION_SECRET not configured" }, { status: 503 });
  }

  let orgId: string | undefined;
  try { orgId = (await req.json())?.orgId; } catch { /* ignore */ }
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  try {
    const r = await fetch(`${ADMIN}/api/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-provision-secret": SECRET },
      body: JSON.stringify({ orgId }),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
