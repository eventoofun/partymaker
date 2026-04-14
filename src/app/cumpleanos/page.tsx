import type { Metadata } from "next";
import ClusterPageClient from "@/components/ClusterPageClient";
import { Video, Gift, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Invitaciones de Cumpleaños Online con IA | Cumplefy",
  description:
    "Crea videoinvitaciones de cumpleaños cinematográficas con IA. Lista de regalos, RSVP automático y página del evento épica. Gratis para siempre. ¡Pruébalo en 2 minutos!",
  keywords:
    "invitaciones cumpleaños online, videoinvitaciones cumpleaños, invitación cumpleaños digital, lista de regalos cumpleaños, organizar cumpleaños, cumpleaños infantil, cumpleaños 18 años, cumpleaños 50 años, cumpleaños sorpresa",
  openGraph: {
    title: "Invitaciones de Cumpleaños con IA | Cumplefy",
    description: "Videoinvitaciones cinematográficas para cumpleaños. El Genio lo organiza todo en 2 minutos.",
    url: "https://cumplefy.com/cumpleanos",
    siteName: "Cumplefy",
    locale: "es_ES",
    type: "website",
  },
  alternates: { canonical: "https://cumplefy.com/cumpleanos" },
};

export default function CumpleanosPage() {
  return (
    <ClusterPageClient
      cfg={{
        id: "cumpleanos",
        title: "Cumpleaños",
        emoji: "🎂",
        gradient: "linear-gradient(135deg,#FF4D6D 0%,#FFB300 100%)",
        color: "#FF4D6D",
        heroTagline: "Invitaciones de cumpleaños con IA",
        heroHeadline: "El cumpleaños más",
        heroHeadlineMark: "épico de su vida.",
        heroParagraph:
          "El Genio crea la videoinvitación perfecta, gestiona la lista de regalos y automatiza el RSVP. Tus invitados quedarán con la boca abierta. Tú, disfrutando.",
        subClusters: [
          { title: "Cumpleaños Infantil",   emoji: "🎈", href: "/cumpleanos/infantil",  desc: "Para los peques de casa. Temas de superhéroes, princesas, dinosaurios y más." },
          { title: "18 Años — Mayoría",     emoji: "🔞", href: "/cumpleanos/18-anos",   desc: "La noche que marca el inicio de la edad adulta. Hazla legendaria." },
          { title: "30, 40, 50 años",       emoji: "🥳", href: "/cumpleanos/decadas",   desc: "Los números redondos merecen celebraciones épicas y emotivas." },
          { title: "Cumpleaños Sorpresa",   emoji: "🎁", href: "/cumpleanos/sorpresa",  desc: "Organiza la sorpresa perfecta. El Genio coordina a los invitados en secreto." },
          { title: "Cumpleaños en Destino", emoji: "✈️", href: "/cumpleanos/viaje",     desc: "Celebra en la playa, en la montaña o en otra ciudad. El Genio gestiona la logística." },
          { title: "Cumpleaños Temático",   emoji: "🎭", href: "/cumpleanos/tematico",  desc: "Hollywood, años 80, carnaval, videojuegos... el estilo que imagines." },
        ],
        features: [
          { icon: <Video size={20} />, title: "Videoinvitación cinematográfica", desc: "IA generativa crea una producción personalizada con tus fotos, datos y estilo. Lista en minutos." },
          { icon: <Gift size={20} />,  title: "Lista de regalos inteligente",    desc: "Amazon, El Corte Inglés, experiencias Smartbox... Los invitados regalan directamente desde la invitación." },
          { icon: <Users size={20} />, title: "RSVP sin fricción",               desc: "Confirmación en 1 clic. Ves en tiempo real quién viene, dietas especiales, transporte — todo organizado." },
        ],
        testimonial: {
          name: "María García",
          role: "Mamá de Sofía, cumpleaños 8 años",
          avatar: "MG",
          text: "La videoinvitación del cumpleaños de mi hija fue un WOW total. Los padres del colegio me preguntaban cómo lo había hecho. Nunca había organizado algo tan bonito con tan poco esfuerzo. El Genio lo preparó todo en menos de 5 minutos.",
        },
        faqs: [
          { q: "¿Es gratis crear una invitación de cumpleaños?", a: "Sí. El plan gratuito incluye 1 evento activo, hasta 50 invitados, página del evento y RSVP ilimitado. Las videoinvitaciones con IA generativa están disponibles en el plan Pro (9€/mes)." },
          { q: "¿Cuánto tarda en generarse la videoinvitación?", a: "Entre 3 y 8 minutos dependiendo de la complejidad. El Genio te notifica cuando está lista y puedes compartirla inmediatamente por WhatsApp, email o redes sociales." },
          { q: "¿Puedo organizar un cumpleaños sorpresa con Cumplefy?", a: "Absolutamente. El Genio gestiona los RSVP de los invitados de forma discreta y puede enviar recordatorios sin que el homenajeado se entere. Hay un modo 'sorpresa' específico." },
          { q: "¿Funciona para cumpleaños infantiles?", a: "Sí, con temas específicos para niños: princesas, dinosaurios, superhéroes, Minecraft... La invitación adapta el estilo visual y el lenguaje al público objetivo." },
          { q: "¿Cómo funciona la lista de regalos?", a: "Añades productos de Amazon, El Corte Inglés o experiencias. Los invitados ven la lista desde la invitación, marcan lo que regalan y tú recibes los fondos directamente." },
        ],
        ctaHeadline: "¿Listo para el cumpleaños del año?",
        ctaParagraph: "Crea tu primera invitación en menos de 2 minutos. Sin tarjeta de crédito. Sin complicaciones.",
      }}
    />
  );
}
