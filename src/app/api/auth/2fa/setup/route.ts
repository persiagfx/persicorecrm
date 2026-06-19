import { NextRequest } from "next/server";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;

    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Persicore CRM";
    const totp = new OTPAuth.TOTP({
      issuer: appName,
      label: payload.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const otpAuthUrl = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(otpAuthUrl);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { totpSecret: secretBase32, totpEnabled: false },
    });

    return ok({ qrDataUrl, secret: secretBase32, otpAuthUrl });
  } catch (e) {
    return serverError(e);
  }
}
