/**
 * خروجی PDF برای صورت‌های مالی — با استفاده از jspdf
 * همه مبالغ ورودی به ریال، نمایش به تومان.
 */
import { rialToToman } from "./iran-tax";

const fa = (n: number) => n.toLocaleString("fa-IR");
const toman = (n: number) => fa(rialToToman(n)) + " تومان";

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function addHeader(doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>, title: string, subtitle: string) {
  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(subtitle, doc.internal.pageSize.width / 2, 28, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(14, 32, doc.internal.pageSize.width - 14, 32);
}

function addTable(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths?: number[],
) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  const tableWidth = pageWidth - margin * 2;
  const defaultColWidth = tableWidth / headers.length;
  const widths = colWidths ?? headers.map(() => defaultColWidth);
  const rowHeight = 8;

  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, startY, tableWidth, rowHeight, "F");
  doc.setFont("helvetica", "bold");
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + widths[i] / 2, startY + 5.5, { align: "center" });
    x += widths[i];
  });

  doc.setFont("helvetica", "normal");
  let y = startY + rowHeight;
  rows.forEach((row, ri) => {
    if (y > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 20;
    }
    if (ri % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }
    let rx = margin;
    row.forEach((cell, ci) => {
      doc.text(cell, rx + widths[ci] / 2, y + 5.5, { align: "center" });
      rx += widths[ci];
    });
    y += rowHeight;
  });

  return y + 4;
}

export async function exportBalanceSheetPDF(data: {
  asOf: string;
  assets: { code: string; name: string; balance: number }[];
  liabilities: { code: string; name: string; balance: number }[];
  equity: { code: string; name: string; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "ترازنامه", `تا تاریخ ${data.asOf}`);

  let y = 38;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("دارایی‌ها", 14, y);
  y += 6;
  y = addTable(doc,
    ["کد", "عنوان حساب", "مانده (تومان)"],
    [
      ...data.assets.map(a => [a.code, a.name, toman(a.balance)]),
      ["", "جمع دارایی‌ها", toman(data.totalAssets)],
    ],
    y, [20, 110, 56],
  );

  y += 4;
  doc.text("بدهی‌ها و حقوق صاحبان", 14, y);
  y += 6;
  y = addTable(doc,
    ["کد", "عنوان حساب", "مانده (تومان)"],
    [
      ...data.liabilities.map(l => [l.code, l.name, toman(l.balance)]),
      ...data.equity.map(e => [e.code, e.name, toman(e.balance)]),
      ["", "جمع بدهی‌ها و حقوق صاحبان", toman(data.totalLiabilities + data.totalEquity)],
    ],
    y, [20, 110, 56],
  );

  doc.save(`balance-sheet-${data.asOf}.pdf`);
}

export async function exportProfitLossPDF(data: {
  from: string;
  to: string;
  revenues: { code: string; name: string; amount: number }[];
  expenses: { code: string; name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "صورت سود و زیان", `از ${data.from} تا ${data.to}`);

  let y = 38;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("درآمدها", 14, y);
  y += 6;
  y = addTable(doc,
    ["کد", "عنوان", "مبلغ (تومان)"],
    [
      ...data.revenues.map(r => [r.code, r.name, toman(r.amount)]),
      ["", "جمع درآمدها", toman(data.totalRevenue)],
    ],
    y, [20, 110, 56],
  );

  y += 4;
  doc.text("هزینه‌ها", 14, y);
  y += 6;
  y = addTable(doc,
    ["کد", "عنوان", "مبلغ (تومان)"],
    [
      ...data.expenses.map(e => [e.code, e.name, toman(e.amount)]),
      ["", "جمع هزینه‌ها", toman(data.totalExpenses)],
    ],
    y, [20, 110, 56],
  );

  y += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const label = data.netIncome >= 0 ? "سود خالص دوره" : "زیان خالص دوره";
  doc.text(`${label}: ${toman(Math.abs(data.netIncome))}`, 14, y);

  doc.save(`profit-loss-${data.from}-${data.to}.pdf`);
}

export async function exportTrialBalancePDF(data: {
  from: string;
  to: string;
  rows: { code: string; name: string; debitTurnover: number; creditTurnover: number; debitBalance: number; creditBalance: number }[];
  totals: { debitTurnover: number; creditTurnover: number; debitBalance: number; creditBalance: number };
}) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  addHeader(doc, "تراز آزمایشی چهارستونی", `از ${data.from} تا ${data.to}`);

  const rows = [
    ...data.rows.map(r => [
      r.code, r.name,
      r.debitTurnover ? toman(r.debitTurnover) : "—",
      r.creditTurnover ? toman(r.creditTurnover) : "—",
      r.debitBalance ? toman(r.debitBalance) : "—",
      r.creditBalance ? toman(r.creditBalance) : "—",
    ]),
    ["", "جمع کل",
      toman(data.totals.debitTurnover), toman(data.totals.creditTurnover),
      toman(data.totals.debitBalance), toman(data.totals.creditBalance),
    ],
  ];

  addTable(doc,
    ["کد", "حساب", "گردش بدهکار", "گردش بستانکار", "مانده بدهکار", "مانده بستانکار"],
    rows, 38, [18, 60, 42, 42, 42, 42],
  );

  doc.save(`trial-balance-${data.from}-${data.to}.pdf`);
}

export async function exportAgedReceivablesPDF(data: {
  buckets: { current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number };
  totalOutstanding: number;
  byClient: { client: string; total: number; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number }[];
}) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  addHeader(doc, "گزارش سنی بدهکاران", `مجموع مطالبات: ${toman(data.totalOutstanding ?? 0)}`);

  addTable(doc,
    ["مشتری", "جاری", "۱-۳۰ روز", "۳۱-۶۰ روز", "۶۱-۹۰ روز", "+۹۰ روز", "جمع"],
    data.byClient.map(c => [
      c.client,
      c.current ? toman(c.current) : "—",
      c.d1_30 ? toman(c.d1_30) : "—",
      c.d31_60 ? toman(c.d31_60) : "—",
      c.d61_90 ? toman(c.d61_90) : "—",
      c.d90plus ? toman(c.d90plus) : "—",
      toman(c.total),
    ]),
    38, [40, 32, 32, 32, 32, 32, 38],
  );

  doc.save(`aged-receivables.pdf`);
}
