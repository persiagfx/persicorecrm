import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { BlogNav } from "@/components/blog/BlogNav";
import { BlogFooter } from "@/components/blog/BlogFooter";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Persicore Blog", template: "%s | Persicore Blog" },
  description: "آخرین مقالات، راهنماها و بینش‌های تیم Persicore",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <BlogNav />
          <main className="min-h-screen">{children}</main>
          <BlogFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
