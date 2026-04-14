import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cumplefy — La plataforma mágica para organizar celebraciones perfectas",
    template: "%s | Cumplefy",
  },
  description:
    "Crea la lista de regalos perfecta, gestiona invitados, genera videoinvitaciones y organiza tu celebración en un solo lugar. Sin estrés, sin duplicados.",
  keywords: [
    "lista de regalos",
    "cumpleaños niños",
    "regalos colectivos",
    "organizar fiesta",
    "videoinvitaciones",
    "gestión invitados",
    "comunión",
    "bautizo",
    "invitaciones digitales",
  ],
  authors: [{ name: "Cumplefy" }],
  creator: "Cumplefy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://cumplefy.com",
    siteName: "Cumplefy",
    title: "Cumplefy — La plataforma mágica para celebraciones perfectas",
    description:
      "Organiza la celebración perfecta. Lista de regalos, videoinvitaciones, gestión de invitados y más.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cumplefy",
    description: "La plataforma mágica para organizar celebraciones perfectas",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        {/* Viewport inline — avoids Next.js 15.5 __next_viewport_boundary__ hydration bug */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e1e38",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
