import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { roleAllowsPath } from "@/lib/roles";

const JWT_SECRET = process.env.JWT_SECRET || "jktl-admin-dev-secret";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Public routes always reachable
  if (pathname === "/login" || pathname === "/api/auth/login") return NextResponse.next();

  const token = req.cookies.get("jktl_admin_token")?.value;
  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      role = (payload.role as string) || null;
    } catch {
      role = null;
    }
  }

  // Not authenticated
  if (!role) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated but role not allowed on this path -> deny by default
  if (!roleAllowsPath(role, pathname)) {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
