import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Amigo Invisible Online — Sorteo Automático Gratis | Cumplefy",
  description: "Organiza el amigo invisible perfecto online. Sorteo automático, notificaciones secretas, límite de precio y lista de deseos. Gratis para siempre. El Genio lo gestiona todo.",
  keywords: "amigo invisible online, sorteo amigo invisible, amigo invisible gratis, organizar amigo invisible, amigo invisible automático, amigo invisible trabajo, amigo invisible familia",
  alternates: { canonical: "https://cumplefy.com/navidad/amigo-invisible" },
  openGraph: {
    title: "Amigo Invisible Online — Sorteo Automático | Cumplefy",
    description: "El sorteo más justo y secreto. El Genio asigna automáticamente, notifica a cada participante su asignado y gestiona las listas de deseos.",
    url: "https://cumplefy.com/navidad/amigo-invisible",
  },
};

export default function AmigoInvisiblePage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/navidad",
        clusterTitle: "Navidad",
        clusterEmoji: "🎄",
        title: "Amigo Invisible",
        emoji: "🎁",
        color: "#EF4444",
        gradient: "linear-gradient(135deg,#EF4444 0%,#16A34A 100%)",
        heroTagline: "El sorteo más justo y secreto del año",
        heroHeadline: "Amigo invisible sin",
        heroHeadlineMark: "líos ni apps raras.",
        heroParagraph: "El Genio sortea automáticamente, notifica a cada participante quién es su asignado de forma completamente secreta, gestiona el límite de precio y permite a cada uno crear su lista de deseos. Tú solo pones los nombres. El Genio hace el resto.",
        bullets: [
          "Sorteo automático y justo — el Genio lo hace en segundos",
          "Cada participante recibe su asignado en privado, sin que nadie más lo vea",
          "Límite de precio configurable y visible para todos",
          "Lista de deseos por participante — el regalador sabe qué comprar",
          "Exclusiones configurables (parejas, familiares directos que no quieres juntar)",
          "Recordatorios automáticos para que nadie olvide comprar el regalo",
        ],
        features: [
          { icon: <Users size={20} />, title: "Sorteo secreto e instantáneo", desc: "Añades los participantes, el Genio sortea y notifica a cada uno su asignado de forma privada. Nadie sabe quién le ha tocado a los demás. El misterio está garantizado hasta el día del intercambio." },
          { icon: <Gift size={20} />, title: "Lista de deseos por participante", desc: "Cada participante puede crear su lista de deseos con productos, libros, experiencias... El regalador ve la lista de su asignado y ya no tiene excusa para no acertar con el regalo." },
          { icon: <Video size={20} />, title: "Invitación navideña de nivel", desc: "Una videoinvitación cinematográfica navideña para anunciar el amigo invisible. Con nieve, luces y la magia de la Navidad. Mándala por WhatsApp y el grupo explotará de emojis." },
        ],
        faqs: [
          { q: "¿El sorteo es realmente secreto?", a: "Totalmente. El Genio envía a cada participante su asignado de forma individual. Ni el organizador puede ver todos los resultados. Solo sabe que el sorteo se ha realizado correctamente." },
          { q: "¿Puedo excluir parejas o familiares que no quiero que se toquen?", a: "Sí. En la configuración del sorteo puedes añadir exclusiones: 'Ana y Carlos no pueden tocarse porque son pareja', 'Los hermanos García no entre ellos'... El Genio lo respeta automáticamente." },
          { q: "¿Qué pasa si alguien no puede venir al intercambio?", a: "El Genio gestiona los cambios de participantes hasta el momento del sorteo. También puedes reorganizar entregas alternativas si alguien no puede asistir al evento." },
          { q: "¿Puedo usar Cumplefy solo para el amigo invisible sin crear un evento completo?", a: "Sí. Puedes crear un amigo invisible independiente sin necesidad de una página de evento completa. Perfectamente para grupos de trabajo, pandillas de amigos o la familia en Navidad." },
        ],
        related: [
          { title: "Cena de Empresa Navidad", emoji: "🏢", href: "/navidad/empresa" },
          { title: "Cena Familiar Navidad", emoji: "👨‍👩‍👧‍👦", href: "/navidad/familia" },
          { title: "Fiesta de Año Nuevo", emoji: "🥂", href: "/navidad/ano-nuevo" },
          { title: "Felicitación Navideña", emoji: "✉️", href: "/navidad/felicitacion" },
        ],
        cta: {
          headline: "El amigo invisible más organizado de la historia",
          paragraph: "Añade los participantes, el Genio sortea y cada uno recibe su asignado en secreto. Listo en 2 minutos. Gratis.",
        },
      }}
    />
  );
}
