import { NextRequest, NextResponse } from "next/server";
import { signToken, checkPassword, COOKIE_NAME } from "@/lib/auth";
import { isValidRole } from "@/lib/roles";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const adminEmail = process.env.ADMIN_EMAIL || "info@jktl.com.ng";
    const cleanEmail = String(email || "").trim().toLowerCase();

    // 1) Owner login (env-based)
    if (cleanEmail === adminEmail.toLowerCase()) {
      const valid = await checkPassword(password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      const token = signToken({ email: adminEmail, role: "owner", name: "Owner" });
      return setCookie(token);
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
          return setCookie(token);
        }
      }
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function setCookie(token: string) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
