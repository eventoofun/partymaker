import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones de Graduación y Orla Online | Cumplefy",
  description:
    "Videoinvitaciones de graduación cinematográficas con IA. Bachillerato, universidad, FP, máster. RSVP automático y página del evento épica. Celebra tu logro como mereces.",
  keywords:
    "invitaciones graduación, videoinvitaciones graduación bachillerato, orla universitaria, fiesta graduación, invitación graduación digital, graduación bachillerato, universidad graduación España",
  openGraph: {
    title: "Invitaciones de Graduación con IA | Cumplefy",
    description: "Años de esfuerzo merecen una invitación épica. El Genio la crea en 2 minutos.",
    url: "https://cumplefy.com/graduaciones",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/graduaciones" },
};

export default function GraduacionesPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "graduaciones",
        title: "Graduaciones",
        emoji: "🎓",
        gradient: "linear-gradient(135deg,#00C2D1 0%,#0066FF 100%)",
        color: "#00C2D1",
        heroTagline: "Invitaciones de graduación con IA",
        heroHeadline: "Años de esfuerzo.",
        heroHeadlineMark: "Una noche épica.",
        heroParagraph:
          "El Genio crea la videoinvitación de graduación más impresionante que tus compañeros hayan visto. Gestiona el RSVP, la lista de regalos y la página del evento. Vosotros, a celebrarlo.",
        subClusters: [
          { title: "Graduación Bachillerato", emoji: "🏫", href: "/graduaciones/bachillerato", desc: "La noche de la orla. El Genio organiza la cena, el after y la videoinvitación perfecta para los adolescentes." },
          { title: "Graduación Universidad", emoji: "🏛️", href: "/graduaciones/universidad",  desc: "Años de carrera merecen una celebración épica. Con toga, birrete y la familia llorando de orgullo." },
          { title: "Graduación FP",          emoji: "⚙️", href: "/graduaciones/fp",           desc: "El Ciclo Formativo termina. Empieza la vida profesional. Celébralo como se merece." },
          { title: "Máster & Posgrado",      emoji: "📜", href: "/graduaciones/master",        desc: "El nivel superior de tu formación. Una invitación a la altura de tu esfuerzo." },
          { title: "Orla de Grupo",          emoji: "📸", href: "/graduaciones/orla",          desc: "La foto que dura para siempre. El Genio crea la invitación para la sesión de fotos grupal." },
          { title: "Afterparty Graduación",  emoji: "🎉", href: "/graduaciones/afterparty",   desc: "Después de la cena oficial, la afterparty legendaria. El Genio la organiza al detalle." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación épica",       desc: "IA generativa crea un video con vuestra historia académica, fotos de grupo y los datos del evento. Calidad cinematográfica." },
          { icon: <Gift size={20} />,  title: "Lista de regalos graduación", desc: "Los familiares regalan lo que de verdad necesitáis: gadgets, experiencias, dinero para el viaje de fin de curso. Sin duplicados." },
          { icon: <Users size={20} />, title: "RSVP para grupos grandes",    desc: "Perfecto para fiestas de 50, 100, 200 personas. El Genio recoge confirmaciones, gestiona mesas y exporta la lista al instante." },
        ],
        testimonial: {
          name: "Alejandro Ruiz",
          role: "Graduado en Bachillerato, IES Madrid",
          avatar: "AR",
          text: "La fiesta de graduación fue épica. El Genio nos ayudó a organizar todo en dos tardes — videoinvitación, RSVP, itinerario de la noche... Mis amigos todavía hablan de la invitación que recibieron. Parecía producida por Netflix.",
        },
        faqs: [
          { q: "¿Puedo crear una invitación para toda la clase?", a: "Sí. Puedes añadir múltiples organizadores, compartir el panel de gestión con los delegados de clase y el Genio coordina a todos los compañeros automáticamente." },
          { q: "¿La videoinvitación puede incluir fotos del grupo?", a: "Absolutamente. Subes las fotos de la clase, del viaje de fin de curso, del último día... El Genio las integra en una producción cinematográfica con efectos y música épica." },
          { q: "¿Cómo gestionamos el pago compartido de la fiesta?", a: "El Genio puede crear una lista de contribuciones donde cada invitado paga su parte directamente. Sin líos de transferencias ni deudas." },
          { q: "¿Funciona para graduaciones de instituto (bachillerato)?", a: "Sí, es uno de nuestros casos de uso más populares. Tenemos plantillas específicas para bachillerato, con el estilo visual y el lenguaje adaptados al público adolescente-joven." },
          { q: "¿Cuántas personas pueden confirmar asistencia?", a: "En el plan gratuito hasta 50 invitados. En el plan Pro (9€/mes), invitados ilimitados. Para graduaciones de universidad o grupos grandes, el Pro es ideal." },
        ],
        ctaHeadline: "¿La graduación se acerca?",
        ctaParagraph: "Crea la invitación más épica de tu clase en menos de 2 minutos. Gratis para siempre.",
      }}
    />
  );
}
