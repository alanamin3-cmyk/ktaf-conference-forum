import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const title = "KTAF | Kurdistan Thrombosis & Anticoagulation Forum";
const description =
  "Learn about the Kurdistan Thrombosis & Anticoagulation Forum — KTAF, a scientific forum connecting multidisciplinary expertise across thrombosis and anticoagulation care.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "KTAF",
  icons: {
    icon: "/brand/ktaf-app-icon.svg",
    shortcut: "/brand/ktaf-app-icon.svg",
    apple: "/brand/ktaf-app-icon.svg",
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "KTAF",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D2B45",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script src="/ktaf-config.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
