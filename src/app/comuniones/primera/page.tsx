import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones Primera Comunión con IA | Cumplefy",
  description: "Crea invitaciones de primera comunión preciosas con IA. Fotos del niño o la niña, diseño elegante, lista de regalos sin duplicados y RSVP con gestión de menús. La familia quedará emocionada.",
  keywords: "invitaciones primera comunión, invitación comunión niña, invitación comunión niño, invitaciones comunión digitales, organizar primera comunión, lista regalos comunión, comunión 2024 2025",
  alternates: { canonical: "https://cumplefy.com/comuniones/primera" },
  openGraph: {
    title: "Invitaciones Primera Comunión con IA | Cumplefy",
    description: "El día más especial de su vida merece la invitación más emotiva. El Genio crea una producción que la familia guardará para siempre.",
    url: "https://cumplefy.com/comuniones/primera",
  },
};

export default function PrimeraComunionPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/comuniones",
        clusterTitle: "Comuniones",
        clusterEmoji: "✨",
        title: "Primera Comunión",
        emoji: "🕊️",
        color: "#8B5CF6",
        gradient: "linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%)",
        heroTagline: "El día más especial de su vida, inmortalizado",
        heroHeadline: "Una invitación de comunión",
        heroHeadlineMark: "que emociona.",
        heroParagraph: "El vestido blanco, el traje perfecto, la cara de ilusión del niño o la niña... La primera comunión es un momento único que merece una invitación única. El Genio crea una producción cinematográfica con las fotos del protagonista que hará llorar de emoción a los abuelos.",
        bullets: [
          "Videoinvitación con fotos de la niña/niño en el traje de comunión",
          "Diseño elegante y emotivo: blanco, dorado, flores, detalles religiosos",
          "Lista de regalos coordinada — los familiares regalan lo que de verdad quiere",
          "RSVP con gestión de menú adulto, infantil, alergias y silla alta",
          "Página del evento con ceremonia, banquete y hora de inicio",
          "Compartir por WhatsApp a toda la familia en 1 clic",
        ],
        features: [
          { icon: <Video size={20} />, title: "La invitación que los abuelos guardarán", desc: "Fotos del niño o la niña, el traje de comunión, los detalles de la ceremonia y el banquete. El Genio crea una producción tan emotiva que la familia la verá una y otra vez." },
          { icon: <Gift size={20} />, title: "Lista de regalos sin drama familiar", desc: "Los tíos que regalan lo mismo, los primos que no saben qué comprar... El Genio coordina la lista para que cada familiar elija un regalo único y deseado. Adiós al caos navideño en mayo." },
          { icon: <Users size={20} />, title: "Banquete perfectamente organizado", desc: "Menú infantil, adulto, sin gluten, vegetariano, silla alta para los bebés de los primos... El Genio recoge todas las preferencias automáticamente y exporta la lista al restaurante." },
        ],
        faqs: [
          { q: "¿Puedo usar fotos de la comunión en la videoinvitación?", a: "Sí. Subes las fotos del niño o la niña en el traje o vestido de comunión y el Genio las integra en una producción cinematográfica emotiva. El resultado es tan bonito que la familia la guardará para siempre." },
          { q: "¿Cómo coordino los regalos para evitar duplicados?", a: "El Genio crea una lista de regalos donde cada familiar elige lo que va a regalar. Una vez elegido, queda bloqueado para el resto. Adiós a los 3 sobres con dinero y las 2 mochilas escolares iguales." },
          { q: "¿Puedo gestionar el banquete con restricciones alimentarias?", a: "Perfectamente. En el RSVP, cada asistente indica su menú y alergias. El Genio genera un listado por mesa, por familiar y por restricción. Tu restaurante lo agradecerá." },
          { q: "¿Qué incluye la página del evento de comunión?", a: "Lugar y hora de la ceremonia religiosa, dirección del banquete, código de vestimenta, mapa, instrucciones de aparcamiento, y toda la información que la familia necesita para el día." },
        ],
        related: [
          { title: "Comunión Niña", emoji: "👗", href: "/comuniones/nina" },
          { title: "Comunión Niño", emoji: "🤵", href: "/comuniones/nino" },
          { title: "Comunión con Banquete", emoji: "🍽️", href: "/comuniones/banquete" },
          { title: "Lista de Regalos Comunión", emoji: "🎁", href: "/comuniones/regalos" },
        ],
        cta: {
          headline: "El día más especial de su vida, organizado en minutos",
          paragraph: "El Genio crea la invitación, coordina los regalos y gestiona el banquete. Tú solo tienes que disfrutar del momento más emotivo del año.",
        },
      }}
    />
  );
}
