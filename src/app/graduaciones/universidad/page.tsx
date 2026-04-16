import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Fiesta Graduación Universidad — Invitaciones y Organización | Cumplefy",
  description: "Organiza la fiesta de graduación universitaria perfecta. Videoinvitaciones cinematográficas con toga y birrete, lista de regalos coordinada y RSVP para toda la familia. Gratis.",
  keywords: "graduación universitaria fiesta, invitaciones graduación universidad, fiesta graduación carrera, organizar graduación universitaria, invitación orla universidad, celebración fin de carrera",
  alternates: { canonical: "https://cumplefy.com/graduaciones/universidad" },
  openGraph: {
    title: "Fiesta Graduación Universidad | Cumplefy",
    description: "Años de carrera merecen una celebración épica. El Genio crea la invitación perfecta con toga, birrete y tu historia universitaria.",
    url: "https://cumplefy.com/graduaciones/universidad",
  },
};

export default function GraduacionUniversidadPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/graduaciones",
        clusterTitle: "Graduaciones",
        clusterEmoji: "🎓",
        title: "Graduación Universitaria",
        emoji: "🏛️",
        color: "#0D9488",
        gradient: "linear-gradient(135deg,#0D9488 0%,#7C3AED 100%)",
        heroTagline: "Años de carrera. Una celebración épica.",
        heroHeadline: "Te lo has ganado.",
        heroHeadlineMark: "Celébralo en grande.",
        heroParagraph: "Madrugadas estudiando, exámenes infinitos, prácticas, TFG... y por fin el día de la toga y el birrete. Eso merece una celebración y una invitación a la altura. El Genio crea una producción cinematográfica con tu historia universitaria que hará llorar de orgullo a tus padres.",
        bullets: [
          "Videoinvitación con tus fotos universitarias y el día de la graduación",
          "Diseño premium con motivos académicos: toga, birrete, diploma",
          "Lista de regalos: gadgets, experiencias, viaje de fin de carrera, dinero",
          "RSVP para familia y amigos — gestión de mesas y menús",
          "Página del evento con ceremonia de graduación y celebración posterior",
          "Compartir por WhatsApp e Instagram en 1 clic",
        ],
        features: [
          { icon: <Video size={20} />, title: "Tus padres llorarán de orgullo", desc: "Una producción cinematográfica con tus fotos universitarias, los momentos clave de la carrera y el gran día de la graduación. El Genio crea algo tan emotivo que tus padres la guardarán para siempre." },
          { icon: <Gift size={20} />, title: "Regalos que necesitas de verdad", desc: "Tus familiares quieren regalarte algo útil para esta nueva etapa. El Genio te ayuda a crear la lista perfecta: portátil, experiencias, viaje de celebración, o aportaciones para lo que más necesites." },
          { icon: <Users size={20} />, title: "Familia y amigos coordinados", desc: "La familia viene de fuera, los amigos tienen horarios distintos... El Genio gestiona las confirmaciones, las indicaciones para llegar y la organización del almuerzo o cena de celebración." },
        ],
        faqs: [
          { q: "¿Puedo hacer una invitación para la ceremonia oficial de graduación Y la celebración posterior?", a: "Sí. Puedes tener dos eventos en la misma página: la ceremonia oficial de graduación con sus horarios y la celebración privada posterior. Los invitados ven ambos en el mismo lugar." },
          { q: "¿Cómo gestiono que parte de la familia venga de fuera?", a: "El Genio incluye módulos de transporte y alojamiento. Puedes indicar hoteles recomendados cercanos, información de cómo llegar en tren o avión, y coordinar si se organizan traslados compartidos." },
          { q: "¿Qué tipo de regalos son más adecuados para poner en la lista?", a: "Para una graduación universitaria, los más comunes son: portátil o gadgets para el trabajo, viaje de celebración, experiencias, dinero para el piso, cursos de posgrado o idiomas. El Genio te sugiere opciones según el perfil." },
          { q: "¿Puedo crear la invitación junto a otros compañeros de clase para la orla grupal?", a: "Sí. Puedes añadir coadministradores al evento y co-organizarlo con los delegados o el grupo de clase. El Genio gestiona múltiples organizadores sin problemas." },
        ],
        related: [
          { title: "Graduación Bachillerato", emoji: "🏫", href: "/graduaciones/bachillerato" },
          { title: "Graduación FP", emoji: "⚙️", href: "/graduaciones/fp" },
          { title: "Máster y Posgrado", emoji: "📜", href: "/graduaciones/master" },
          { title: "Afterparty Graduación", emoji: "🎉", href: "/graduaciones/afterparty" },
        ],
        cta: {
          headline: "Te lo has ganado. Ahora celébralo como se merece.",
          paragraph: "El Genio crea la invitación perfecta con tu historia universitaria. Tus padres llorarán de orgullo al verla. En 2 minutos.",
        },
      }}
    />
  );
}
