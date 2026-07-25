import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";

/**
 * The display face. Terminal type is this product's native vernacular, so the
 * monospace does double duty: large and tight for headlines, small and spaced
 * for labels and numeric readouts.
 */
const term = IBM_Plex_Mono({
  variable: "--font-term",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Body face — narrow and dense, which reads well on a phone. */
const body = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin"],
});

const APP_NAME = "Prompt Studio";
const APP_DESC =
  "Turn a rough idea into a production-grade prompt, and compress a long agent session into a brief you can paste into a fresh one.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — prompts and session handoffs`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESC,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studio",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: `${APP_NAME} — prompts and session handoffs`,
    description: APP_DESC,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1015",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // extend under the iPhone notch / home indicator
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-surface drives the violet/amber signal swap; page.tsx keeps it current.
    <html lang="en" data-surface="enhance">
      <body className={`${term.variable} ${body.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
