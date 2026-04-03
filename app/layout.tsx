import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://creazaapp.com"),
  title: {
    default: "CreazaApp — Creează aplicații web cu AI",
    template: "%s – CreazaApp",
  },
  description:
    "Platformă AI care generează aplicații web. Descrie ce vrei în română, AI-ul scrie codul, preview-ul apare instant. 8 API-uri AI integrate, 14+ modele AI.",
  keywords: [
    "creare aplicații web",
    "AI app builder",
    "generator aplicații web",
    "aplicații web cu AI",
    "CreazaApp",
    "programare cu AI",
    "no-code România",
    "low-code România",
    "construiește aplicații",
    "generare cod AI",
  ],
  authors: [{ name: "CreazaApp", url: "https://creazaapp.com" }],
  creator: "CreazaApp",
  publisher: "CreazaApp",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://creazaapp.com",
    siteName: "CreazaApp",
    title: "CreazaApp — Creează aplicații web cu AI",
    description:
      "Descrie ce vrei în română. AI-ul scrie codul. Preview-ul apare instant. De la idee la aplicație în minute.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreazaApp — Creează aplicații web cu AI",
    description:
      "Descrie ce vrei în română. AI-ul scrie codul. Preview-ul apare instant. De la idee la aplicație în minute.",
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
  alternates: {
    canonical: "https://creazaapp.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider><ToastProvider><AuthProvider><TooltipProvider>{children}</TooltipProvider></AuthProvider></ToastProvider></ThemeProvider>
      </body>
    </html>
  );
}
