/**
 * POST /api/video-projects/[id]/checkout
 *
 * Crea una Stripe Checkout Session para el upsell de animación del Genio.
 *
 * Body: { product: "video" | "both" }
 *   - "video"  → €2,99 — solo videoinvitación (Seedance)
 *   - "both"   → €4,99 — videoinvitación + InfiniteTalk
 *
 * Devuelve: { url: string } — URL de la Stripe Checkout page
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videoProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEventRole, canEdit } from "@/lib/permissions";
import { stripe } from "@/lib/stripe";

const bodySchema = z.object({
  product: z.enum(["video", "both"]),
});

type RouteContext = { params: Promise<{ id: string }> };

const PRICES = {
  video: 299,  // €2,99
  both:  499,  // €4,99
} as const;

const LABELS = {
  video: "Videoinvitación animada por El Genio · Cumplefy",
  both:  "Videoinvitación + Retrato que habla (InfiniteTalk) · Cumplefy",
} as const;

export async function POST(req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.query.videoProjects.findFirst({
    where: eq(videoProjects.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getEventRole(project.eventId, userId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Si ya está pagado, no crear otra sesión
  if (project.animationPaid) {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { product } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cumplefy.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: LABELS[product],
            images: ["https://cumplefy.com/genio/genio.png"],
          },
          unit_amount: PRICES[product],
        },
        quantity: 1,
      },
    ],
    metadata: {
      projectId: id,
      eventId: project.eventId,
      product,
    },
    success_url: `${appUrl}/dashboard/eventos/${project.eventId}/invitaciones?paid=1&pid=${id}`,
    cancel_url:  `${appUrl}/dashboard/eventos/${project.eventId}/invitaciones`,
    payment_method_types: ["card"],
    locale: "es",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
  });

  // Guardar el session ID en el proyecto para reconciliación
  await db
    .update(videoProjects)
    .set({ stripeSessionId: session.id, updatedAt: new Date() })
    .where(eq(videoProjects.id, id));

  return NextResponse.json({ url: session.url });
}
