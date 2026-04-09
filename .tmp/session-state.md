# Session State — 2026-04-09

## Current Task
Rediseño completo de Cumplefy (antes eventoo.es). El usuario quiere:
1. Landing page cinematográfica con copy SEO, animaciones, diseño ultra-moderno
2. Wizard mágico con Genio del S.XXI (gafas de sol, chupa cuero, vaqueros) que recomienda 3-5 regalos y se cabrea si añaden más
3. Módulos: Regalos (con búsqueda de proveedores), Invitados (gestión menús/intolerancias), Videoinvitación (Remotion), Proveedor del evento
4. Página pública shareable (WhatsApp/email) con: videoinvitación + regalos + RSVP + Google Maps

## Dominio
- **Nuevo dominio:** `cumplefy.com` (comprado en Cloudflare, activo y con SSL)
- **Dominio anterior:** `eventoo.es` (abandonado por problemas DNSSEC)
- Variable de entorno a actualizar en Vercel: `NEXT_PUBLIC_APP_URL=https://cumplefy.com`

## Completado esta sesión
- [x] DB push (tablas ya existían en Neon)
- [x] Feature video invitaciones Remotion commiteado y pusheado
- [x] Fix build Vercel: `ssr:false` en Server Component → movido a `InvitacionPlayerWrapper.tsx`
- [x] Webhook Stripe verificado (correcto desde antes)
- [x] DNS cumplefy.com configurado en Cloudflare (A @ → 76.76.21.21, CNAME www → cname.vercel-dns.com)
- [x] cumplefy.com añadido en Vercel, SSL activo, sitio online

## Pendiente — GRAN REDISEÑO
- [ ] **Landing page** cinematográfica completa con copy SEO (ver visión abajo)
- [ ] **Genio del S.XXI** — personaje SVG/animado en el wizard
- [ ] **Wizard rediseño** — 5 pasos: Regalos → Invitados → Videoinvitación → Proveedor → Preview público
- [ ] **Búsqueda de proveedores** — sistema que propone 3 opciones por regalo (Amazon, El Corte Inglés, experiencia)
- [ ] **Gestión menús** — invitados con intolerancias alimentarias
- [ ] **Página pública** rediseño total: videoinvitación + regalos + RSVP + Google Maps
- [ ] Actualizar `NEXT_PUBLIC_APP_URL` a `https://cumplefy.com` en Vercel
- [ ] Actualizar branding de "eventoo" a "Cumplefy" en toda la app
- [ ] Actualizar webhook Clerk a `https://cumplefy.com/api/webhooks/clerk`

## Visión completa del producto (del usuario)

### Landing page
- Estilo cinematográfico, animaciones, diseño ultra-moderno
- Copy SEO atacando puntos de dolor: padres ocupados, sin tiempo, preocupados por niños hiperregalados
- Propuesta de valor: todo en un solo lugar

### Wizard mágico (pasos en orden)
1. **Datos del evento** — nombre, edad, fecha, lugar
2. **Regalos** — Genio recomienda 3-5; si añaden más se cabrea. Para cada regalo: descripción + link/tienda → sistema propone 3 proveedores → padres eligen
3. **Invitados** — número de invitados, gestión de menús e intolerancias alimentarias
4. **Videoinvitación** — descripción del personaje (princesa, guerrero, superhéroe...) → prompt sofisticado → Remotion genera animación
5. **Proveedor del evento** — donde se celebra, gestión integral con el local

### Página pública (shareable)
1. Videoinvitación (primero y protagonista)
2. Módulo de regalos (aportaciones dinerarias)
3. RSVP (confirmación asistencia + intolerancias + preferencias menú)
4. Mapa Google Maps del lugar

### Genio del S.XXI
- Aspecto: gafas de sol, chupa de cuero, pantalones vaqueros
- Cansado de ver niños hiperregalados
- Da recomendaciones en el wizard para simplificar
- Se cabrea progresivamente si se añaden >5 regalos

## Archivos clave existentes
- `platform/src/app/page.tsx` — landing actual (345 líneas, eventoo branding, necesita rediseño total)
- `platform/src/app/(platform)/dashboard/page.tsx` — dashboard (147 líneas)
- `platform/src/app/(platform)/dashboard/eventos/[id]/invitaciones/VideoWizardClient.tsx` — wizard actual
- `platform/src/app/(platform)/dashboard/eventos/nuevo/page.tsx` — creación de evento
- `platform/src/app/e/[slug]/page.tsx` — página pública actual
- `platform/src/db/schema.ts` — schema completo (users, events, wishLists, wishItems, contributions, guests, videoInvitations)
- `platform/src/remotion/InvitacionComposition.tsx` — composición Remotion existente
- `platform/src/components/InvitacionPlayer.tsx` — player Remotion

## Stack técnico
- Next.js 15.5.14 (App Router)
- Clerk (auth)
- Drizzle ORM + Neon PostgreSQL
- Stripe (pagos en regalos colectivos)
- Remotion (videoinvitaciones browser-side)
- Resend (email)
- Cloudflare R2 (media, pendiente configurar)
- Vercel (deploy)

## Next Steps al resumir
1. Rediseñar `platform/src/app/page.tsx` — landing cinematográfica Cumplefy
2. Crear componente Genio SVG animado
3. Rediseñar wizard en `VideoWizardClient.tsx` con los 5 nuevos pasos
4. Rediseñar página pública `platform/src/app/e/[slug]/page.tsx`
5. Actualizar branding eventoo → Cumplefy en toda la app
6. Commit + push → Vercel auto-despliega
