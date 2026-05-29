import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "SMR Consolidated",
  description: "Premium coconut factory production management system",
  manifest: "/manifest.json",
  icons: {
    icon: "/Screenshot_2026-05-29_at_11.10.23-removebg-preview.png",
  }
};

export const viewport: Viewport = {
  themeColor: "#4A2C1D",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
