import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones de Boda Online con IA | Cumplefy",
  description:
    "Videoinvitaciones de boda cinematográficas generadas con IA. Lista de bodas digital, RSVP automático y página del evento épica. El día más especial, la invitación más especial.",
  keywords:
    "invitaciones boda online, videoinvitaciones boda, invitación boda digital, lista de bodas, RSVP boda, boda civil, boda religiosa, boda íntima, elopement España",
  openGraph: {
    title: "Invitaciones de Boda con IA | Cumplefy",
    description: "La invitación de boda más especial jamás creada. IA generativa, lista de regalos y RSVP automático.",
    url: "https://cumplefy.com/bodas",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/bodas" },
};

export default function BodasPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "bodas",
        title: "Bodas",
        emoji: "💍",
        gradient: "linear-gradient(135deg,#E8C4A0 0%,#B8854A 100%)",
        color: "#C4956A",
        heroTagline: "Invitaciones de boda con IA generativa",
        heroHeadline: "La boda que soñaste,",
        heroHeadlineMark: "la invitación que merece.",
        heroParagraph:
          "El Genio crea una videoinvitación cinematográfica única para vuestro día. Gestiona la lista de bodas, el RSVP y la página del evento. Vosotros, solo enamoraos.",
        subClusters: [
          { title: "Boda Civil",        emoji: "🏛️", href: "/bodas/civil",       desc: "Celebración laica, íntima y moderna. El Genio crea una invitación tan especial como vuestra historia." },
          { title: "Boda Religiosa",    emoji: "⛪", href: "/bodas/religiosa",   desc: "La tradición con un toque cinematográfico. Invitaciones que emocionan desde el primer segundo." },
          { title: "Boda Íntima",       emoji: "🌿", href: "/bodas/intima",      desc: "Menos de 30 invitados, máxima emoción. El Genio personaliza cada detalle." },
          { title: "Elopement",         emoji: "✈️", href: "/bodas/elopement",   desc: "Solo vosotros dos y el mundo. Una invitación épica para compartir después." },
          { title: "Boda en Destino",   emoji: "🌊", href: "/bodas/destino",     desc: "Mediterráneo, Canarias o el extranjero. El Genio gestiona la logística de invitados." },
          { title: "Lista de Bodas",    emoji: "🎁", href: "/bodas/lista",       desc: "Amazon, El Corte Inglés, viaje de novios, experiencias... Todo en un lugar." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación de boda única", desc: "No es una plantilla. Es una producción cinematográfica con vuestra historia, fotos y estilo. Vuestros invitados llorarán de emoción." },
          { icon: <Gift size={20} />,  title: "Lista de bodas completa",       desc: "Integración con Amazon, El Corte Inglés, Airbnb para el viaje de novios y experiencias Civitatis. Todo en un enlace." },
          { icon: <Users size={20} />, title: "RSVP y coordinación total",     desc: "Gestión de menús, alergias, transporte, hotel y confirmaciones. El Genio lo coordina todo automáticamente." },
        ],
        testimonial: {
          name: "Carlos & Lucía",
          role: "Boda en Sevilla, septiembre 2024",
          avatar: "CL",
          text: "Nuestra lista de bodas con Cumplefy fue perfecta. Los invitados podían regalar directamente desde la invitación, sin complicaciones. La videoinvitación emocionó a todo el mundo. Nuestra madrina la sigue viendo y llorando meses después de la boda.",
        },
        faqs: [
          { q: "¿Puedo crear una lista de bodas con diferentes tiendas?", a: "Sí. Puedes añadir productos de Amazon, El Corte Inglés, Zara Home, y también experiencias (Civitatis, Smartbox) o aportaciones para el viaje de novios. Todo en un solo enlace para tus invitados." },
          { q: "¿Cómo gestiona el Genio el RSVP de una boda grande?", a: "El Genio recoge confirmaciones, menú (carne/pescado/vegetariano), alergias, necesidad de transporte o alojamiento. Tienes un panel en tiempo real con todos los datos exportables a Excel." },
          { q: "¿Las videoinvitaciones incluyen fotos nuestras?", a: "Sí. Subes hasta 20 fotos de vuestra pareja y el Genio las integra en una producción cinematográfica con música, efectos y vuestros datos. El resultado es impresionante." },
          { q: "¿Podemos usar Cumplefy para la web de nuestra boda?", a: "Sí. La página del evento incluye toda la información: horarios, ubicación con Google Maps, dress code, FAQ para invitados y contador regresivo al gran día." },
          { q: "¿Qué diferencia hay entre el plan gratuito y Pro para bodas?", a: "El plan gratuito cubre el RSVP y la página del evento. El plan Pro (9€/mes) incluye la videoinvitación con IA, la lista de bodas con afiliados, el chatbot Genio por voz y analytics avanzados." },
        ],
        ctaHeadline: "¿El gran día se acerca?",
        ctaParagraph: "Crea la invitación de boda más especial en menos de 2 minutos. Gratis para siempre.",
      }}
    />
  );
}
