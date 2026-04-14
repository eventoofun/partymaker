import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Organizar Eventos de Empresa y Team Building | Cumplefy",
  description:
    "Organiza eventos corporativos con IA. Team building, cenas de empresa, lanzamientos de producto, conferencias. RSVP automático, videoinvitación profesional y gestión completa.",
  keywords:
    "organizar eventos empresa, team building España, eventos corporativos, cena empresa, lanzamiento producto, conferencia empresa, invitación evento corporativo, RSVP empresa",
  openGraph: {
    title: "Eventos Corporativos y Team Building | Cumplefy",
    description: "Eventos de empresa que inspiran, conectan equipos y se recuerdan durante años.",
    url: "https://cumplefy.com/eventos-empresa",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/eventos-empresa" },
};

export default function EventosEmpresaPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "eventos-empresa",
        title: "Empresa",
        emoji: "🏢",
        gradient: "linear-gradient(135deg,#00C2D1 0%,#6366F1 100%)",
        color: "#6366F1",
        heroTagline: "Eventos corporativos con IA",
        heroHeadline: "Eventos que tu equipo",
        heroHeadlineMark: "no olvidará.",
        heroParagraph:
          "El Genio crea invitaciones corporativas de nivel profesional, gestiona el RSVP de cientos de empleados y coordina toda la logística. Vosotros, a construir cultura de empresa.",
        subClusters: [
          { title: "Team Building",          emoji: "🤝", href: "/eventos-empresa/team-building",  desc: "Actividades que conectan equipos, refuerzan la cultura y crean recuerdos compartidos." },
          { title: "Cena de empresa",        emoji: "🍽️", href: "/eventos-empresa/cena",           desc: "Desde 10 a 500 empleados. El Genio gestiona el RSVP, los menús y la logística completa." },
          { title: "Lanzamiento de producto",emoji: "🚀", href: "/eventos-empresa/lanzamiento",    desc: "El momento en que tu producto sale al mundo. Una invitación tan épica como el lanzamiento." },
          { title: "Conferencia & Summit",   emoji: "🎤", href: "/eventos-empresa/conferencia",    desc: "Gestión de asistentes, agenda, speakers y networking. El Genio lo coordina todo." },
          { title: "Kick-off & Offsite",     emoji: "🏔️", href: "/eventos-empresa/offsite",        desc: "El arranque del año o el retiro de equipo. El Genio organiza la logística del viaje." },
          { title: "Celebración de logros",  emoji: "🏆", href: "/eventos-empresa/celebracion",   desc: "Premio al empleado del año, récord de ventas, aniversario de empresa. Celebra los hitos." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Invitación corporativa premium",    desc: "Una videoinvitación de nivel profesional con el branding de tu empresa. Impacta a empleados, clientes y partners desde el primer segundo." },
          { icon: <Gift size={20} />,  title: "Gestión de asistentes a escala",    desc: "De 10 a 1.000 empleados. RSVP, menús, alergias, transporte, alojamiento. El Genio lo gestiona sin esfuerzo." },
          { icon: <Users size={20} />, title: "Página del evento profesional",     desc: "Agenda, speakers, ubicación, FAQ corporativo, código de conducta. Todo lo que un evento profesional necesita." },
        ],
        testimonial: {
          name: "David Fernández",
          role: "Director de RRHH, empresa de 200 empleados",
          avatar: "DF",
          text: "Organizar el team building anual para 200 personas era un proyecto en sí mismo. Con Cumplefy lo redujimos a 2 días de trabajo. La invitación fue increíblemente profesional, el RSVP automático nos ahorró semanas de emails y el evento fue un éxito rotundo.",
        },
        faqs: [
          { q: "¿Cumplefy puede gestionar eventos de empresa con cientos de empleados?", a: "Sí. El plan Pro (9€/mes) ofrece invitados ilimitados. Tenemos clientes con eventos de 500+ asistentes. El Genio gestiona el RSVP, los menús y la logística sin problemas." },
          { q: "¿Puedo personalizar la invitación con el branding de mi empresa?", a: "Sí. Subes el logo, los colores corporativos y el Genio crea una invitación completamente alineada con vuestra identidad visual. Resultado: profesional e impactante." },
          { q: "¿Cómo gestiona el RSVP de una cena de empresa grande?", a: "El Genio recoge la confirmación, el menú (carne/pescado/vegetariano), alergias e intolerancias, necesidad de transporte y alojamiento. Exportas el Excel al restaurante y al proveedor de transporte." },
          { q: "¿Se puede usar para eventos con clientes externos?", a: "Absolutamente. Lanzamientos de producto, presentaciones a inversores, eventos de comunidad... El Genio crea una experiencia premium que refuerza la imagen de tu marca." },
          { q: "¿Hay soporte para empresas con necesidades específicas?", a: "El plan Pro incluye soporte prioritario por email. Para eventos grandes (+100 personas) o necesidades especiales (integración con HRSS, SSO), contáctanos para un plan enterprise." },
        ],
        ctaHeadline: "¿El próximo evento se acerca?",
        ctaParagraph: "Organiza tu evento corporativo de forma profesional en menos de 2 minutos.",
      }}
    />
  );
}
