"use client";

import Link from "next/link";

interface PlanLimitBannerProps {
  resource: string;
  current: number;
  limit: number;
  planName: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  users: "کاربران",
  clients: "مشتریان",
  leads: "لیدها",
  projects: "پروژه‌ها",
  invoices: "فاکتورها",
};

export default function PlanLimitBanner({ resource, current, limit, planName }: PlanLimitBannerProps) {
  const label = RESOURCE_LABELS[resource] ?? resource;
  const isAtLimit = current >= limit;
  const isNearLimit = !isAtLimit && current >= limit * 0.8;

  if (!isAtLimit && !isNearLimit) return null;

  if (isAtLimit) {
    return (
      <div
        role="alert"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          padding: "12px 16px",
          borderRadius: "8px",
          backgroundColor: "#FEE2E2",
          border: "1px solid #FCA5A5",
          color: "#991B1B",
          fontSize: "14px",
          lineHeight: "1.5",
          direction: "rtl",
        }}
      >
        <span>
          <strong>سقف پلن تکمیل شده.</strong> شما به حداکثر تعداد {label} ({limit}) در پلن{" "}
          <strong>{planName}</strong> رسیده‌اید. برای ادامه پلن خود را ارتقا دهید.
        </span>
        <Link
          href="/dashboard/settings/billing"
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "6px",
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "13px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          ارتقای پلن
        </Link>
      </div>
    );
  }

  // Near limit warning
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: "#FEF9C3",
        border: "1px solid #FDE047",
        color: "#854D0E",
        fontSize: "14px",
        lineHeight: "1.5",
        direction: "rtl",
      }}
    >
      <span>
        <strong>شما به سقف پلن نزدیک می‌شوید.</strong> {current} از {limit} {label} در پلن{" "}
        <strong>{planName}</strong> استفاده شده.
      </span>
      <Link
        href="/dashboard/settings/billing"
        style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: "6px",
          backgroundColor: "#CA8A04",
          color: "#FFFFFF",
          fontWeight: 600,
          fontSize: "13px",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        مشاهده پلن‌ها
      </Link>
    </div>
  );
}
