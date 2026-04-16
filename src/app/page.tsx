import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Cumplefy — Videoinvitaciones con IA · Gestión de Eventos · Lista de Regalos",
  description:
    "La primera plataforma todo-en-uno para eventos épicos. Videoinvitaciones cinematográficas con IA donde el protagonista es la estrella, lista de regalos sin repetidos, RSVP automático y mucho más. Gratis para siempre.",
  keywords: [
    "videoinvitaciones inteligencia artificial",
    "invitaciones cumpleaños personalizadas",
    "lista de regalos digital",
    "RSVP online España",
    "organizar cumpleaños",
    "organizar boda online",
    "invitaciones boda digital",
    "invitaciones graduación",
    "plataforma eventos España",
    "talking avatar invitación",
    "invitación con cara del protagonista",
    "gestión regalos cumpleaños",
    "cumplefy",
  ].join(", "),
  openGraph: {
    title: "Cumplefy — Tu celebración se convierte en una obra maestra",
    description:
      "Videoinvitaciones cinematográficas con IA, lista de regalos inteligente y RSVP automático. El Genio organiza el evento de su vida. Gratis.",
    url: "https://cumplefy.com",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "https://cumplefy.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cumplefy — La primera plataforma todo-en-uno para eventos épicos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cumplefy — Videoinvitaciones con IA para eventos épicos",
    description:
      "El protagonista de la celebración se convierte en estrella de Hollywood. Lista de regalos sin repetidos. RSVP automático. Gratis.",
  },
  alternates: {
    canonical: "https://cumplefy.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function Home() {
  return <LandingClient />;
}
