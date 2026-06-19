import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const record = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
      },
    });
    if (!record) return notFound();

    const grossPay = record.baseSalary + (record.bonus ?? 0) + ((record as any).overtimePay ?? 0)
      + ((record as any).travelAllowance ?? 0) + ((record as any).housingAllowance ?? 0);
    const totalDeductions = (record.deductions ?? 0) + ((record as any).taxAmount ?? 0)
      + ((record as any).insuranceDeduction ?? 0) + ((record as any).loanDeduction ?? 0);

    return ok({
      id: record.id,
      period: record.period,
      status: record.status,
      paidAt: record.paidAt,
      employee: record.user,
      earnings: {
        baseSalary: record.baseSalary,
        bonus: record.bonus ?? 0,
        overtimePay: (record as any).overtimePay ?? 0,
        travelAllowance: (record as any).travelAllowance ?? 0,
        housingAllowance: (record as any).housingAllowance ?? 0,
        grossPay,
      },
      deductions: {
        general: record.deductions ?? 0,
        taxAmount: (record as any).taxAmount ?? 0,
        insuranceDeduction: (record as any).insuranceDeduction ?? 0,
        loanDeduction: (record as any).loanDeduction ?? 0,
        totalDeductions,
      },
      attendance: {
        workingDays: (record as any).workingDays ?? 0,
        presentDays: (record as any).presentDays ?? 0,
        leaveDays: (record as any).leaveDays ?? 0,
        overtimeHours: (record as any).overtimeHours ?? 0,
      },
      netPay: record.netPay,
      notes: record.notes,
    });
  } catch (e) { return serverError(e); }
}
