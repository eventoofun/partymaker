import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones de Navidad y Cenas de Empresa Online | Cumplefy",
  description:
    "Invitaciones navideñas con IA generativa. Cenas de empresa, amigo invisible, celebraciones familiares. RSVP automático y gestión de regalos. La magia de la Navidad, perfectamente organizada.",
  keywords:
    "invitaciones navidad, cena navidad empresa, amigo invisible online, invitación cena navideña, organizar navidad empresa, felicitación navidad digital, cena navideña",
  openGraph: {
    title: "Invitaciones de Navidad con IA | Cumplefy",
    description: "La magia navideña en una invitación cinematográfica. El Genio organiza toda la Navidad.",
    url: "https://cumplefy.com/navidad",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/navidad" },
};

export default function NavidadPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "navidad",
        title: "Navidad",
        emoji: "🎄",
        gradient: "linear-gradient(135deg,#DC2626 0%,#16A34A 100%)",
        color: "#DC2626",
        heroTagline: "Invitaciones navideñas con IA",
        heroHeadline: "La Navidad más mágica",
        heroHeadlineMark: "de todas.",
        heroParagraph:
          "El Genio crea la invitación navideña perfecta — cenas de empresa, familia, amigos y amigo invisible. Con la magia de la IA y el calor de las fiestas. ¡Felices fiestas!",
        subClusters: [
          { title: "Cena de empresa",       emoji: "🏢", href: "/navidad/empresa",   desc: "La cena navideña del equipo. El Genio gestiona el RSVP, el menú y las mesas para que todo fluya perfecto." },
          { title: "Cena familiar",         emoji: "👨‍👩‍👧‍👦", href: "/navidad/familia",   desc: "Reunir a toda la familia en Nochebuena o Nochevieja. El Genio coordina a todos los primos." },
          { title: "Amigo Invisible",       emoji: "🎁", href: "/navidad/amigo-invisible", desc: "El sorteo automático, el límite de precio y el RSVP. El Genio organiza el amigo invisible perfecto." },
          { title: "Fiesta de Año Nuevo",   emoji: "🥂", href: "/navidad/ano-nuevo",  desc: "Cotillón, cena o afterparty. El Genio crea la invitación más épica de la noche de fin de año." },
          { title: "Felicitación navideña", emoji: "✉️", href: "/navidad/felicitacion", desc: "Una felicitación cinematográfica personalizada con IA para enviar a clientes, amigos o familia." },
          { title: "Posada o reunión",      emoji: "🏡", href: "/navidad/posada",     desc: "La reunión informal de amigos o compañeros. El Genio lo organiza en minutos." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Invitación navideña cinematográfica", desc: "IA generativa crea una producción con neve, luces y la magia de la Navidad. Vuestros invitados la recordarán todo el año." },
          { icon: <Gift size={20} />,  title: "Amigo invisible automático",          desc: "El Genio sortea automáticamente, notifica a cada participante su asignado y gestiona el límite de precio." },
          { icon: <Users size={20} />, title: "RSVP con gestión de menú",            desc: "Perfecto para cenas grandes. Recoge el menú, las alergias y los asistentes. Exporta la lista al restaurante en un clic." },
        ],
        testimonial: {
          name: "Raquel Torres",
          role: "RRHH, empresa de 80 empleados, Madrid",
          avatar: "RT",
          text: "Organizar la cena de Navidad de 80 empleados era una pesadilla de Excel y WhatsApp. Con Cumplefy fue increíblemente fácil. La invitación era preciosa, el RSVP automático y el amigo invisible lo organizamos en 10 minutos. El equipo quedó encantado.",
        },
        faqs: [
          { q: "¿El amigo invisible es realmente automático?", a: "Sí. El Genio sortea automáticamente, envía a cada participante un mensaje con su asignado (sin que nadie más lo vea), gestiona el límite de precio y permite exenciones (parejas, familiares directos)." },
          { q: "¿Puedo usar Cumplefy para la cena de Navidad de empresa?", a: "Es uno de nuestros casos más populares. Funciona perfectamente para cenas de 10 a 500 empleados. El Genio gestiona el RSVP, los menús y los intolerancias de todo el equipo." },
          { q: "¿Las felicitaciones navideñas son personalizadas?", a: "Completamente. Puedes subir el logo de tu empresa o fotos familiares y el Genio crea una felicitación cinematográfica única. Mucho más impactante que una tarjeta estática." },
          { q: "¿Cómo gestiona el Genio los menús de una cena grande?", a: "El RSVP recoge el menú de cada asistente (carne, pescado, vegetariano, vegano) y las alergias. Exportas la hoja al restaurante sin necesidad de hablar con 80 personas." },
          { q: "¿Se puede organizar una Nochevieja con entradas y afterparty?", a: "Sí. Puedes añadir la información del cotillón, el precio de la entrada, el afterparty y toda la logística de la noche en la página del evento." },
        ],
        ctaHeadline: "¿Ya huele a Navidad?",
        ctaParagraph: "Organiza la celebración navideña perfecta en menos de 2 minutos. Gratis para siempre.",
      }}
    />
  );
}
