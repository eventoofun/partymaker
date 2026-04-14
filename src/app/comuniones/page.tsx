import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones de Comunión Online con IA | Cumplefy",
  description:
    "Videoinvitaciones de Primera Comunión y Confirmación con IA generativa. Lista de regalos, RSVP automático y página del evento. El día más especial del año, perfectamente organizado.",
  keywords:
    "invitaciones comunión, videoinvitaciones primera comunión, invitación comunión digital, lista de regalos comunión, organizar comunión, primera comunión España, confirmación",
  openGraph: {
    title: "Invitaciones de Comunión con IA | Cumplefy",
    description: "Un momento sagrado que merece la invitación más especial. El Genio lo crea en 2 minutos.",
    url: "https://cumplefy.com/comuniones",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/comuniones" },
};

export default function ComunionesPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "comuniones",
        title: "Comuniones",
        emoji: "✨",
        gradient: "linear-gradient(135deg,#A78BFA 0%,#6D28D9 100%)",
        color: "#A78BFA",
        heroTagline: "Invitaciones de comunión con IA",
        heroHeadline: "Un momento sagrado,",
        heroHeadlineMark: "una invitación única.",
        heroParagraph:
          "El Genio crea la videoinvitación de comunión más especial que la familia haya visto. Gestiona la lista de regalos, el RSVP y coordina a todos los asistentes. Vosotros, vivid el momento.",
        subClusters: [
          { title: "Primera Comunión",     emoji: "🕊️", href: "/comuniones/primera",      desc: "El día más especial de su vida. Una invitación que la familia guardará para siempre." },
          { title: "Confirmación",         emoji: "✝️", href: "/comuniones/confirmacion",  desc: "La ratificación de la fe. Una celebración emotiva con la familia y amigos cercanos." },
          { title: "Comunión niña",        emoji: "👗", href: "/comuniones/nina",          desc: "Vestido blanco, tiara, momento mágico. El Genio crea una invitación tan bonita como ella." },
          { title: "Comunión niño",        emoji: "🤵", href: "/comuniones/nino",          desc: "Traje, guante blanco, el mejor día. Una invitación que refleja la importancia del momento." },
          { title: "Comunión con banquete",emoji: "🍽️", href: "/comuniones/banquete",      desc: "Restaurante, finca o celebración en casa. El Genio gestiona menús, alergias y disposición de mesas." },
          { title: "Lista de regalos",     emoji: "🎁", href: "/comuniones/regalos",       desc: "Los familiares regalan lo que de verdad quiere. Sin duplicados, sin regalos inapropiados." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación de comunión",  desc: "Fotos del niño/a, detalles de la ceremonia y la celebración. Una producción emotiva que la familia conservará siempre." },
          { icon: <Gift size={20} />,  title: "Lista de regalos coordinada",  desc: "Juguetes, experiencias, dinero para estudios... Los familiares eligen desde la invitación. Sin duplicados, sin malentendidos." },
          { icon: <Users size={20} />, title: "RSVP con gestión de menús",    desc: "Perfecto para comuniones con banquete. Recoge menú infantil/adulto, alergias y número de asistentes automáticamente." },
        ],
        testimonial: {
          name: "Ana Martínez",
          role: "Madre de Claudia, comunión mayo 2024",
          avatar: "AM",
          text: "Organizar la comunión de Claudia era un mundo — los regalos duplicados, quién viene, los menús del restaurante... Con Cumplefy todo fluyó perfecto. La videoinvitación que mandamos a los abuelos los emocionó tanto que la guardaron en el móvil para siempre.",
        },
        faqs: [
          { q: "¿La invitación de comunión puede incluir fotos del niño/a?", a: "Sí. Subes las fotos que quieras y el Genio crea una producción cinematográfica emotiva con el traje/vestido de comunión, la iglesia y los detalles de la celebración." },
          { q: "¿Cómo evitamos los regalos duplicados en la comunión?", a: "La lista de regalos de Cumplefy marca automáticamente los artículos ya comprados. Los familiares ven en tiempo real qué está disponible y qué ya está cubierto." },
          { q: "¿Puedo gestionar los menús del restaurante desde Cumplefy?", a: "Sí. El RSVP recoge el menú elegido por cada asistente (adulto, infantil, vegetariano, alergias). Exportas la lista directamente al restaurante." },
          { q: "¿Funciona para comuniones con muchos familiares?", a: "Perfectamente. El plan gratuito cubre hasta 50 invitados. Para comuniones grandes con familia numerosa, el plan Pro (9€/mes) ofrece invitados ilimitados." },
          { q: "¿Hay plantillas específicas para comuniones?", a: "Sí. El Genio tiene plantillas con estética religiosa, elegante y emotiva adaptadas a la Primera Comunión. También puedes personalizarla completamente." },
        ],
        ctaHeadline: "¿La comunión se acerca?",
        ctaParagraph: "Crea la invitación más especial en menos de 2 minutos. Gratis para siempre.",
      }}
    />
  );
}
