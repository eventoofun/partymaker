import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones Boda Civil Online con IA | Cumplefy",
  description: "Crea invitaciones de boda civil únicas con IA. Diseño moderno, laico y cinematográfico. Lista de bodas completa, RSVP automático y coordinación de invitados. Gratis para siempre.",
  keywords: "invitaciones boda civil, boda civil invitaciones digitales, invitación boda laica, boda civil moderna, organizar boda civil, lista de bodas civil",
  alternates: { canonical: "https://cumplefy.com/bodas/civil" },
  openGraph: {
    title: "Invitaciones Boda Civil con IA | Cumplefy",
    description: "Vuestra boda civil merece una invitación tan especial como vuestro amor. El Genio crea una producción cinematográfica única.",
    url: "https://cumplefy.com/bodas/civil",
  },
};

export default function BodaCivilPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/bodas",
        clusterTitle: "Bodas",
        clusterEmoji: "💍",
        title: "Boda Civil",
        emoji: "🏛️",
        color: "#0EA5E9",
        gradient: "linear-gradient(135deg,#0EA5E9 0%,#8B5CF6 100%)",
        heroTagline: "Vuestra historia, contada de forma cinematográfica",
        heroHeadline: "La boda civil más",
        heroHeadlineMark: "memorable de su vida.",
        heroParagraph: "Una celebración laica, íntima y completamente vuestra. El Genio crea una videoinvitación que emociona desde el primer segundo, gestiona la lista de bodas con todas las tiendas que quieran y automatiza las confirmaciones de 50 o 500 invitados.",
        bullets: [
          "Videoinvitación cinematográfica con vuestra historia de amor",
          "Diseño moderno y laico — sin elementos religiosos",
          "Lista de bodas multi-tienda: Amazon, Zara Home, El Corte Inglés",
          "RSVP con menús, alergias y transporte coordinado",
          "Página del evento con ceremonia civil, banquete y after",
          "Música de fondo personalizada en la videoinvitación",
        ],
        features: [
          { icon: <Video size={20} />, title: "Una invitación que emociona", desc: "El Genio toma vuestra historia — cómo os conocisteis, vuestros momentos juntos — y crea una producción cinematográfica que vuestros invitados verán una y otra vez." },
          { icon: <Gift size={20} />, title: "Lista de bodas completa", desc: "Productos del hogar, experiencias, viaje de novios, o aportaciones a un fondo... Los invitados eligen y contribuyen directamente desde la invitación. Sin coordinaciones manuales." },
          { icon: <Users size={20} />, title: "Coordinación total de invitados", desc: "Menús, alergias, restricciones alimentarias, transporte desde distintas ciudades, alojamiento cercano... El Genio recoge todo automáticamente y te lo entrega organizado." },
        ],
        faqs: [
          { q: "¿La invitación de boda civil tiene opciones de diseño laico?", a: "Sí. El Genio ofrece diseños completamente laicos y modernos: minimalista, industrial, natural, vintage, art déco... Sin símbolos ni referencias religiosas a menos que los pidáis." },
          { q: "¿Puedo añadir productos de varias tiendas a la lista de bodas?", a: "Absolutamente. Puedes añadir artículos de Amazon, El Corte Inglés, Zara Home, IKEA, Airbnb para el viaje de novios, Civitatis para experiencias... Todo en un mismo enlace para los invitados." },
          { q: "¿Cómo gestiona el Genio los menús del banquete?", a: "En el RSVP, cada invitado selecciona su menú (adulto, infantil, vegetariano, sin gluten...) e indica alergias. El Genio te exporta la lista perfecta para el restaurante o catering." },
          { q: "¿Puedo gestionar invitados de diferentes ciudades?", a: "Sí. La página del evento incluye módulo de transporte donde los invitados indican desde dónde vienen. El Genio agrupa las rutas para facilitar la coordinación de autobuses o transportes compartidos." },
        ],
        related: [
          { title: "Boda Religiosa", emoji: "⛪", href: "/bodas/religiosa" },
          { title: "Boda Íntima", emoji: "🌿", href: "/bodas/intima" },
          { title: "Boda en Destino", emoji: "🌊", href: "/bodas/destino" },
          { title: "Lista de Bodas", emoji: "🎁", href: "/bodas/lista" },
        ],
        cta: {
          headline: "Empezad vuestra nueva vida con la invitación perfecta",
          paragraph: "El Genio crea la videoinvitación, gestiona la lista de bodas y coordina a todos los invitados. Vosotros solo tenéis que decir que sí.",
        },
      }}
    />
  );
}
