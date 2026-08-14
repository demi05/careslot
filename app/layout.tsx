import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareSlot — Healthcare access, simplified",
  description:
    "Book hospital appointments in minutes, get reminders that actually reach you, and manage your visits from any device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={workSans.variable}>
      <body className="font-sans antialiased bg-background text-ink">
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
