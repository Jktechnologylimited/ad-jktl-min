import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "jktl-admin-dev-secret";
export const COOKIE_NAME = "jktl_admin_token";

export type Role = import("./roles").RoleId;

export interface AdminSession {
  email: string;
  role: Role;
  name?: string;
  staffId?: string;
}

// Roles allowed to see sensitive business data (clients, billing, affiliates, etc.)
export function isOwner(session: AdminSession | null): boolean {
  return session?.role === "owner";
}

export function signToken(payload: AdminSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AdminSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function checkPassword(plain: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // Fallback: plain password comparison (dev only)
    return plain === process.env.ADMIN_PASSWORD;
  }
  return bcrypt.compare(plain, hash);
}

// For API routes: returns the session if owner, else null (caller returns 403).
export async function requireOwnerSession(): Promise<AdminSession | null> {
  const s = await getSession();
  return s && s.role === "owner" ? s : null;
}
