import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET!;

const schema = z.object({
  name: z.string().min(2),
  identifier: z.string().min(5), // email or phone
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    const { name, identifier, password } = parsed.data;
    const isEmail = identifier.includes("@");

    const existing = await prisma.contentUser.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });
    if (existing) return badRequest(isEmail ? "این ایمیل قبلاً ثبت شده" : "این شماره قبلاً ثبت شده");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.contentUser.create({
      data: {
        name,
        email: isEmail ? identifier : null,
        phone: isEmail ? null : identifier,
        passwordHash,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: "content_user", isContentUser: true, plan: user.plan },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return ok({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan,
        usedThisMonth: user.usedThisMonth,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
