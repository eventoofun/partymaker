import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Organizar Cumpleaños Sorpresa Online | Cumplefy",
  description: "Organiza un cumpleaños sorpresa perfecto sin que el homenajeado se entere. El Genio coordina a los invitados en secreto, gestiona los regalos y automatiza el RSVP discretamente.",
  keywords: "cumpleaños sorpresa, organizar sorpresa cumpleaños, fiesta sorpresa cumpleaños, invitación sorpresa, coordinar sorpresa cumpleaños",
  alternates: { canonical: "https://cumplefy.com/cumpleanos/sorpresa" },
  openGraph: {
    title: "Organizar Cumpleaños Sorpresa | Cumplefy",
    description: "El Genio coordina la sorpresa perfecta en secreto. Los invitados confirman sin que el homenajeado se entere nada.",
    url: "https://cumplefy.com/cumpleanos/sorpresa",
  },
};

export default function CumpleanosSorpresaPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/cumpleanos",
        clusterTitle: "Cumpleaños",
        clusterEmoji: "🎂",
        title: "Cumpleaños Sorpresa",
        emoji: "🎁",
        color: "#F59E0B",
        gradient: "linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)",
        heroTagline: "La sorpresa perfecta, en secreto total",
        heroHeadline: "La sorpresa que",
        heroHeadlineMark: "nunca olvidará.",
        heroParagraph: "El Genio coordina a todos los invitados en modo secreto: RSVP discreto, recordatorios sin spoilers y gestión de regalos coordinada. Tú organizas todo desde el panel; el homenajeado no sabe nada hasta que llega la hora.",
        bullets: [
          "Modo sorpresa: la página del evento es invisible para el homenajeado",
          "RSVP secreto — los invitados confirman sin dejar rastro público",
          "Recordatorios automáticos para que nadie olvide el día ni la hora",
          "Coordina el regalo conjunto con aportaciones individuales fáciles",
          "Instrucciones de llegada discreta para los invitados",
          "Cuenta atrás y punto de encuentro previo a la sorpresa",
        ],
        features: [
          { icon: <Users size={20} />, title: "Coordinación secreta total", desc: "Los invitados reciben una invitación discreta con instrucciones para guardar el secreto. El Genio les recuerda el día, la hora y cómo llegar sin despertar sospechas." },
          { icon: <Gift size={20} />, title: "Regalo conjunto coordinado", desc: "El Genio organiza el regalo grupal: propone opciones, recoge las aportaciones y coordina quién compra qué. Nada de transferencias incómodas ni reclamaciones." },
          { icon: <Video size={20} />, title: "Videoinvitación del organizador", desc: "Tú protagonizas la invitación 'señuelo' para atraer al homenajeado al lugar. Creamos también el vídeo-sorpresa final para reproducir cuando llegue al lugar del evento." },
        ],
        faqs: [
          { q: "¿Puede el homenajeado ver la página del evento accidentalmente?", a: "No. El modo sorpresa oculta el evento de cualquier búsqueda pública. Solo pueden verlo los invitados que reciban el enlace privado." },
          { q: "¿Cómo coordina el Genio la llegada discreta de los invitados?", a: "El Genio envía instrucciones precisas: punto de encuentro previo, hora de llegada (antes que el homenajeado), código de silencio y quién da la señal. Todo coordinado automáticamente." },
          { q: "¿Puedo organizar un regalo conjunto entre todos los invitados?", a: "Sí. El Genio propone el regalo, cada invitado aporta su parte directamente desde la invitación, y tú ves en tiempo real cuánto se ha recaudado." },
          { q: "¿Funciona para sorpresas con mucha gente (50+ invitados)?", a: "Perfectamente. El Genio gestiona grupos grandes con recordatorios automáticos y confirmaciones en tiempo real. Cuanta más gente, más importante es tener un sistema organizado." },
        ],
        related: [
          { title: "Cumpleaños Infantil", emoji: "🎈", href: "/cumpleanos/infantil" },
          { title: "18 Años", emoji: "🔞", href: "/cumpleanos/18-anos" },
          { title: "30, 40, 50 años", emoji: "🥳", href: "/cumpleanos/decadas" },
          { title: "Cumpleaños en Destino", emoji: "✈️", href: "/cumpleanos/viaje" },
        ],
        cta: {
          headline: "Organiza la sorpresa perfecta sin estresarte",
          paragraph: "El Genio lleva todo el trabajo de coordinación en secreto. Tú te ocupas de la cara del homenajeado cuando llegue.",
        },
      }}
    />
  );
}
