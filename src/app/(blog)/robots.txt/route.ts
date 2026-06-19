import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://blog.persicore.ir";

export async function GET() {
  const robots = `# Persicore Blog — robots.txt
User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow admin and API routes
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /portal/

# Allow Googlebot specifically
User-agent: Googlebot
Allow: /blog/
Allow: /sitemap.xml
`;

  return new NextResponse(robots, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
