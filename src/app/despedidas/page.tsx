import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Organizar Despedida de Soltera y Soltero Online | Cumplefy",
  description:
    "Organiza la despedida de soltera o soltero más épica. Videoinvitación con IA, actividades, RSVP automático y gestión de pagos compartidos. La última aventura, perfectamente organizada.",
  keywords:
    "organizar despedida soltera, despedida soltero, invitación despedida soltera, actividades despedida soltera, despedida soltera España, bachelorette party, hen party España",
  openGraph: {
    title: "Despedidas de Soltera y Soltero | Cumplefy",
    description: "La última gran aventura antes del sí quiero. El Genio la organiza a la perfección.",
    url: "https://cumplefy.com/despedidas",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/despedidas" },
};

export default function DespetidasPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "despedidas",
        title: "Despedidas",
        emoji: "🥂",
        gradient: "linear-gradient(135deg,#FFD23F 0%,#FF6B35 100%)",
        color: "#FFB300",
        heroTagline: "Despedidas de soltera y soltero con IA",
        heroHeadline: "La última noche de",
        heroHeadlineMark: "libertad, épica.",
        heroParagraph:
          "El Genio organiza la despedida perfecta: videoinvitación, actividades, gestión de pagos compartidos y RSVP. Vosotras, a disfrutar. Sin dramas de organización.",
        subClusters: [
          { title: "Despedida de Soltera",  emoji: "👑", href: "/despedidas/soltera",    desc: "La última aventura antes del sí quiero. El Genio coordina a las chicas, las actividades y los pagos." },
          { title: "Despedida de Soltero",  emoji: "🍺", href: "/despedidas/soltero",    desc: "La noche épica que el novio recordará para siempre. O no recordará. El Genio lo organiza todo." },
          { title: "Fin de Semana",         emoji: "✈️", href: "/despedidas/viaje",      desc: "Barcelona, Benidorm, Ibiza, Lisboa... El Genio gestiona el alojamiento, las actividades y los pagos." },
          { title: "Noche en la ciudad",    emoji: "🌃", href: "/despedidas/noche",      desc: "Cena, cócteles, discoteca. El Genio reserva y coordina el itinerario perfecto." },
          { title: "Actividades de día",    emoji: "🏄", href: "/despedidas/actividades", desc: "Paddle surf, paintball, spa, escape room, clases de cocina... El Genio busca las mejores opciones." },
          { title: "Despedida mixta",       emoji: "🎊", href: "/despedidas/mixta",      desc: "Juntos o separados pero coordinados. El Genio gestiona los dos grupos al mismo tiempo." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación para despedidas", desc: "Un video épico con fotos de la novia/novio, los planes de la despedida y el estilo de la noche. Las chicas enloquecerán cuando lo reciban." },
          { icon: <Gift size={20} />,  title: "Pagos compartidos sin drama",     desc: "El Genio gestiona quién paga qué, recuerda a las que deben y distribuye los gastos sin conversaciones incómodas." },
          { icon: <Users size={20} />, title: "Coordinación de actividades",     desc: "Reservas, horarios, transporte, alojamiento. El Genio coordina a todo el grupo con recordatorios automáticos." },
        ],
        testimonial: {
          name: "Cristina López",
          role: "Organizadora de la despedida de Marta, Madrid",
          avatar: "CL",
          text: "Organizar la despedida de mi mejor amiga siempre me daba pánico — el lío con los pagos, los horarios, quién viene y quién no... Con Cumplefy fue pan comido. El Genio lo organizó todo en una tarde y la videoinvitación que enviamos fue un showstopper.",
        },
        faqs: [
          { q: "¿Cómo gestiona el Genio los pagos compartidos de la despedida?", a: "El Genio crea un sistema de contribuciones donde cada participante paga su parte directamente. Sin transferencias manuales, sin perseguir a nadie. Tú ves en tiempo real quién ha pagado y quién no." },
          { q: "¿Puedo organizar una despedida en otro país?", a: "Sí. El Genio funciona perfectamente para destinos internacionales. Ayuda con la logística de vuelos, alojamiento compartido y actividades en el destino." },
          { q: "¿La invitación mantiene la sorpresa para la novia/novio?", a: "Hay un modo 'sorpresa' donde el Genio coordina con las invitadas sin que la protagonista reciba información. Los RSVP y los detalles van directamente a la organizadora." },
          { q: "¿Cuántas personas pueden unirse a la despedida?", a: "Sin límite en el plan Pro. En el gratuito hasta 50. Para despedidas de fin de semana con 15-20 personas, el plan gratuito suele ser suficiente." },
          { q: "¿Puedo añadir el itinerario completo de la despedida en la página?", a: "Sí. La página del evento incluye el itinerario hora a hora, los datos de cada actividad, el alojamiento con Google Maps y toda la información que necesitan las invitadas." },
        ],
        ctaHeadline: "¿La despedida se acerca?",
        ctaParagraph: "Organiza la última aventura perfecta en menos de 2 minutos. Gratis para siempre.",
      }}
    />
  );
}
