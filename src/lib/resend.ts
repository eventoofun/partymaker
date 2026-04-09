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
  rsvpStatus: "attending" | "not_attending";
}) {
  const { guestEmail, guestName, eventName, eventDate, venue, rsvpStatus } = params;

  const attending = rsvpStatus === "attending";

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
