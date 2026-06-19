import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize, resolve } from "path";
import { requireAuth } from "@/lib/auth";
import { requirePortalAuth } from "@/lib/portal-auth";

const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // بررسی auth — یا CRM یا Portal
  const crmAuth = requireAuth(req);
  const portalAuth = requirePortalAuth(req);
  if (!crmAuth && !portalAuth) {
    return NextResponse.json({ error: "احراز هویت الزامی است" }, { status: 401 });
  }

  const { path: pathParts } = await params;
  const relativePath = pathParts.join("/");

  // جلوگیری از path traversal
  const fullPath = resolve(join(UPLOAD_DIR, relativePath));
  if (!fullPath.startsWith(resolve(UPLOAD_DIR))) {
    return NextResponse.json({ error: "مسیر نامعتبر" }, { status: 400 });
  }

  try {
    const buffer = await readFile(fullPath);
    const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain", zip: "application/zip",
    };
    const contentType = contentTypes[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
  }
}
