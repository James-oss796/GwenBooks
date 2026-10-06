import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const ibmPlexSans = localFont({
  src: [
    {
      path: "/fonts/IBMPlexSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/IBMPlexSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "/fonts/IBMPlexSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "/fonts/IBMPlexSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

const bebasNeue = localFont({
  src: [
    {
      path: "/fonts/BebasNeue-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--bebas-neue",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gwen-books.vercel.app"),
  title: { default: "GwenBooks — Discover and read books", template: "%s | GwenBooks" },
  description: "Discover books across legitimate catalogs, check source availability, and read supported public-domain or openly licensed texts in GwenBooks.",
  alternates: { canonical: "/" },
  applicationName: "GwenBooks",
  appleWebApp: { capable: true, title: "GwenBooks", statusBarStyle: "black-translucent" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/logo.svg", type: "image/svg+xml" }],
    shortcut: ["/icons/logo.svg"],
    apple: [{ url: "/icons/icon-192.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "GwenBooks",
    title: "GwenBooks — Discover and read books",
    description: "Discover books across legitimate catalogs and read supported open works.",
  },
  twitter: {
    card: "summary",
    title: "GwenBooks — Discover and read books",
    description: "Discover books across legitimate catalogs and read supported open works.",
  },
  robots: { index: true, follow: true },
};

const RootLayout = async ({
  children,
}: {
  children: ReactNode;
}) => {
  const session = await auth();

  return (
    <html lang="en">
            <body
        className={`${ibmPlexSans.className} ${bebasNeue.variable} antialiased`}
        suppressHydrationWarning={true} // Add this line
      >
        <SessionProvider session={session}>
          {children}
          <ServiceWorkerRegistration />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
