import type { Metadata } from "next";
import SubclusterPageClient from "@/components/SubclusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Lista de Bodas Digital — Sin Duplicados | Cumplefy",
  description: "La lista de bodas inteligente que elimina los duplicados. Amazon, El Corte Inglés, Zara Home, viaje de novios y experiencias. Los invitados regalan desde la invitación en 1 clic.",
  keywords: "lista de bodas, lista de bodas digital, lista de bodas online, lista de bodas Amazon, lista de bodas El Corte Inglés, lista de regalos boda, lista de bodas sin duplicados",
  alternates: { canonical: "https://cumplefy.com/bodas/lista" },
  openGraph: {
    title: "Lista de Bodas Digital | Cumplefy",
    description: "La lista de bodas más inteligente de España. Multi-tienda, sin duplicados, los invitados contribuyen en 1 clic directamente desde la invitación.",
    url: "https://cumplefy.com/bodas/lista",
  },
};

export default function ListaBodасPage() {
  return (
    <SubclusterPageClient
      cfg={{
        clusterHref: "/bodas",
        clusterTitle: "Bodas",
        clusterEmoji: "💍",
        title: "Lista de Bodas",
        emoji: "🎁",
        color: "#10B981",
        gradient: "linear-gradient(135deg,#10B981 0%,#0EA5E9 100%)",
        heroTagline: "La lista de bodas más inteligente de España",
        heroHeadline: "Lista de bodas sin",
        heroHeadlineMark: "caos ni duplicados.",
        heroParagraph: "Olvida gestionar transferencias, WhatsApps y hojas de Excel. El Genio crea tu lista de bodas multi-tienda: Amazon, El Corte Inglés, viaje de novios, experiencias... Los invitados eligen y contribuyen directamente desde la invitación. Cero duplicados. Cero complicaciones.",
        bullets: [
          "Multi-tienda: Amazon, El Corte Inglés, Zara Home, IKEA y más",
          "Viaje de novios: aportaciones para Airbnb, vuelos o experiencias",
          "Cada regalo queda bloqueado al ser elegido — sin duplicados posibles",
          "Los invitados contribuyen directamente desde la invitación digital",
          "Panel en tiempo real: ves qué está reservado, qué falta, cuánto se ha recaudado",
          "Sin comisiones ocultas por gestión de la lista",
        ],
        features: [
          { icon: <Gift size={20} />, title: "Multi-tienda en un solo enlace", desc: "Añade artículos de cualquier tienda online. Los invitados acceden a toda la lista desde un único enlace — el de la invitación. Sin apps extra, sin registros complicados." },
          { icon: <Users size={20} />, title: "Contribuciones para el viaje", desc: "Muchas parejas prefieren aportaciones para el viaje de novios o experiencias. El Genio gestiona un fondo colectivo donde los invitados contribuyen la cantidad que deseen." },
          { icon: <Video size={20} />, title: "Integrada en la invitación", desc: "La lista de bodas aparece directamente en la página del evento. Los invitados confirman asistencia y eligen regalo en el mismo lugar. Experiencia impecable para ellos y para vosotros." },
        ],
        faqs: [
          { q: "¿De qué tiendas puedo añadir productos a la lista?", a: "De cualquier tienda online. Pegas el enlace del producto y el Genio importa la foto, el nombre y el precio automáticamente. Amazon, El Corte Inglés, Zara Home, IKEA, Fnac... donde quieras." },
          { q: "¿Cómo funciona el sistema anti-duplicados?", a: "Cuando un invitado elige un regalo, queda marcado como 'reservado' al instante. El resto de invitados lo ven como no disponible. Absolutamente imposible que dos personas regalen lo mismo." },
          { q: "¿Puedo pedir aportaciones para el viaje de novios?", a: "Sí. Puedes añadir una 'experiencia' con un objetivo de recaudación (por ejemplo, 'Noche en hotel en Roma — 180€'). Los invitados aportan la cantidad que quieran hasta completar el importe." },
          { q: "¿Cobra Cumplefy comisiones sobre los regalos?", a: "No. Cumplefy cobra solo la suscripción mensual del plan que elijas. Las compras de regalos van directamente a las tiendas o a vuestro fondo de viaje. Sin comisiones ocultas." },
        ],
        related: [
          { title: "Boda Civil", emoji: "🏛️", href: "/bodas/civil" },
          { title: "Boda Religiosa", emoji: "⛪", href: "/bodas/religiosa" },
          { title: "Boda en Destino", emoji: "🌊", href: "/bodas/destino" },
          { title: "Elopement", emoji: "✈️", href: "/bodas/elopement" },
        ],
        cta: {
          headline: "La lista de bodas que vuestros invitados amarán",
          paragraph: "Sin transferencias, sin WhatsApps, sin duplicados. El Genio lo gestiona todo para que vosotros disfrutéis de cada momento.",
        },
      }}
    />
  );
}
