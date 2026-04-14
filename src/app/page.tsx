import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Cumplefy — Crea fiestas que nunca se olvidan",
  description:
    "Videoinvitaciones cinematográficas con IA, lista de regalos inteligente y RSVP automático. El Genio gestiona tu celebración perfecta. Gratis para siempre.",
  keywords:
    "invitaciones fiesta online, videoinvitaciones cumpleaños, lista de regalos digital, RSVP online España, organizar fiesta, cumpleaños, boda, graduación bachillerato",
  openGraph: {
    title: "Cumplefy — Tu celebración, épica.",
    description:
      "El asistente mágico que convierte cualquier celebración en algo legendario. Videoinvitaciones con IA, regalos, RSVP y mucho más.",
    url: "https://cumplefy.com",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cumplefy — Tu celebración, épica.",
    description: "El Genio que convierte tu fiesta en algo legendario. Gratis.",
  },
  alternates: {
    canonical: "https://cumplefy.com",
  },
};

export default function Home() {
  return <LandingClient />;
}
