import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones Cumpleaños Infantil con IA | Cumplefy",
  description: "Crea videoinvitaciones de cumpleaños infantil increíbles con IA. Temas de dinosaurios, princesas, superhéroes y Minecraft. Lista de regalos sin duplicados. Gratis.",
  keywords: "cumpleaños infantil invitaciones, fiesta cumpleaños niños, invitación cumpleaños niño, invitación cumpleaños niña, cumpleaños superhéroes, cumpleaños princesas, cumpleaños dinosaurios",
  alternates: { canonical: "https://cumplefy.com/cumpleanos/infantil" },
  openGraph: {
    title: "Invitaciones Cumpleaños Infantil con IA | Cumplefy",
    description: "El Genio crea la fiesta de cumpleaños infantil perfecta. Videoinvitación temática, lista de regalos coordinada y RSVP automático.",
    url: "https://cumplefy.com/cumpleanos/infantil",
  },
};

export default function CumpleanosInfantilPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/cumpleanos",
        clusterTitle: "Cumpleaños",
        clusterEmoji: "🎂",
        title: "Cumpleaños Infantil",
        emoji: "🎈",
        color: "#FF4D6D",
        gradient: "linear-gradient(135deg,#FF4D6D 0%,#FFB300 100%)",
        heroTagline: "La fiesta que los niños nunca olvidarán",
        heroHeadline: "El cumpleaños infantil más",
        heroHeadlineMark: "épico de su vida.",
        heroParagraph: "El Genio crea una videoinvitación temática personalizada con la cara y el nombre del peque. Dinosaurios, princesas, superhéroes, Minecraft… el tema que imagines. La lista de regalos elimina los duplicados y los padres confirman asistencia en 1 clic.",
        bullets: [
          "Videoinvitación cinematográfica con el nombre y foto del cumpleañero",
          "Temas: dinosaurios, princesas, superhéroes, Minecraft, unicornios y más",
          "Lista de regalos sin duplicados — los invitados ven qué ya está reservado",
          "RSVP con alergias alimentarias y menú infantil incluido",
          "Página del evento con itinerario, ubicación y mapa integrado",
          "Compartir por WhatsApp, email e Instagram en 1 clic",
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación temática", desc: "IA generativa crea un video con el personaje favorito del peque. La cara del niño aparece en la invitación. Sus amigos del cole quedarán con la boca abierta al recibirla." },
          { icon: <Gift size={20} />, title: "Lista de regalos sin caos", desc: "Pijamas duplicados, juguetes repetidos... el infierno de los cumpleaños infantiles. El Genio coordina la lista para que cada invitado regale algo único y deseado." },
          { icon: <Users size={20} />, title: "RSVP con menú infantil", desc: "Alergias, menú infantil, menú adulto, número de niños... El Genio lo recoge todo automáticamente y te entrega la lista perfecta para el catering o el restaurante." },
        ],
        faqs: [
          { q: "¿Puedo poner la foto de mi hijo en la videoinvitación?", a: "Sí. Subes la foto del cumpleañero y el Genio la integra en la videoinvitación. El niño aparece como el protagonista absoluto de su propia película." },
          { q: "¿Qué temas de cumpleaños infantil están disponibles?", a: "Dinosaurios, princesas, superhéroes de Marvel/DC, Minecraft, unicornios, animales de la granja, piratas, espacio... Puedes describir cualquier tema y el Genio lo adapta." },
          { q: "¿Cómo evito los regalos duplicados?", a: "Los invitados ven en tiempo real qué regalos ya están reservados por otros. Al marcar un regalo, queda bloqueado para el resto. Adiós a los 4 sets de Lego iguales." },
          { q: "¿Es gratis crear la invitación?", a: "El plan gratuito incluye página del evento, RSVP y lista de regalos básica. La videoinvitación con IA está disponible en el plan Pro (9€/mes)." },
        ],
        related: [
          { title: "18 Años", emoji: "🔞", href: "/cumpleanos/18-anos" },
          { title: "Cumpleaños Sorpresa", emoji: "🎁", href: "/cumpleanos/sorpresa" },
          { title: "Cumpleaños Temático", emoji: "🎭", href: "/cumpleanos/tematico" },
          { title: "Décadas (30, 40, 50)", emoji: "🥳", href: "/cumpleanos/decadas" },
        ],
        cta: {
          headline: "¿Lista la fiesta más épica del cole?",
          paragraph: "Crea la invitación en menos de 2 minutos. Sube la foto del peque, elige el tema y el Genio hace el resto. Sin tarjeta de crédito.",
        },
      }}
    />
  );
}
