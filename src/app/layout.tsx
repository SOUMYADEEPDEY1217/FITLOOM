import type { Metadata } from "next";
import "./globals.css";
import { RadialBackground } from "@/components/ui/light-theme-tailwind-css-background-snippet";
import { FitloomProvider } from "@/components/providers/fitloom-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { Navbar } from "@/components/layout/navbar";
import { ConditionalFooter, MainShell } from "@/components/layout/main-shell";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/layout/cookie-banner";

export const metadata: Metadata = {
  title: {
    default: "FITLOOM — AI Fashion Intelligence & Fit Calibration",
    template: "%s | FITLOOM",
  },
  description:
    "Bridge online fashion discovery and real-world garment fit with explainable Fit Intelligence, simulated Virtual Try-On, and optional CUSTOMFIT tailoring.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <FitloomProvider>
          <LenisProvider>
            <div className="relative isolate flex min-h-screen w-full flex-col">
              <RadialBackground />
              <Navbar />
              <MainShell>
                <AuthRouteGuard>{children}</AuthRouteGuard>
              </MainShell>
              <ConditionalFooter>
                <Footer />
              </ConditionalFooter>
              <CookieConsentBanner />
            </div>
          </LenisProvider>
        </FitloomProvider>
      </body>
    </html>
  );
}
