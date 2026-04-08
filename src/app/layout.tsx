import type { Metadata, Viewport } from "next";
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
    default: "eventoo — La lista de regalos inteligente para tu celebración",
    template: "%s | eventoo",
  },
  description:
    "Crea la lista de regalos perfecta para cumpleaños, comuniones y celebraciones. Evita regalos duplicados y organiza aportaciones colectivas fácilmente.",
  keywords: [
    "lista de regalos",
    "cumpleaños niños",
    "regalos colectivos",
    "gestor de deseos",
    "comunión",
    "bautizo",
    "invitaciones digitales",
  ],
  authors: [{ name: "eventoo" }],
  creator: "eventoo",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://eventoo.es"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://eventoo.es",
    siteName: "eventoo",
    title: "eventoo — La lista de regalos inteligente",
    description:
      "Crea la lista de regalos perfecta. Evita duplicados. Organiza aportaciones colectivas.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "eventoo",
    description: "La lista de regalos inteligente para celebraciones",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
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
