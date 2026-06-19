"use client";

export interface ContractPdfData {
  title: string;
  clientName: string;
  content: string;
  adminSignatureDataUrl?: string | null;
  clientSignatureDataUrl?: string | null;
  signedAt?: string | null;
  adminSignedAt?: string | null;
  signedIp?: string | null;
}

export async function downloadContractPdf(data: ContractPdfData): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  // Build a hidden printable div
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 794px; padding: 60px;
    background: #ffffff; color: #111111;
    font-family: 'Vazirmatn', 'Tahoma', Arial, sans-serif;
    direction: rtl; text-align: right; line-height: 1.8;
  `;

  const signedDate = data.signedAt
    ? new Date(data.signedAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    : "";

  container.innerHTML = `
    <div style="border-bottom:3px solid #d4a843;padding-bottom:20px;margin-bottom:32px;">
      <h1 style="font-size:22px;font-weight:bold;margin:0 0 6px;color:#111;">${data.title}</h1>
      <p style="font-size:13px;color:#666;margin:0;">طرف قرارداد: ${data.clientName}</p>
      ${signedDate ? `<p style="font-size:13px;color:#666;margin:4px 0 0;">تاریخ امضا: ${signedDate}</p>` : ""}
    </div>

    <div style="font-size:14px;color:#222;margin-bottom:48px;white-space:pre-wrap;">
      ${data.content}
    </div>

    <div style="border-top:1px solid #ddd;padding-top:32px;display:flex;justify-content:space-between;gap:40px;">
      <div style="flex:1;text-align:center;">
        <p style="font-size:12px;color:#666;margin:0 0 8px;">امضای ارائه‌دهنده خدمات</p>
        ${data.adminSignatureDataUrl
          ? `<img src="${data.adminSignatureDataUrl}" style="height:60px;display:block;margin:0 auto;" />`
          : `<div style="height:60px;border-bottom:1px solid #999;"></div>`}
        ${data.adminSignedAt ? `<p style="font-size:11px;color:#999;margin:8px 0 0;">${new Date(data.adminSignedAt).toLocaleDateString("fa-IR")}</p>` : ""}
      </div>
      <div style="flex:1;text-align:center;">
        <p style="font-size:12px;color:#666;margin:0 0 8px;">امضای ${data.clientName}</p>
        ${data.clientSignatureDataUrl
          ? `<img src="${data.clientSignatureDataUrl}" style="height:60px;display:block;margin:0 auto;" />`
          : `<div style="height:60px;border-bottom:1px solid #999;"></div>`}
        ${signedDate ? `<p style="font-size:11px;color:#999;margin:8px 0 0;">${signedDate}</p>` : ""}
      </div>
    </div>

    ${data.signedIp ? `
    <div style="margin-top:24px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:11px;color:#888;text-align:center;">
      این قرارداد به صورت الکترونیکی از IP ${data.signedIp} در تاریخ ${signedDate} امضا شده است.
    </div>` : ""}
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `${data.title.replace(/\s+/g, "_")}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
