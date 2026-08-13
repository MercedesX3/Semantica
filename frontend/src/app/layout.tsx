import type { Metadata, Viewport } from "next";
import { EB_Garamond, DM_Sans, Sometype_Mono } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const sometypeMono = Sometype_Mono({
  variable: "--font-sometype-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_NAME = "Semantica";
const DESCRIPTION =
  "Find your next book by how it makes you feel. Semantica reads the emotional DNA of a story and matches you on mood, pacing, and theme — not just genre.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://semantica.app"),
  title: {
    default: `${SITE_NAME} — Find your next book by how it makes you feel`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "book recommendations",
    "semantic book search",
    "what to read next",
    "reading mood",
    "book discovery",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Find your next book by how it makes you feel`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Find your next book by how it makes you feel`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fffcf5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${dmSans.variable} ${sometypeMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
