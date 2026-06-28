import { randomInt } from "crypto";

const PAYAMSMS_URL = "https://www.payamsms.com/services/v2/index.php";

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

async function payamsmsSend(phone: string, message: string): Promise<boolean> {
  const org = process.env.PAYAMSMS_ORGANIZATION;
  const username = process.env.PAYAMSMS_USERNAME;
  const password = process.env.PAYAMSMS_PASSWORD;
  const srcNumber = process.env.PAYAMSMS_LINE_NUMBER;

  if (!org || !username || !password || !srcNumber) {
    return false;
  }

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:SMSAPIwsdl">
  <SOAP-ENV:Body>
    <ns1:Send>
      <organization>${org}</organization>
      <username>${username}</username>
      <password>${password}</password>
      <srcNumber>${srcNumber}</srcNumber>
      <body>${message}</body>
      <destNo><item>${phone}</item></destNo>
    </ns1:Send>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  const res = await fetch(PAYAMSMS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=UTF-8",
      "SOAPAction": "urn:SMSAPIwsdl#Send",
    },
    body: soapBody,
  });

  const text = await res.text();
  // PayamSMS returns <ID xsi:type="xsd:string">123456</ID> on success
  const idMatch = text.match(/<ID[^>]*>(\d+)<\/ID>/);
  if (idMatch && parseInt(idMatch[1]) > 0) return true;
  console.error("[SMS] PayamSMS response:", text.slice(0, 300));
  return false;
}

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const org = process.env.PAYAMSMS_ORGANIZATION;
  const username = process.env.PAYAMSMS_USERNAME;
  const password = process.env.PAYAMSMS_PASSWORD;

  if (!org || !username || !password) {
    console.log(`\n[SMS DEV] ──────────────────────`);
    console.log(`[SMS DEV] Phone : ${phone}`);
    console.log(`[SMS DEV] OTP   : ${code}`);
    console.log(`[SMS DEV] ──────────────────────\n`);
    return true;
  }

  try {
    const message = `کد تایید پرسیکور: ${code}\nاین کد ۲ دقیقه معتبر است.`;
    const ok = await payamsmsSend(phone, message);
    if (!ok) console.error("[SMS] OTP send failed for", phone);
    return ok;
  } catch (err) {
    console.error("[SMS] Network error:", err);
    return false;
  }
}

export async function sendContractSms(phone: string, personName: string): Promise<boolean> {
  const org = process.env.PAYAMSMS_ORGANIZATION;
  const username = process.env.PAYAMSMS_USERNAME;
  const password = process.env.PAYAMSMS_PASSWORD;

  if (!org || !username || !password) {
    console.log(`\n[SMS DEV] ──────────────────────`);
    console.log(`[SMS DEV] Phone      : ${phone}`);
    console.log(`[SMS DEV] PersonName : ${personName}`);
    console.log(`[SMS DEV] ──────────────────────\n`);
    return true;
  }

  try {
    const message = `${personName} عزیز، قرارداد شما آماده امضا است. لطفاً وارد پنل پرسیکور شوید.`;
    return await payamsmsSend(phone, message);
  } catch (err) {
    console.error("[SMS] Contract SMS error:", err);
    return false;
  }
}
