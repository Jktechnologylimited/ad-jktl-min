import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadToCloudinary, cloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ files: [] });
  const { id } = await params;
  const category = req.nextUrl.searchParams.get("category");
  const files = category
    ? await sql`SELECT f.*, s.name AS uploaded_by_name FROM project_files f LEFT JOIN staff s ON s.id = f.uploaded_by_staff_id WHERE f.project_id = ${id} AND f.category = ${category} ORDER BY f.created_at DESC`
    : await sql`SELECT f.*, s.name AS uploaded_by_name FROM project_files f LEFT JOIN staff s ON s.id = f.uploaded_by_staff_id WHERE f.project_id = ${id} ORDER BY f.created_at DESC`;
  return NextResponse.json({ files });
}

// POST /api/projects/[id]/files -- real upload via Cloudinary (multipart
// form). Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and
// CLOUDINARY_API_SECRET to be set -- see lib/cloudinary.ts.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "File storage isn't configured yet. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the environment." }, { status: 503 });
  }
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "other";
    const designType = (formData.get("designType") as string) || null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const { url, bytes } = await uploadToCloudinary(file, `jktl-admin/projects/${id}`);
    const fileType = file.name.includes(".") ? file.name.split(".").pop()!.toUpperCase() : "";

    const rows = await sql`
      INSERT INTO project_files (project_id, name, category, design_type, file_type, file_url, size_bytes, uploaded_by_staff_id)
      VALUES (${id}, ${file.name}, ${category}, ${designType}, ${fileType}, ${url}, ${bytes}, ${session.staffId || null})
      RETURNING id
    `;
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'upload', ${`File "${file.name}" uploaded`}, ${session.staffId || null})`;

    return NextResponse.json({ ok: true, id: rows[0].id, url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
