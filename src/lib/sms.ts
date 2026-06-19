import { randomInt } from "crypto";

const SMS_URL = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.length === 10 && digits.startsWith("9")) return "0" + digits;
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^09[0-9]{9}$/.test(normalizePhone(phone));
}

export async function sendContractSms(phone: string, personName: string): Promise<boolean> {
  const username = process.env.MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD;
  const bodyId = process.env.MELIPAYAMAK_CONTRACT_BODY_ID;

  if (!username || !password || !bodyId) {
    console.log(`\n[SMS DEV] ──────────────────────`);
    console.log(`[SMS DEV] Phone      : ${phone}`);
    console.log(`[SMS DEV] PersonName : ${personName}`);
    console.log(`[SMS DEV] ──────────────────────\n`);
    return true;
  }

  try {
    const res = await fetch(SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, text: personName, to: phone, bodyId: Number(bodyId) }),
    });
    const data = await res.json() as { Value: string; RetStatus: number; StrRetStatus: string };
    if (data.RetStatus === 1) return true;
    console.error("[SMS] Contract SMS failed — code:", data.Value, "status:", data.StrRetStatus);
    return false;
  } catch (err) {
    console.error("[SMS] Contract SMS network error:", err);
    return false;
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const username = process.env.MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD;
  const bodyId = process.env.MELIPAYAMAK_BODY_ID;

  if (!username || !password || !bodyId) {
    console.log(`\n[SMS DEV] ──────────────────────`);
    console.log(`[SMS DEV] Phone : ${phone}`);
    console.log(`[SMS DEV] OTP   : ${code}`);
    console.log(`[SMS DEV] ──────────────────────\n`);
    return true;
  }

  try {
    const res = await fetch(SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        text: code,
        to: phone,
        bodyId: Number(bodyId),
      }),
    });

    const data = await res.json() as { Value: string; RetStatus: number; StrRetStatus: string };

    if (data.RetStatus === 1) return true;
    console.error("[SMS] Send failed — code:", data.Value, "status:", data.StrRetStatus);
    return false;
  } catch (err) {
    console.error("[SMS] Network error:", err);
    return false;
  }
}
