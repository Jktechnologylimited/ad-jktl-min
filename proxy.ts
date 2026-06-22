import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "jktl-admin-dev-secret";
const secret = new TextEncoder().encode(JWT_SECRET);

// Paths a non-owner (BDR / sales rep / marketer) may reach. Everything else
// under /dashboard or /api is owner-only. Deny-by-default keeps sensitive data safe.
const BDR_PAGE_PREFIXES = ["/dashboard/inquiries", "/dashboard/my-work"];
const BDR_API_PREFIXES = ["/api/auth", "/api/inquiries", "/api/tasks", "/api/targets", "/api/me"];

function bdrAllowed(path: string): boolean {
  if (path === "/dashboard") return true;
  if (path.startsWith("/api")) return BDR_API_PREFIXES.some((p) => path.startsWith(p));
  return BDR_PAGE_PREFIXES.some((p) => path.startsWith(p));
}

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

  // Owner: full access. Non-owner: allowlist only.
  if (role !== "owner" && !bdrAllowed(pathname)) {
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
