import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Stoichem Interio Pvt Ltd - Enterprise Project Management & CRM",
  description:
    "Stoichem Interio Pvt Ltd - Enterprise Project Management, Task Tracking, CRM Sales Pipeline, and Time Tracking",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className="h-screen overflow-hidden bg-background text-foreground antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

