import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Header, Footer } from "@/components/site-shell";

export const metadata: Metadata = {
  title: {
    default: "BachataVan | Your ride to Barcelona’s dance nights",
    template: "%s | BachataVan",
  },
  description:
    "Join the BachataVan community for bachata and salsa nights, festival trips, and airport pickups. Weekly dance trips leave from Sagrada Família, Barcelona.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
