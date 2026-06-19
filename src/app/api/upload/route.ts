import { NextRequest } from "next/server";
import { extname } from "path";
import { randomBytes } from "crypto";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "application/zip",
];

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("فایل الزامی است");
    if (file.size > MAX_SIZE) return badRequest("حجم فایل بیش از ۲۰ مگابایت است");
    if (!ALLOWED_TYPES.includes(file.type)) return badRequest("نوع فایل مجاز نیست");

    const ext = extname(file.name) || ".bin";
    const filename = `${randomBytes(16).toString("hex")}${ext}`;
    const subfolder = new Date().toISOString().slice(0, 7);
    const key = `${subfolder}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, key, file.type);

    const projectId = formData.get("projectId") as string | null;
    const folderId = formData.get("folderId") as string | null;

    const fileItem = await prisma.fileItem.create({
      data: {
        name: file.name,
        type: file.type,
        size: file.size,
        url,
        projectId: projectId ?? undefined,
        folderId: folderId ?? undefined,
        uploadedById: payload.userId,
      },
    });

    return ok(fileItem);
  } catch (e) {
    return serverError(e);
  }
}
