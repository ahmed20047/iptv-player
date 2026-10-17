import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "IPTV Player",
  description: "مشغل IPTV — بث مباشر وأفلام ومسلسلات",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen text-gray-100 antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
