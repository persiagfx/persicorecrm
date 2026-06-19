import { PortalProvider } from "@/lib/portal-context";

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <PortalProvider>{children}</PortalProvider>;
}
