import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET!;

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    const { identifier, password } = parsed.data;
    const isEmail = identifier.includes("@");

    const user = await prisma.agentUser.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
      include: { subscription: true },
    });

    if (!user || !user.passwordHash) return badRequest("اطلاعات ورود اشتباه است");
    if (!user.isActive) return badRequest("حساب کاربری غیرفعال است");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return badRequest("اطلاعات ورود اشتباه است");

    const token = jwt.sign(
      { userId: user.id, role: "agent_user", isAgentUser: true, plan: user.plan },
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
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
