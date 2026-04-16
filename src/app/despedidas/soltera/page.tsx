import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Organizar Despedida de Soltera — Invitaciones y Planes | Cumplefy",
  description: "Organiza la despedida de soltera perfecta. Invitaciones épicas, gestión de pagos compartidos, itinerario de actividades y coordinación del grupo. Desde Barcelona hasta Ibiza.",
  keywords: "despedida de soltera, organizar despedida soltera, invitaciones despedida soltera, despedida soltera ideas, despedida soltera Barcelona, despedida soltera Ibiza, pagos compartidos despedida",
  alternates: { canonical: "https://cumplefy.com/despedidas/soltera" },
  openGraph: {
    title: "Organizar Despedida de Soltera | Cumplefy",
    description: "La última aventura antes del sí quiero. El Genio coordina a las chicas, las actividades, los pagos y crea la invitación más épica del grupo.",
    url: "https://cumplefy.com/despedidas/soltera",
  },
};

export default function DespedidaSolteraPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/despedidas",
        clusterTitle: "Despedidas",
        clusterEmoji: "🥂",
        title: "Despedida de Soltera",
        emoji: "👑",
        color: "#EC4899",
        gradient: "linear-gradient(135deg,#EC4899 0%,#F59E0B 100%)",
        heroTagline: "La última aventura antes del sí quiero",
        heroHeadline: "La despedida que",
        heroHeadlineMark: "siempre soñó.",
        heroParagraph: "Organizar una despedida de soltera es un trabajo a tiempo completo: las chicas que no se conocen, los pagos que nadie quiere perseguir, el hotel, las actividades... El Genio lo coordina todo para que tú solo tengas que disfrutar de la última noche de libertad de tu mejor amiga.",
        bullets: [
          "Invitación épica personalizada con fotos de la novia y el grupo",
          "Gestión de pagos compartidos — cada una paga su parte sin drama",
          "Itinerario del día/fin de semana con horarios, reservas y actividades",
          "RSVP del grupo — quién viene, quién no, restricciones alimentarias",
          "Módulo de transporte: desde dónde sale cada una, coordinación de rutas",
          "Página del evento privada con toda la información para las chicas",
        ],
        features: [
          { icon: <Video size={20} />, title: "La invitación que enloquecerá al grupo", desc: "Una videoinvitación épica con fotos de la novia, los planes de la despedida y el estilo de la noche. Las chicas explotarán cuando la reciban. El hype empieza desde la invitación." },
          { icon: <Gift size={20} />, title: "Pagos sin drama ni vergüenza", desc: "El Genio gestiona quién debe qué, recuerda a las que no han pagado de forma amable y distribuye los gastos equitativamente. Sin conversaciones incómodas ni transferencias manuales." },
          { icon: <Users size={20} />, title: "Coordinación del grupo perfecta", desc: "Reservas de restaurantes, spa, escape room, actividades... El Genio coordina los horarios de todas y envía recordatorios automáticos para que nadie llegue tarde ni se pierda." },
        ],
        faqs: [
          { q: "¿Cómo gestiona el Genio los pagos compartidos sin conversaciones incómodas?", a: "El Genio crea un sistema de contribuciones donde cada participante paga su parte directamente. Envía recordatorios automáticos a las que no han pagado. Tú ves en tiempo real el estado de cada pago." },
          { q: "¿Puedo organizar una despedida de fin de semana en otra ciudad?", a: "Perfectamente. El Genio incluye módulos de alojamiento, transporte y actividades. Puedes añadir el hotel, los vuelos o la ruta en tren y cada chica ve toda la información en la página del evento." },
          { q: "¿La invitación puede incluir fotos de la novia?", a: "Sí. Subes las fotos y el Genio crea una videoinvitación personalizada que combina las fotos de la novia con el estilo de la despedida (glamour, atrevida, divertida, de lujo...). Épico garantizado." },
          { q: "¿Puedo gestionar una despedida para 25+ chicas?", a: "Sin problema. El Genio gestiona grupos de cualquier tamaño. Cuanta más gente, más importante es tener un sistema — y más fácil lo hace el Genio." },
        ],
        related: [
          { title: "Despedida de Soltero", emoji: "🍺", href: "/despedidas/soltero" },
          { title: "Fin de Semana", emoji: "✈️", href: "/despedidas/viaje" },
          { title: "Noche en la ciudad", emoji: "🌃", href: "/despedidas/noche" },
          { title: "Despedida Mixta", emoji: "🎊", href: "/despedidas/mixta" },
        ],
        cta: {
          headline: "La despedida que siempre soñó. Organizada en 2 minutos.",
          paragraph: "El Genio coordina a las chicas, los pagos y el itinerario. Tú solo tienes que aparecer con la tiara puesta.",
        },
      }}
    />
  );
}
