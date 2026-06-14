import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif for the brand / display moments — characterful, not generic.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const APP_NAME = "Prompt Enhancer";
const APP_DESC =
  "A personal prompt-engineering studio — turn rough ideas into production-grade prompts for GPT, Claude, Gemini, and Grok.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — production-grade prompts`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESC,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Enhancer",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: `${APP_NAME} — production-grade prompts`,
    description: APP_DESC,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04141c",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
