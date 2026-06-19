import type { Metadata } from "next";
import { AgentAuthProvider } from "@/lib/agent-auth/context";

export const metadata: Metadata = {
  title: "ایجنت‌ساز پرسیکور | ساخت چت‌بات هوشمند",
  description: "چت‌بات اختصاصی برای کسب‌وکار خود بسازید",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentAuthProvider>{children}</AgentAuthProvider>;
}
