import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company — Time, in person.",
  description:
    "A marketplace for verified people listing their time for in-person hangouts. Coffee, hikes, concerts, dinners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink">{children}</body>
    </html>
  );
}
