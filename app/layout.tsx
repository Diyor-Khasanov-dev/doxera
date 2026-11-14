import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doxera.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Doxera - Enterprise Entity & Document Management",
    template: "%s | Doxera",
  },
  description:
    "Enterprise corporate entity governance and document vault platform. Cryptographic credentials storage, Cloudflare R2 object vault, and automated expiration monitoring.",
  applicationName: "Doxera",
  keywords: [
    "Doxera",
    "LLC management",
    "corporate document vault",
    "entity management system",
    "compliance tracking",
    "corporate filings",
    "Articles of Organization",
    "EIN confirmation",
    "Cloudflare R2 vault",
    "document expiration monitoring",
  ],
  authors: [{ name: "Doxera Technologies", url: appUrl }],
  creator: "Doxera Technologies",
  publisher: "Doxera Technologies",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Doxera - Enterprise Entity & Document Management",
    description:
      "Enterprise platform for corporate entity governance and cryptographic document vault management.",
    url: appUrl,
    siteName: "Doxera",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doxera - Enterprise Entity & Document Management",
    description:
      "Enterprise platform for corporate entity governance and cryptographic document vault management.",
    creator: "@doxera",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Doxera",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "description":
        "Enterprise platform for corporate entity governance, automated expiration monitoring, and document vault management.",
      "url": appUrl,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    },
    {
      "@type": "Organization",
      "name": "Doxera",
      "url": appUrl,
      "description":
        "Enterprise Corporate Entity Governance & Cryptographic Document Management.",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
