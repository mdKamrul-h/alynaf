import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.headline}`,
  description: SITE.description,
  keywords: [
    "UK shopping Bangladesh",
    "import from UK",
    "AlyNaf",
    "online shopping BD",
    "Amazon UK Bangladesh",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
