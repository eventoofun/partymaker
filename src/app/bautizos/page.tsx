import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones de Bautizo Online con IA | Cumplefy",
  description:
    "Videoinvitaciones de bautizo con IA generativa. La bienvenida más especial al mundo para el nuevo miembro de la familia. Lista de regalos, RSVP y página del evento.",
  keywords:
    "invitaciones bautizo, videoinvitaciones bautizo, invitación bautizo digital, lista de regalos bautizo, organizar bautizo, bautizo bebé, bautizo España",
  openGraph: {
    title: "Invitaciones de Bautizo con IA | Cumplefy",
    description: "La bienvenida más especial al mundo para el nuevo miembro de la familia.",
    url: "https://cumplefy.com/bautizos",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/bautizos" },
};

export default function BautizosPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "bautizos",
        title: "Bautizos",
        emoji: "👶",
        gradient: "linear-gradient(135deg,#67E8F9 0%,#2563EB 100%)",
        color: "#67E8F9",
        heroTagline: "Invitaciones de bautizo con IA",
        heroHeadline: "Bienvenido al mundo,",
        heroHeadlineMark: "pequeño.",
        heroParagraph:
          "El Genio crea la invitación de bautizo más emotiva que la familia haya recibido. Gestiona la lista de regalos, el RSVP y la coordinación del banquete. Vosotros, disfrutad del momento.",
        subClusters: [
          { title: "Bautizo tradicional",    emoji: "⛪", href: "/bautizos/tradicional", desc: "Con ceremonia religiosa y banquete familiar. El Genio coordina todos los detalles." },
          { title: "Bautizo civil / laico",  emoji: "🌿", href: "/bautizos/civil",       desc: "Celebración íntima sin elemento religioso. Emotiva e igualmente especial." },
          { title: "Niña recién nacida",     emoji: "🎀", href: "/bautizos/nina",         desc: "Rosa, mariposas, flores... El Genio crea una invitación tan delicada como ella." },
          { title: "Niño recién nacido",     emoji: "💙", href: "/bautizos/nino",          desc: "Azul, estrellas, aventuras... Una invitación para el nuevo explorador de la familia." },
          { title: "Bautizo con banquete",   emoji: "🍽️", href: "/bautizos/banquete",     desc: "Restaurante o finca. El Genio gestiona menús, alergias y disposición de mesas." },
          { title: "Lista de regalos bebé",  emoji: "🎁", href: "/bautizos/regalos",      desc: "Pañales, ropa, juguetes, silla de paseo... Los familiares regalan lo que de verdad necesitáis." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación de bautizo emotiva", desc: "Fotos del bebé, los padres y la familia. El Genio crea una producción que hará llorar a los abuelos." },
          { icon: <Gift size={20} />,  title: "Lista de regalos para bebé",         desc: "Los familiares regalan lo que de verdad necesitáis. Sin duplicados de pijamas ni peluches inservibles." },
          { icon: <Users size={20} />, title: "RSVP y gestión del banquete",        desc: "Menú infantil, adulto, alergias, silla alta... El Genio lo recoge todo automáticamente para el restaurante." },
        ],
        testimonial: {
          name: "Pablo & Sara",
          role: "Padres de Lucía, bautizo febrero 2024",
          avatar: "PS",
          text: "Con un bebé de 2 meses organizarlo todo es una locura. Cumplefy nos salvó la vida. La invitación era preciosa, los abuelos lloraron cuando la vieron, y toda la logística del bautizo quedó perfecta sin que nosotros tuviéramos que perseguir a nadie.",
        },
        faqs: [
          { q: "¿Cuándo se recomienda organizar el bautizo con Cumplefy?", a: "Lo antes posible. Cuanto más tiempo tenéis, mejor podéis coordinar a la familia. Pero el Genio también funciona de urgencia — en 24 horas todo puede estar listo." },
          { q: "¿La lista de regalos puede incluir artículos de bebé específicos?", a: "Sí. Puedes añadir artículos de Amazon, Chicco, Mamas & Papas, y también servicios como sesiones fotográficas o el primer corte de pelo. Todo en un enlace." },
          { q: "¿Puedo añadir la ubicación de la iglesia y el restaurante?", a: "Sí. La página del evento incluye Google Maps integrado para la iglesia y el restaurante. Con los horarios de cada momento del día." },
          { q: "¿La videoinvitación puede incluir fotos del embarazo?", a: "Sí. Muchos padres incluyen una historia desde el embarazo hasta el bautizo. El Genio lo estructura en un relato emotivo." },
          { q: "¿Funciona para bautizos pequeños de familia?", a: "Perfectamente. Para grupos de 20-30 personas el plan gratuito es más que suficiente. Incluye página del evento, RSVP ilimitado y lista de regalos básica." },
        ],
        ctaHeadline: "¿Preparando la bienvenida?",
        ctaParagraph: "Crea la invitación más bonita para el nuevo miembro de la familia en 2 minutos.",
      }}
    />
  );
}
