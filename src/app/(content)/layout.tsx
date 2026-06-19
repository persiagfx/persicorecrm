import type { Metadata } from "next";
import { ContentAuthProvider } from "@/lib/content-auth/context";

export const metadata: Metadata = {
  title: "Persicore Content | تولید محتوای هوشمند",
  description: "تولید محتوای حرفه‌ای و سئوشده با هوش مصنوعی",
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContentAuthProvider>
      {children}
    </ContentAuthProvider>
  );
}
