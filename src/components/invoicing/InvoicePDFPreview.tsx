"use client";

import { useRef } from "react";
import { X, Download } from "lucide-react";
import { motion } from "motion/react";
import type { Invoice, Client } from "@/types";
import { formatPrice, toJalali } from "@/lib/utils";

interface Props {
  invoice: Invoice;
  client: Client | undefined;
  onClose: () => void;
}

export function InvoicePDFPreview({ invoice, client, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!printRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاکتور-${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
  };

  const isPaid = invoice.status === "paid";
  const subtotal = invoice.subtotal;
  const discount = invoice.discount ?? 0;
  const taxAmount = invoice.taxAmount ?? 0;
  const total = invoice.total;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold">پیش‌نمایش فاکتور</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              دانلود PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          {/* The actual printable invoice */}
          <div
            ref={printRef}
            dir="rtl"
            style={{
              background: "#ffffff",
              color: "#1a1a2e",
              fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
              width: "210mm",
              minHeight: "297mm",
              margin: "0 auto",
              padding: "12mm 14mm",
              boxSizing: "border-box",
              fontSize: "11px",
            }}
          >
            {/* Header stripe */}
            <div style={{ background: "linear-gradient(135deg, #d4a843, #9b59b6)", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px", fontWeight: "900", color: "#000" }}>P</span>
                </div>
                <div style={{ color: "#000", fontWeight: "800", fontSize: "18px" }}>Persicore</div>
                <div style={{ color: "rgba(0,0,0,0.7)", fontSize: "11px" }}>آژانس دیجیتال پرسی‌کور</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#000", fontWeight: "800", fontSize: "22px" }}>
                  {invoice.type === "invoice" ? "فاکتور" : "پیش‌فاکتور"}
                </div>
                <div style={{ color: "rgba(0,0,0,0.8)", fontSize: "13px", fontWeight: "600" }}>{invoice.invoiceNumber}</div>
                {isPaid && (
                  <div style={{ marginTop: "6px", background: "rgba(0,0,0,0.15)", borderRadius: "20px", padding: "2px 10px", color: "#000", fontSize: "10px", fontWeight: "700", display: "inline-block" }}>
                    ✓ پرداخت شده
                  </div>
                )}
              </div>
            </div>

            {/* Client + Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#f8f9ff", borderRadius: "10px", padding: "14px 16px", borderRight: "3px solid #d4a843" }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>مشتری</div>
                <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "4px" }}>{client?.companyName ?? "—"}</div>
                <div style={{ color: "#555", fontSize: "11px", marginBottom: "2px" }}>{client?.contactName}</div>
                {client?.contactEmail && <div style={{ color: "#888", fontSize: "10px", direction: "ltr", textAlign: "right" }}>{client.contactEmail}</div>}
                {client?.contactPhone && <div style={{ color: "#888", fontSize: "10px" }}>{client.contactPhone}</div>}
              </div>
              <div style={{ background: "#f8f9ff", borderRadius: "10px", padding: "14px 16px", borderRight: "3px solid #9b59b6" }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>تاریخ‌ها</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#555" }}>تاریخ صدور:</span>
                  <span style={{ fontWeight: "600" }}>{toJalali(invoice.issuedAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#555" }}>سررسید:</span>
                  <span style={{ fontWeight: "600", color: invoice.status === "overdue" ? "#e74c3c" : "#1a1a2e" }}>{toJalali(invoice.dueDate)}</span>
                </div>
                {invoice.paidAt && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#555" }}>پرداخت شده:</span>
                    <span style={{ fontWeight: "600", color: "#27ae60" }}>{toJalali(invoice.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #1a1a2e, #2d2d44)", color: "#fff" }}>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600", borderRadius: "8px 0 0 0" }}>#</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600" }}>شرح خدمت</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: "600" }}>تعداد</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600" }}>قیمت واحد</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600", borderRadius: "0 8px 0 0" }}>جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8f9ff" }}>
                      <td style={{ padding: "10px 12px", color: "#888", fontWeight: "600" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "500" }}>{item.description}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#555" }}>{item.quantity}</td>
                      <td style={{ padding: "10px 12px", color: "#555", direction: "ltr", textAlign: "right" }}>{formatPrice(item.unitPrice, true)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700", direction: "ltr", textAlign: "right" }}>{formatPrice(item.total, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
              <div style={{ width: "260px", background: "#f8f9ff", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px" }}>
                  <span style={{ color: "#555" }}>جمع کل:</span>
                  <span style={{ direction: "ltr" }}>{formatPrice(subtotal, true)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px" }}>
                    <span style={{ color: "#555" }}>تخفیف:</span>
                    <span style={{ color: "#27ae60", direction: "ltr" }}>- {formatPrice(discount, true)}</span>
                  </div>
                )}
                {invoice.taxRate > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px" }}>
                    <span style={{ color: "#555" }}>مالیات ({invoice.taxRate}٪):</span>
                    <span style={{ direction: "ltr" }}>{formatPrice(taxAmount, true)}</span>
                  </div>
                )}
                <div style={{ borderTop: "2px solid #d4a843", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px" }}>مبلغ قابل پرداخت:</span>
                  <span style={{ fontWeight: "800", fontSize: "16px", color: "#d4a843", direction: "ltr" }}>{formatPrice(total, true)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ background: "#fffbf0", border: "1px solid #f0d080", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px", fontSize: "11px" }}>
                <div style={{ fontWeight: "700", color: "#b8860b", marginBottom: "4px" }}>یادداشت:</div>
                <div style={{ color: "#555", lineHeight: "1.6" }}>{invoice.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "10px", color: "#aaa" }}>با تشکر از همکاری شما</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "20px", height: "20px", background: "linear-gradient(135deg, #d4a843, #9b59b6)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "#000" }}>P</span>
                </div>
                <span style={{ fontSize: "10px", color: "#888" }}>Persicore CRM</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
