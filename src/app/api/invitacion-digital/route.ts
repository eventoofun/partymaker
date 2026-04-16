/**
 * /api/invitacion-digital — redirects to the unified video-projects API.
 *
 * El wizard InvitacionDigitalWizardClient llama directamente a:
 *   POST /api/video-projects                    → crear proyecto (mode: "visual")
 *   POST /api/video-projects/[id]/assets/presign → subir fotos
 *   POST /api/video-projects/[id]/assets/confirm → confirmar subida
 *   PATCH /api/video-projects/[id]              → guardar estilo + mensaje
 *   POST /api/video-projects/[id]/generate-image → NanaBanana Pro vía KIE.ai
 *   GET  /api/video-projects/[id]               → polling hasta image_ready
 *
 * Este route existe solo para que la ruta no devuelva 404 si se accede directamente.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Use /api/video-projects for invitation generation via KIE.ai" },
    { status: 200 },
  );
}
