import { v2 as cloudinary } from "cloudinary";

// Mirrors schooldesk-admin's lib/cloudinary.ts exactly (same env var names,
// same pattern) -- consistency with the established real integration in this
// app family, rather than inventing a different upload flow. Requires
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and
// CLOUDINARY_API_SECRET to be added to jktl-admin's environment.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function cloudinaryConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function uploadToCloudinary(file: File, folder = "jktl-admin/projects"): Promise<{ url: string; bytes: number }> {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: "auto" });
  return { url: result.secure_url, bytes: result.bytes };
}
