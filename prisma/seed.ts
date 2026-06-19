import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Default company settings (placeholder — update via admin panel after deploy)
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "شرکت شما",
      invoiceColor: "#8B5CF6",
    },
  });

  // Default service catalog items
  const services = [
    { code: "WD-001", name: "طراحی وبسایت", category: "design", defaultPrice: 5_000_000, unit: "project" },
    { code: "WD-002", name: "توسعه بک‌اند", category: "development", defaultPrice: 800_000, unit: "hour" },
    { code: "MK-001", name: "مدیریت شبکه اجتماعی", category: "marketing", defaultPrice: 3_000_000, unit: "month" },
    { code: "SP-001", name: "پشتیبانی ماهانه", category: "support", defaultPrice: 1_500_000, unit: "month" },
    { code: "CN-001", name: "مشاوره", category: "consulting", defaultPrice: 500_000, unit: "hour" },
  ];

  for (const s of services) {
    await prisma.serviceItem.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, taxRate: 9, isActive: true },
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
