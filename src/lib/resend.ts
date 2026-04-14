import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = process.env.RESEND_FROM_EMAIL ?? "hola@cumplefy.com";

/** Send RSVP confirmation email to guest */
export async function sendRsvpConfirmation(params: {
  guestEmail: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  venue?: string;
  status: "confirmed" | "declined";
}) {
  const { guestEmail, guestName, eventName, eventDate, venue, status: rsvpStatus } = params;

  const attending = rsvpStatus === "confirmed";

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: attending
      ? `¡Confirmado! Asistirás a ${eventName}`
      : `Lamentamos que no puedas venir a ${eventName}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: white; padding: 40px; border-radius: 16px;">
        <div style="font-size: 32px; margin-bottom: 8px;">${attending ? "🎉" : "💌"}</div>
        <h1 style="font-size: 24px; margin: 0 0 16px;">Hola ${guestName}</h1>
        <p style="color: #8888a8;">
          ${attending
            ? `Tu asistencia a <strong style="color: white;">${eventName}</strong> el <strong style="color: white;">${eventDate}</strong>${venue ? ` en ${venue}` : ""} ha sido confirmada.`
            : `Hemos registrado que no podrás asistir a <strong style="color: white;">${eventName}</strong>. ¡Te echaremos de menos!`
          }
        </p>
        <p style="color: #5a5a7a; font-size: 14px;">Con cariño, el equipo de cumplefy.com</p>
      </div>
    `,
  });
}

/** Notify organizer when a contribution is received */
export async function sendContributionNotification(params: {
  organizerEmail: string;
  celebrantName: string;
  contributorName: string;
  amount: number; // cents
  itemTitle: string;
  collectedPercent: number;
}) {
  const { organizerEmail, celebrantName, contributorName, amount, itemTitle, collectedPercent } =
    params;

  const euroAmount = (amount / 100).toFixed(2).replace(".", ",");

  await resend.emails.send({
    from: FROM,
    to: organizerEmail,
    subject: `💰 ${contributorName} ha aportado €${euroAmount} para el regalo de ${celebrantName}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: white; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 24px; margin: 0 0 16px;">¡Nueva aportación!</h1>
        <p style="color: #8888a8;">
          <strong style="color: white;">${contributorName}</strong> ha aportado
          <strong style="color: #06ffa5;">€${euroAmount}</strong> para
          <strong style="color: white;">${itemTitle}</strong>.
        </p>
        <div style="background: #15152e; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #8888a8;">Progreso del regalo</span>
            <span style="color: #06ffa5; font-weight: 700;">${collectedPercent}%</span>
          </div>
          <div style="background: #252540; border-radius: 999px; height: 8px;">
            <div style="background: linear-gradient(90deg, #ff3366, #8338ec); border-radius: 999px; height: 100%; width: ${collectedPercent}%;"></div>
          </div>
        </div>
        <p style="color: #5a5a7a; font-size: 14px;">Gestiona tu evento en cumplefy.com</p>
      </div>
    `,
  });
}

/** Send event invitation with personal RSVP link */
export async function sendEventInvitation(params: {
  guestEmail: string;
  guestName: string;
  celebrantName: string;
  eventType: string;
  eventDate: string | null;
  venue: string | null;
  rsvpUrl: string;        // /rsvp/[token]
  eventUrl: string;       // /e/[slug]
  organizerName: string;
}) {
  const { guestEmail, guestName, celebrantName, eventType, eventDate, venue, rsvpUrl, eventUrl, organizerName } = params;

  const typeEmoji: Record<string, string> = {
    birthday: "🎂", wedding: "💍", graduation: "🎓", bachelor: "🥂",
    communion: "✝️", baptism: "👶", christmas: "🎄", corporate: "🏢", other: "🎉",
  };
  const typeLabel: Record<string, string> = {
    birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
    bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
    christmas: "Navidad", corporate: "Empresa", other: "Evento",
  };

  const emoji = typeEmoji[eventType] ?? "🎉";
  const label = typeLabel[eventType] ?? "Evento";
  const dateStr = eventDate
    ? new Date(eventDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `${emoji} Estás invitado/a al ${label} de ${celebrantName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff3366 0%, #8338ec 100%); padding: 40px 40px 32px; text-align: center;">
          <div style="font-size: 56px; margin-bottom: 12px;">${emoji}</div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: white;">¡Estás invitado/a!</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 16px;">
            ${label} de <strong>${celebrantName}</strong>
          </p>
        </div>
        <div style="padding: 36px 40px;">
          <p style="color: #c0c0e0; font-size: 16px; margin: 0 0 24px;">Hola <strong style="color: white;">${guestName}</strong>,</p>
          <p style="color: #8888a8; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            <strong style="color: white;">${organizerName}</strong> te invita a ${dateStr ? `la celebración del ${label} de <strong style="color: white;">${celebrantName}</strong> el <strong style="color: white;">${dateStr}</strong>` : `la celebración de <strong style="color: white;">${celebrantName}</strong>`}${venue ? ` en <strong style="color: white;">${venue}</strong>` : ""}.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${rsvpUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff3366, #8338ec); color: white; text-decoration: none; padding: 16px 40px; border-radius: 999px; font-weight: 700; font-size: 16px; letter-spacing: 0.02em;">
              Confirmar asistencia →
            </a>
          </div>
          <div style="background: #15152e; border-radius: 12px; padding: 20px 24px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #8888a8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">O copia este enlace</p>
            <p style="margin: 0; color: #c084fc; font-size: 13px; word-break: break-all;">${rsvpUrl}</p>
          </div>
          <p style="color: #5a5a7a; font-size: 13px; margin: 24px 0 0; text-align: center;">
            También puedes ver todos los detalles en <a href="${eventUrl}" style="color: #8338ec;">${eventUrl}</a>
          </p>
        </div>
        <div style="padding: 20px 40px; border-top: 1px solid #1e1e38; text-align: center;">
          <p style="color: #3a3a5a; font-size: 12px; margin: 0;">Enviado con ❤️ desde <a href="https://cumplefy.com" style="color: #5a5a7a;">cumplefy.com</a></p>
        </div>
      </div>
    `,
  });
}

/** Send RSVP reminder to guest */
export async function sendRsvpReminder(params: {
  guestEmail: string;
  guestName: string;
  celebrantName: string;
  eventDate: string | null;
  rsvpUrl: string;
  organizerName: string;
}) {
  const { guestEmail, guestName, celebrantName, eventDate, rsvpUrl, organizerName } = params;

  const dateStr = eventDate
    ? new Date(eventDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `⏰ Recordatorio: ¿vendrás al evento de ${celebrantName}?`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ff3366 100%); padding: 36px 40px 28px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: white;">Recordatorio de RSVP</h1>
        </div>
        <div style="padding: 36px 40px;">
          <p style="color: #c0c0e0; font-size: 16px; margin: 0 0 20px;">Hola <strong style="color: white;">${guestName}</strong>,</p>
          <p style="color: #8888a8; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Todavía no hemos recibido tu respuesta para el evento de <strong style="color: white;">${celebrantName}</strong>${dateStr ? ` del <strong style="color: white;">${dateStr}</strong>` : ""}. ¡A <strong style="color: white;">${organizerName}</strong> le gustaría saber si podrás venir!
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${rsvpUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff3366, #8338ec); color: white; text-decoration: none; padding: 16px 40px; border-radius: 999px; font-weight: 700; font-size: 16px;">
              Responder ahora →
            </a>
          </div>
        </div>
        <div style="padding: 20px 40px; border-top: 1px solid #1e1e38; text-align: center;">
          <p style="color: #3a3a5a; font-size: 12px; margin: 0;">Enviado con ❤️ desde <a href="https://cumplefy.com" style="color: #5a5a7a;">cumplefy.com</a></p>
        </div>
      </div>
    `,
  });
}

/** Send event details to confirmed guests */
export async function sendEventDetails(params: {
  guestEmail: string;
  guestName: string;
  celebrantName: string;
  eventType: string;
  eventDate: string | null;
  eventTime: string | null;
  venue: string | null;
  venueAddress: string | null;
  dressCode: string | null;
  eventUrl: string;
  organizerName: string;
}) {
  const { guestEmail, guestName, celebrantName, eventType, eventDate, eventTime, venue, venueAddress, dressCode, eventUrl, organizerName } = params;

  const typeLabel: Record<string, string> = {
    birthday: "Cumpleaños", wedding: "Boda", graduation: "Graduación",
    bachelor: "Despedida", communion: "Comunión", baptism: "Bautizo",
    christmas: "Navidad", corporate: "Empresa", other: "Evento",
  };
  const label = typeLabel[eventType] ?? "Evento";

  const dateStr = eventDate
    ? new Date(eventDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  const mapsUrl = venueAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`
    : null;

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `📍 Detalles del ${label} de ${celebrantName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #06ffa5 0%, #8338ec 100%); padding: 36px 40px 28px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">📍</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: white;">Detalles del ${label}</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">${celebrantName}</p>
        </div>
        <div style="padding: 36px 40px;">
          <p style="color: #c0c0e0; font-size: 15px; margin: 0 0 24px;">Hola <strong style="color: white;">${guestName}</strong>, aquí están todos los detalles del evento:</p>
          <div style="background: #15152e; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            ${dateStr ? `<div style="display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start;"><span style="font-size: 20px;">📅</span><div><div style="color: #8888a8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 4px;">Fecha</div><div style="color: white; font-weight: 600;">${dateStr}${eventTime ? ` · ${eventTime}` : ""}</div></div></div>` : ""}
            ${venue ? `<div style="display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start;"><span style="font-size: 20px;">📍</span><div><div style="color: #8888a8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 4px;">Lugar</div><div style="color: white; font-weight: 600;">${venue}</div>${venueAddress ? `<div style="color: #8888a8; font-size: 13px; margin-top: 2px;">${venueAddress}</div>` : ""}</div></div>` : ""}
            ${dressCode ? `<div style="display: flex; gap: 12px; align-items: flex-start;"><span style="font-size: 20px;">👔</span><div><div style="color: #8888a8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 4px;">Dress code</div><div style="color: white; font-weight: 600;">${dressCode}</div></div></div>` : ""}
          </div>
          ${mapsUrl ? `<div style="text-align: center; margin-bottom: 24px;"><a href="${mapsUrl}" style="display: inline-block; background: #15152e; border: 1px solid #2a2a4a; color: #06ffa5; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: 600; font-size: 14px;">Ver en Google Maps →</a></div>` : ""}
          <div style="text-align: center;">
            <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff3366, #8338ec); color: white; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 700; font-size: 15px;">Ver página del evento →</a>
          </div>
        </div>
        <div style="padding: 20px 40px; border-top: 1px solid #1e1e38; text-align: center;">
          <p style="color: #3a3a5a; font-size: 12px; margin: 0;">Enviado por <strong style="color: #5a5a7a;">${organizerName}</strong> via <a href="https://cumplefy.com" style="color: #5a5a7a;">cumplefy.com</a></p>
        </div>
      </div>
    `,
  });
}

/** Send gift list invite to guests */
export async function sendGiftListInvite(params: {
  guestEmail: string;
  guestName: string;
  celebrantName: string;
  eventUrl: string;
  organizerName: string;
}) {
  const { guestEmail, guestName, celebrantName, eventUrl, organizerName } = params;

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `🎁 Lista de deseos de ${celebrantName}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: white; padding: 40px; border-radius: 16px;">
        <h1 style="font-size: 24px; margin: 0 0 16px;">Hola ${guestName} 👋</h1>
        <p style="color: #8888a8;">
          <strong style="color: white;">${organizerName}</strong> te ha compartido la lista de deseos de
          <strong style="color: white;">${celebrantName}</strong>.
        </p>
        <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff3366, #8338ec); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; margin: 24px 0;">
          Ver lista de regalos
        </a>
        <p style="color: #5a5a7a; font-size: 14px;">Si el botón no funciona, copia este enlace: ${eventUrl}</p>
      </div>
    `,
  });
}
