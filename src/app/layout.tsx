import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Star Management — Lead Management Platform",
  description: "A lead management platform for sales teams. Capture, track, and convert leads with role-based access control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
