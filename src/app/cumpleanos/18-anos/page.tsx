import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Fiesta 18 Cumpleaños — Invitaciones y Organización | Cumplefy",
  description: "Organiza la fiesta de 18 años perfecta. Videoinvitaciones cinematográficas con IA, lista de regalos sin repetidos y RSVP automático. La noche más épica de su vida.",
  keywords: "fiesta 18 cumpleaños, invitación 18 años, celebración mayoría de edad, fiesta 18 años ideas, organizar 18 cumpleaños, invitación mayoría de edad",
  alternates: { canonical: "https://cumplefy.com/cumpleanos/18-anos" },
  openGraph: {
    title: "Fiesta 18 Cumpleaños — Invitaciones con IA | Cumplefy",
    description: "La noche que marca el inicio de la edad adulta. El Genio crea la invitación más épica, gestiona los regalos y automatiza el RSVP.",
    url: "https://cumplefy.com/cumpleanos/18-anos",
  },
};

export default function Cumpleanos18Page() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/cumpleanos",
        clusterTitle: "Cumpleaños",
        clusterEmoji: "🎂",
        title: "18 Años — La Mayoría de Edad",
        emoji: "🔞",
        color: "#7C3AED",
        gradient: "linear-gradient(135deg,#7C3AED 0%,#EC4899 100%)",
        heroTagline: "La noche que lo cambia todo",
        heroHeadline: "18 años. Una noche",
        heroHeadlineMark: "legendaria.",
        heroParagraph: "El Genio convierte al protagonista en la estrella de su propia película de Hollywood. Una videoinvitación cinematográfica que sus amigos compartirán en redes antes de que empiece la fiesta. Lista de regalos coordinada y confirmaciones automáticas para que tú solo tengas que disfrutar.",
        bullets: [
          "Videoinvitación estilo Hollywood con el cumpleañero como protagonista",
          "Diseño premium para 18 años: elegante, moderno, épico",
          "Lista de regalos: gadgets, experiencias, dinero para viajes, ropa",
          "RSVP con gestión de entradas o aforo del local",
          "Página del evento con after, dress code e instrucciones",
          "Compartir en WhatsApp, Instagram y TikTok en 1 clic",
        ],
        features: [
          { icon: <Video size={20} />, title: "La invitación más viral", desc: "IA generativa crea una producción cinematográfica donde el protagonista es la estrella. Sus amigos la compartirán en Instagram y TikTok antes de llegar a la fiesta. Marketing incluido." },
          { icon: <Gift size={20} />, title: "Regalos que de verdad quiere", desc: "Los 18 años marcan el fin de los regalos sin sentido. El Genio crea una lista con lo que el protagonista realmente desea: gadgets, experiencias, contribuciones para el viaje de fin de curso." },
          { icon: <Users size={20} />, title: "Control total del aforo", desc: "¿Fiesta en casa con aforo limitado? ¿Local con capacidad máxima? El Genio gestiona confirmaciones, lista de espera y recordatorios automáticos para que no falte ni sobre nadie." },
        ],
        faqs: [
          { q: "¿Puedo gestionar el aforo de la fiesta con Cumplefy?", a: "Sí. Puedes establecer un número máximo de asistentes y el Genio gestiona automáticamente la lista de confirmados, los que están en espera y envía recordatorios a los que no han respondido." },
          { q: "¿La invitación puede incluir información sobre dress code y after?", a: "Absolutamente. La página del evento incluye toda la información que quieras: dress code, horario, after, parking, cómo llegar... El Genio lo organiza en módulos claros." },
          { q: "¿Puede el protagonista aparecer en la videoinvitación?", a: "Sí. Con las fotos del cumpleañero, el Genio crea una producción cinematográfica donde él/ella es la estrella absoluta. El resultado es tan impresionante que sus amigos lo compartirán en redes." },
          { q: "¿Puedo coordinar los regalos de dinero o experiencias?", a: "Sí. Puedes añadir solicitudes de aportaciones para viajes, experiencias o transferencias directas. Los invitados contribuyen desde la propia invitación con total transparencia." },
        ],
        related: [
          { title: "Cumpleaños Infantil", emoji: "🎈", href: "/cumpleanos/infantil" },
          { title: "30, 40, 50 años", emoji: "🥳", href: "/cumpleanos/decadas" },
          { title: "Cumpleaños Sorpresa", emoji: "🎁", href: "/cumpleanos/sorpresa" },
          { title: "Cumpleaños Temático", emoji: "🎭", href: "/cumpleanos/tematico" },
        ],
        cta: {
          headline: "La fiesta de 18 que recordarán toda la vida",
          paragraph: "Empieza en 2 minutos. El Genio crea la invitación, coordina los regalos y gestiona el RSVP. Tú solo tienes que aparecer y brillar.",
        },
      }}
    />
  );
}
