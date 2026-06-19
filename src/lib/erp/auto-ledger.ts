import prisma from "@/lib/db";

// Standard account codes used for auto-generated entries
const STD_ACCOUNTS = {
  cash:       { code: "1001", name: "Cash / Bank",       nameFa: "نقد و بانک",             type: "asset" },
  receivable: { code: "1100", name: "Accounts Receivable", nameFa: "حسابهای دریافتنی",     type: "asset" },
  revenue:    { code: "4001", name: "Sales Revenue",      nameFa: "درآمد فروش",             type: "revenue" },
  expense:    { code: "5001", name: "General Expenses",   nameFa: "هزینه‌های عمومی",        type: "expense" },
} as const;

type AccountKey = keyof typeof STD_ACCOUNTS;

async function ensureAccount(key: AccountKey): Promise<string> {
  const def = STD_ACCOUNTS[key];
  const acc = await prisma.chartOfAccount.upsert({
    where: { code: def.code },
    create: { code: def.code, name: def.name, nameFa: def.nameFa, type: def.type },
    update: {},
  });
  return acc.id;
}

export async function createInvoiceCreatedEntry(opts: {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  createdById: string;
  date?: Date;
}) {
  const [receivableId, revenueId] = await Promise.all([
    ensureAccount("receivable"),
    ensureAccount("revenue"),
  ]);

  await prisma.ledgerEntry.create({
    data: {
      date: opts.date ?? new Date(),
      description: `صدور فاکتور ${opts.invoiceNumber}`,
      debitAccountId: receivableId,
      creditAccountId: revenueId,
      amount: opts.amount,
      reference: opts.invoiceNumber,
      entityType: "invoice",
      entityId: opts.invoiceId,
      createdById: opts.createdById,
    },
  });
}

export async function createInvoicePaidEntry(opts: {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  createdById: string;
  date?: Date;
}) {
  const [cashId, receivableId] = await Promise.all([
    ensureAccount("cash"),
    ensureAccount("receivable"),
  ]);

  await prisma.ledgerEntry.create({
    data: {
      date: opts.date ?? new Date(),
      description: `دریافت وجه فاکتور ${opts.invoiceNumber}`,
      debitAccountId: cashId,
      creditAccountId: receivableId,
      amount: opts.amount,
      reference: opts.invoiceNumber,
      entityType: "invoice",
      entityId: opts.invoiceId,
      createdById: opts.createdById,
    },
  });
}

export async function createExpenseApprovedEntry(opts: {
  expenseId: string;
  title: string;
  amount: number;
  createdById: string;
  date?: Date;
}) {
  const [expenseId, cashId] = await Promise.all([
    ensureAccount("expense"),
    ensureAccount("cash"),
  ]);

  await prisma.ledgerEntry.create({
    data: {
      date: opts.date ?? new Date(),
      description: `هزینه تأییدشده: ${opts.title}`,
      debitAccountId: expenseId,
      creditAccountId: cashId,
      amount: opts.amount,
      reference: `EXP-${opts.expenseId.slice(-6).toUpperCase()}`,
      entityType: "expense",
      entityId: opts.expenseId,
      createdById: opts.createdById,
    },
  });
}
