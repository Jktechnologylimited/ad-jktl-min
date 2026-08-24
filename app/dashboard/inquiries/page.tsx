import { redirect } from "next/navigation";

// Batch 03 (CRM -- Leads) supersedes this simple inbox with a full lead
// lifecycle at /dashboard/leads. Redirecting rather than deleting keeps any
// existing bookmarks/links working -- see JKTL_CODEBASE_MAP.md.
export default function InquiriesRedirect() {
  redirect("/dashboard/leads/all");
}
