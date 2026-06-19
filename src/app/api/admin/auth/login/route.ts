import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { badRequest, serverError } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_TOKEN_EXPIRES = "30d";

function safeCompare(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ab.length !== bb.length) {
      // Still run timingSafeEqual to avoid timing leaks on length
      timingSafeEqual(ab, ab);
      return false;
    }
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) return badRequest("شماره و رمز الزامی است");

    const adminPhone = process.env.SUPER_ADMIN_PHONE ?? "";
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "";

    const phoneOk = safeCompare(phone.trim(), adminPhone);
    const passOk = safeCompare(password, adminPassword);

    if (!phoneOk || !passOk) {
      return Response.json({ error: "شماره یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: "superadmin", phone: adminPhone, role: "admin", isSuperAdmin: true },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRES }
    );

    const res = Response.json({
      data: {
        token,
        user: { id: "superadmin", phone: adminPhone, role: "admin", name: "Super Admin" },
      },
    });

    return res;
  } catch (e) {
    return serverError(e);
  }
}
