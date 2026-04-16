import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Cena de Empresa Navidad — Organización y Invitaciones | Cumplefy",
  description: "Organiza la cena de empresa navideña perfecta. RSVP automático, gestión de menús, alergias y transporte para equipos de 10 a 500 personas. Invitación corporativa premium.",
  keywords: "cena empresa navidad, organizar cena navidad empresa, cena navidad trabajo, invitación cena navidad empresa, gestión cena empresa, cena navideña corporativa",
  alternates: { canonical: "https://cumplefy.com/navidad/empresa" },
  openGraph: {
    title: "Cena de Empresa Navidad | Cumplefy",
    description: "El Genio organiza la cena navideña de tu empresa para 10 o 500 empleados. RSVP, menús, alergias y logística en piloto automático.",
    url: "https://cumplefy.com/navidad/empresa",
  },
};

export default function NavidadEmpresaPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/navidad",
        clusterTitle: "Navidad",
        clusterEmoji: "🎄",
        title: "Cena de Empresa Navidad",
        emoji: "🏢",
        color: "#16A34A",
        gradient: "linear-gradient(135deg,#16A34A 0%,#EF4444 100%)",
        heroTagline: "La cena navideña que el equipo recordará",
        heroHeadline: "Cena de empresa sin",
        heroHeadlineMark: "Excel ni WhatsApps.",
        heroParagraph: "Cada año lo mismo: el lío del RSVP por email, los menús imposibles de cuadrar, quién tiene alergias, el autobús de vuelta... El Genio elimina todo ese caos. Gestiona la confirmación, los menús, las alergias y la logística de 10 a 500 empleados en piloto automático.",
        bullets: [
          "RSVP corporativo — confirmaciones en tiempo real para RRHH",
          "Gestión automática de menús: adulto, vegetariano, sin gluten, infantil",
          "Alergias e intolerancias recogidas automáticamente por el Genio",
          "Módulo de transporte: agrupación de rutas y autobuses de empresa",
          "Invitación corporativa con el branding de tu empresa",
          "Exporta la lista completa al restaurante en un clic",
        ],
        features: [
          { icon: <Users size={20} />, title: "RRHH en piloto automático", desc: "El Genio recoge confirmaciones, gestiona las listas de espera y envía recordatorios automáticos a los que no han respondido. RRHH recibe un panel en tiempo real con todo controlado." },
          { icon: <Gift size={20} />, title: "Amigo invisible integrado", desc: "Organiza el sorteo de amigo invisible de la empresa junto con la cena. El Genio sortea, notifica a cada empleado su asignado en secreto y gestiona el límite de precio corporativo." },
          { icon: <Video size={20} />, title: "Invitación corporativa premium", desc: "Una videoinvitación con el logo y los colores de tu empresa. Profesional, elegante, memorable. Una invitación que dice mucho del nivel de tu organización incluso antes de que empiece la cena." },
        ],
        faqs: [
          { q: "¿Puede gestionar la cena de una empresa de 300 empleados?", a: "Absolutamente. El plan Pro de Cumplefy no tiene límite de invitados. El Genio gestiona 300 confirmaciones, 300 menús y 300 alergias sin que tengas que tocar un Excel." },
          { q: "¿Puedo personalizar la invitación con el logo de mi empresa?", a: "Sí. En el plan Pro puedes subir el logo y aplicar los colores corporativos. La invitación queda completamente branded y refleja la imagen de tu empresa." },
          { q: "¿Cómo exporto la lista de menús al restaurante?", a: "Con un clic. El Genio exporta un Excel o PDF perfectamente formateado con el nombre de cada asistente, su menú elegido y sus alergias. Tu coordinación con el restaurante queda hecha en segundos." },
          { q: "¿Puedo organizar el amigo invisible de la empresa junto con la cena?", a: "Sí. Puedes activar el módulo de amigo invisible dentro del mismo evento. El Genio sortea, notifica y gestiona todo de forma independiente pero integrada en la misma página de evento." },
        ],
        related: [
          { title: "Amigo Invisible", emoji: "🎁", href: "/navidad/amigo-invisible" },
          { title: "Cena Familiar", emoji: "👨‍👩‍👧‍👦", href: "/navidad/familia" },
          { title: "Fiesta Año Nuevo", emoji: "🥂", href: "/navidad/ano-nuevo" },
          { title: "Team Building", emoji: "🤝", href: "/eventos-empresa/team-building" },
        ],
        cta: {
          headline: "La cena navideña que RRHH siempre soñó organizar",
          paragraph: "El Genio recoge los RSVP, gestiona los menús y coordina la logística. Tú solo tienes que llegar a disfrutar con el equipo.",
        },
      }}
    />
  );
}
