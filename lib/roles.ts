// Single source of truth for staff roles and what each can access.
// Pure data + helpers (no Node/Edge-specific imports) so it can be used from
// the edge proxy, client components, and API routes alike.

export type RoleId = "owner" | "bdr" | "hiring" | "content" | "support";

export interface RoleDef {
  id: RoleId;
  label: string;
  desc: string;
  // Allowed path prefixes (pages AND their APIs). Owner is unrestricted.
  paths: string[];
}

export const ROLES: RoleDef[] = [
  {
    id: "owner",
    label: "Owner — full access",
    desc: "Everything in the Command Center, including clients, billing and affiliates.",
    paths: [],
  },
  {
    id: "bdr",
    label: "Business Dev / Sales",
    desc: "Inquiries plus their own tasks & targets.",
    paths: ["/dashboard/inquiries", "/api/inquiries"],
  },
  {
    id: "hiring",
    label: "Hiring / Recruitment",
    desc: "Job posts and applicants.",
    paths: ["/dashboard/jobs", "/api/jobs", "/api/applications"],
  },
  {
    id: "content",
    label: "Content / Marketing",
    desc: "Blog, case studies, videos and testimonials.",
    paths: [
      "/dashboard/blog", "/api/blog", "/api/posts",
      "/dashboard/case-studies", "/api/case-studies",
      "/dashboard/videos", "/api/watch-videos",
      "/dashboard/testimonials", "/api/testimonials",
    ],
  },
  {
    id: "support",
    label: "Customer Support",
    desc: "Inquiries only.",
    paths: ["/dashboard/inquiries", "/api/inquiries"],
  },
];

// Every signed-in non-owner staff member also gets these.
const COMMON_PREFIXES = ["/dashboard/my-work", "/api/auth", "/api/me", "/api/tasks", "/api/targets"];

export const ROLE_IDS = ROLES.map((r) => r.id);

export function roleDef(role?: string | null): RoleDef | undefined {
  return ROLES.find((r) => r.id === role);
}

export function roleLabel(role?: string | null): string {
  return roleDef(role)?.label || role || "—";
}

export function isValidRole(role?: string | null): boolean {
  return !!roleDef(role);
}

function prefixMatch(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + "/");
}

// Owner: everything. Others: dashboard home + common + their role's paths.
export function roleAllowsPath(role: string | null | undefined, path: string): boolean {
  if (role === "owner") return true;
  if (path === "/dashboard") return true;
  const def = roleDef(role);
  if (!def) return false;
  return [...COMMON_PREFIXES, ...def.paths].some((p) => prefixMatch(path, p));
}
