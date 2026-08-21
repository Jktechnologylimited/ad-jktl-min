import { NextRequest, NextResponse } from "next/server";
import { signToken, checkPassword, COOKIE_NAME } from "@/lib/auth";
import { isValidRole } from "@/lib/roles";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, remember } = await req.json();
    const adminEmail = process.env.ADMIN_EMAIL || "info@jktl.com.ng";
    const cleanEmail = String(email || "").trim().toLowerCase();

    // 1) Owner login (env-based)
    if (cleanEmail === adminEmail.toLowerCase()) {
      const valid = await checkPassword(password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      const token = signToken({ email: adminEmail, role: "owner", name: "Owner" });
      return setCookie(token, remember);
    }

    // 2) Staff login (DB-based)
    if (sql) {
      const rows = await sql`SELECT id, name, email, password_hash, role, active FROM staff WHERE email = ${cleanEmail} LIMIT 1`;
      const staff = rows[0];
      if (staff && staff.active && staff.password_hash) {
        const ok = await bcrypt.compare(String(password || ""), staff.password_hash);
        if (ok) {
          const role = isValidRole(staff.role) ? staff.role : "bdr";
          const token = signToken({ email: staff.email, role, name: staff.name, staffId: staff.id });
          return setCookie(token, remember);
        }
      }
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// "Remember me" checked (or omitted, matching prior behavior) => 7 days.
// Unchecked => session-length cookie (cleared when the browser closes).
function setCookie(token: string, remember?: boolean) {
  const res = NextResponse.json({ ok: true });
  const opts: Parameters<typeof res.cookies.set>[2] = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  if (remember === false) {
    res.cookies.set(COOKIE_NAME, token, opts);
  } else {
    res.cookies.set(COOKIE_NAME, token, { ...opts, maxAge: 60 * 60 * 24 * 7 });
  }
  return res;
}
