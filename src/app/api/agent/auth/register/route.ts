import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET!;

const schema = z.object({
  name: z.string().min(2),
  identifier: z.string().min(3),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    const { name, identifier, password } = parsed.data;
    const isEmail = identifier.includes("@");

    const existing = await prisma.agentUser.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });
    if (existing) return badRequest("این حساب کاربری قبلاً ثبت شده است");

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.agentUser.create({
      data: {
        name,
        email: isEmail ? identifier : null,
        phone: !isEmail ? identifier : null,
        passwordHash,
        plan: "FREE",
      },
    });

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
