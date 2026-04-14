import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  date,
  time,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  bigserial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro"]);

export const eventTypeEnum = pgEnum("event_type", [
  "birthday", "wedding", "graduation", "bachelor",
  "communion", "baptism", "christmas", "corporate", "other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft", "published", "archived",
]);

export const eventPaymentStatusEnum = pgEnum("event_payment_status", [
  "unpaid", "paid",
]);

export const hostRoleEnum = pgEnum("host_role", [
  "owner", "cohost", "viewer", "operator",
]);

export const guestStatusEnum = pgEnum("guest_status", [
  "pending", "invited", "confirmed", "declined", "waitlist", "checked_in",
]);

export const menuTypeEnum = pgEnum("menu_type", [
  "adult", "child", "vegan", "vegetarian", "gluten_free", "other",
]);

export const giftListTypeEnum = pgEnum("gift_list_type", [
  "wishlist", "fund", "free",
]);

export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending", "paid", "failed", "refunded",
]);

export const videoStatusEnum = pgEnum("video_status", [
  "pending", "queued", "rendering", "ready", "failed",
]);

export const videoFormatEnum = pgEnum("video_format", [
  "vertical", "horizontal", "square",
]);

export const faceSwapStatusEnum = pgEnum("face_swap_status", [
  "pending", "processing", "done", "failed", "biometric_deleted",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "invite", "rsvp_reminder", "rsvp_confirm", "gift_thanks",
  "day_reminder", "custom",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email", "whatsapp", "sms",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending", "sent", "delivered", "failed",
]);

export const checkInMethodEnum = pgEnum("check_in_method", [
  "qr", "manual",
]);

export const itineraryItemTypeEnum = pgEnum("itinerary_item_type", [
  "ceremony", "reception", "dinner", "dance", "speech",
  "cake", "games", "photo", "transport", "other",
]);

// Commerce enums
export const productTypeEnum = pgEnum("product_type", [
  "POD_2D_APPAREL", "POD_2D_ACCESSORY", "POD_2D_PRINT",
  "POD_3D_DECOR", "POD_3D_FIGURE", "POD_3D_GIFT", "CUSTOM_ONE_OFF",
]);

export const productStatusEnum = pgEnum("product_status", [
  "draft", "active", "archived",
]);

export const storeVisibilityEnum = pgEnum("store_visibility", [
  "public", "guests_only", "vip_only",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "draft", "pending_payment", "paid", "in_production",
  "shipped", "delivered", "failed", "canceled", "refunded",
]);

export const eventPhotoStatusEnum = pgEnum("event_photo_status", [
  "pending", "approved", "rejected",
]);

export const personalizationFieldTypeEnum = pgEnum("personalization_field_type", [
  "text", "multiline_text", "select", "color", "size",
  "date", "image_upload", "logo_upload", "finish", "material", "free_instructions",
]);

// ─────────────────────────────────────────────────────────────────────────────
// USERS — sincronizado desde Clerk via webhook
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:                       text("id").primaryKey(), // clerk_user_id
  email:                    text("email").notNull(),
  name:                     text("name"),
  avatarUrl:                text("avatar_url"),
  plan:                     planEnum("plan").default("free").notNull(),
  stripeCustomerId:         text("stripe_customer_id"),
  stripeConnectId:          text("stripe_connect_id"),
  stripeConnectOnboarded:   boolean("stripe_connect_onboarded").default(false).notNull(),
  createdAt:                timestamp("created_at").defaultNow().notNull(),
  updatedAt:                timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────
export const events = pgTable("events", {
  id:           uuid("id").defaultRandom().primaryKey(),
  ownerId:      text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug:         text("slug").notNull(),

  // Nombre del evento y protagonista
  title:         text("title").notNull(),
  celebrantName: text("celebrant_name").notNull().default(""),
  celebrantAge:  integer("celebrant_age"),
  type:          eventTypeEnum("type").notNull(),
  status:        eventStatusEnum("status").default("draft").notNull(),

  // Fecha y lugar
  eventDate:    date("event_date"),
  eventTime:    time("event_time"),
  endDate:      date("end_date"),
  endTime:      time("end_time"),
  timezone:     text("timezone").default("Europe/Madrid").notNull(),
  venue:        text("venue"),           // nombre del lugar
  venueAddress: text("venue_address"),
  venueLat:     decimal("venue_lat", { precision: 10, scale: 8 }),
  venueLng:     decimal("venue_lng", { precision: 11, scale: 8 }),

  // Contenido
  description:  text("description"),
  dressCode:    text("dress_code"),
  coverUrl:     text("cover_url"),
  branding:     jsonb("branding").$type<{
    primaryColor?: string;
    accentColor?: string;
    font?: string;
    logoUrl?: string;
  }>().default({}),

  // RSVP y regalos
  isPublic:     boolean("is_public").default(true).notNull(),
  allowRsvp:    boolean("allow_rsvp").default(true).notNull(),
  allowGifts:   boolean("allow_gifts").default(true).notNull(),
  rsvpDeadline: timestamp("rsvp_deadline"),
  rsvpSettings: jsonb("rsvp_settings").$type<{
    allowPlusOne?: boolean;
    allowChildren?: boolean;
    askTransport?: boolean;
    askAccommodation?: boolean;
    askMenu?: boolean;
    customQuestions?: Array<{
      id: string;
      label: string;
      type: "text" | "boolean" | "select";
      options?: string[];
      required?: boolean;
    }>;
  }>().default({}),

  maxGuests:    integer("max_guests"),
  accessCode:   text("access_code"), // hashed, para eventos privados

  // Pago (modelo pay-per-event)
  paymentStatus:         eventPaymentStatusEnum("payment_status").default("unpaid").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt:                timestamp("paid_at"),

  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("events_slug_idx").on(t.slug),
  index("events_owner_idx").on(t.ownerId),
  index("events_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EVENT HOSTS — co-organizadores
// ─────────────────────────────────────────────────────────────────────────────
export const eventHosts = pgTable("event_hosts", {
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId:  text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role:    hostRoleEnum("role").default("viewer").notNull(),
}, (t) => [
  index("event_hosts_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// GUEST GROUPS — unidad familiar
// ─────────────────────────────────────────────────────────────────────────────
export const guestGroups = pgTable("guest_groups", {
  id:      uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name:    text("name").notNull(),
}, (t) => [
  index("guest_groups_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// GUESTS
// ─────────────────────────────────────────────────────────────────────────────
export const guests = pgTable("guests", {
  id:          uuid("id").defaultRandom().primaryKey(),
  eventId:     uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  groupId:     uuid("group_id").references(() => guestGroups.id, { onDelete: "set null" }),

  name:        text("name").notNull(),
  email:       text("email"),
  phone:       text("phone"),

  status:      guestStatusEnum("status").default("pending").notNull(),
  isChild:     boolean("is_child").default(false).notNull(),
  tags:        text("tags").array().default([]),
  notes:       text("notes"),

  inviteToken: text("invite_token").notNull().$defaultFn(() =>
    crypto.randomUUID().replace(/-/g, "")
  ),
  invitedAt:   timestamp("invited_at"),

  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("guests_token_idx").on(t.inviteToken),
  index("guests_event_idx").on(t.eventId),
  index("guests_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// RSVP RESPONSES
// ─────────────────────────────────────────────────────────────────────────────
export const rsvpResponses = pgTable("rsvp_responses", {
  id:      uuid("id").defaultRandom().primaryKey(),
  guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),

  attending: boolean("attending").notNull(),

  // Acompañante
  plusOneAttending: boolean("plus_one_attending").default(false),
  plusOneName:      text("plus_one_name"),
  childrenCount:    integer("children_count").default(0),

  // Menú y dieta
  menuChoiceId:  uuid("menu_choice_id"),
  dietaryNotes:  text("dietary_notes"),
  allergies:     text("allergies").array().default([]),

  // Extras
  transportNeeded:     boolean("transport_needed").default(false),
  accommodationNeeded: boolean("accommodation_needed").default(false),
  messageToHost:       text("message_to_host"),

  // Respuestas personalizadas { questionId: answer }
  customAnswers: jsonb("custom_answers").$type<Record<string, string | boolean>>().default({}),

  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("rsvp_guest_idx").on(t.guestId),
  index("rsvp_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MENUS — opciones de menú por evento
// ─────────────────────────────────────────────────────────────────────────────
export const menus = pgTable("menus", {
  id:          uuid("id").defaultRandom().primaryKey(),
  eventId:     uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  type:        menuTypeEnum("type"),
  isDefault:   boolean("is_default").default(false).notNull(),
  sortOrder:   integer("sort_order").default(0).notNull(),
}, (t) => [
  index("menus_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// GIFT LISTS — lista de regalos / fondo común
// ─────────────────────────────────────────────────────────────────────────────
export const giftLists = pgTable("gift_lists", {
  id:               uuid("id").defaultRandom().primaryKey(),
  eventId:          uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title:            text("title").notNull(),
  description:      text("description"),
  type:             giftListTypeEnum("type").default("wishlist").notNull(),
  targetAmount:     integer("target_amount"),    // en céntimos (para fondos)
  collectedAmount:  integer("collected_amount").default(0).notNull(), // en céntimos
  isPublic:         boolean("is_public").default(true).notNull(),
  showContributors: boolean("show_contributors").default(true).notNull(),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("gift_lists_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// GIFT ITEMS — artículos de la lista
// ─────────────────────────────────────────────────────────────────────────────
export const giftItems = pgTable("gift_items", {
  id:             uuid("id").defaultRandom().primaryKey(),
  giftListId:     uuid("gift_list_id").notNull().references(() => giftLists.id, { onDelete: "cascade" }),
  title:          text("title").notNull(),
  description:    text("description"),
  price:          integer("price"),          // en céntimos
  url:            text("url"),               // enlace afiliado / tienda
  imageUrl:       text("image_url"),
  quantityWanted: integer("quantity_wanted").default(1).notNull(),
  quantityTaken:  integer("quantity_taken").default(0).notNull(),
  isAvailable:    boolean("is_available").default(true).notNull(),
  sortOrder:      integer("sort_order").default(0).notNull(),
}, (t) => [
  index("gift_items_list_idx").on(t.giftListId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTIONS — aportaciones a regalos / fondos
// ─────────────────────────────────────────────────────────────────────────────
export const contributions = pgTable("contributions", {
  id:              uuid("id").defaultRandom().primaryKey(),
  giftListId:      uuid("gift_list_id").notNull().references(() => giftLists.id),
  giftItemId:      uuid("gift_item_id").references(() => giftItems.id),
  guestId:         uuid("guest_id").references(() => guests.id),

  contributorName:  text("contributor_name"),
  amount:           integer("amount").notNull(),     // en céntimos (lo que paga el invitado)
  netAmount:        integer("net_amount"),           // después de comisiones
  platformFee:      integer("platform_fee"),         // 3% nuestra comisión (céntimos)
  message:          text("message"),
  isAnonymous:      boolean("is_anonymous").default(false).notNull(),

  // Pagos
  paymentStatus:           contributionStatusEnum("payment_status").default("pending").notNull(),
  paymentMethod:           text("payment_method"),   // stripe | bizum
  stripePaymentIntentId:   text("stripe_payment_intent_id"),
  stripeTransferId:        text("stripe_transfer_id"), // para Stripe Connect payout
  paidAt:                  timestamp("paid_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("contributions_list_idx").on(t.giftListId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO INVITATIONS — videoinvitaciones cinematográficas
// ─────────────────────────────────────────────────────────────────────────────
export const videoInvitations = pgTable("video_invitations", {
  id:      uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),

  // Configuración del vídeo
  theme:         text("theme").notNull(),  // cinematic_birthday, epic_wedding, etc.
  protagonistType: text("protagonist_type").notNull(), // adult | baby | group
  scriptText:    text("script_text"),     // texto que "dice" el protagonista
  voiceId:       text("voice_id"),        // ElevenLabs voice ID
  musicTrack:    text("music_track"),
  lut:           text("lut"),             // color grading LUT
  durationSec:   integer("duration_sec").default(60),

  // Assets subidos por el organizador (Cloudflare R2 keys)
  protagonistImageKey: text("protagonist_image_key"),
  additionalPhotoKeys: text("additional_photo_keys").array().default([]),

  customization: jsonb("customization").$type<{
    colors?: { primary?: string; accent?: string };
    titleText?: string;
    subtitleText?: string;
    closingText?: string;
  }>().default({}),

  // Estado del pipeline
  status: videoStatusEnum("status").default("pending").notNull(),

  // Resultados (Cloudflare R2 URLs)
  videoUrlVertical:   text("video_url_vertical"),   // 9:16
  videoUrlHorizontal: text("video_url_horizontal"), // 16:9
  videoUrlSquare:     text("video_url_square"),     // 1:1
  thumbnailUrl:       text("thumbnail_url"),

  // Jobs
  n8nWorkflowId:  text("n8n_workflow_id"),
  falJobId:       text("fal_job_id"),
  renderError:    text("render_error"),
  renderStarted:  timestamp("render_started"),
  renderDone:     timestamp("render_done"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("video_inv_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// FACE SWAP JOBS — lipsync baby + face swap (GDPR compliant)
// ─────────────────────────────────────────────────────────────────────────────
export const faceSwapJobs = pgTable("face_swap_jobs", {
  id:      uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id),

  // Consentimiento explícito (RGPD Art. 9 — datos biométricos)
  honoreeName:   text("honoree_name").notNull(),
  consentText:   text("consent_text").notNull(),  // texto íntegro en el momento
  consentedBy:   text("consented_by").notNull(),  // nombre del organizador
  consentedAt:   timestamp("consented_at").notNull(),
  consentIp:     text("consent_ip"),

  // Assets temporales (borrados post-proceso)
  sourceImageR2Key: text("source_image_r2_key"),
  targetCharacter:  text("target_character").notNull(),

  // Estado
  status: faceSwapStatusEnum("status").default("pending").notNull(),

  // Resultados
  resultR2Key:    text("result_r2_key"),
  resultUrl:      text("result_url"),
  replicateJobId: text("replicate_job_id"),
  falJobId:       text("fal_job_id"),

  // Compliance — borrado automático
  biometricDeletedAt: timestamp("biometric_deleted_at"),
  retentionDays:      integer("retention_days").default(30).notNull(),
  autoDeleteAt:       timestamp("auto_delete_at"),

  errorMessage: text("error_message"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("face_swap_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — invitaciones, recordatorios, agradecimientos
// ─────────────────────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id:      uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").references(() => guests.id, { onDelete: "cascade" }),

  type:    notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  status:  notificationStatusEnum("status").default("pending").notNull(),

  subject: text("subject"),
  content: jsonb("content").$type<Record<string, unknown>>(),

  scheduledAt: timestamp("scheduled_at"),
  sentAt:      timestamp("sent_at"),
  resendId:    text("resend_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_event_idx").on(t.eventId),
  index("notifications_guest_idx").on(t.guestId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// CHECK-INS — día del evento
// ─────────────────────────────────────────────────────────────────────────────
export const checkIns = pgTable("check_ins", {
  id:           uuid("id").defaultRandom().primaryKey(),
  eventId:      uuid("event_id").notNull().references(() => events.id),
  guestId:      uuid("guest_id").notNull().references(() => guests.id),
  checkedInAt:  timestamp("checked_in_at").defaultNow().notNull(),
  method:       checkInMethodEnum("method").default("qr").notNull(),
  operatorId:   text("operator_id").references(() => users.id),
  notes:        text("notes"),
}, (t) => [
  uniqueIndex("check_ins_unique_idx").on(t.eventId, t.guestId),
  index("check_ins_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EVENT ITINERARY — programa del evento
// ─────────────────────────────────────────────────────────────────────────────
export const eventItinerary = pgTable("event_itinerary", {
  id:          uuid("id").defaultRandom().primaryKey(),
  eventId:     uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  time:        text("time").notNull(),       // "18:00"
  title:       text("title").notNull(),
  description: text("description"),
  type:        itineraryItemTypeEnum("type").default("other").notNull(),
  icon:        text("icon"),                 // emoji override
  sortOrder:   integer("sort_order").default(0).notNull(),
}, (t) => [
  index("itinerary_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EVENT BUDGET ITEMS — calculadora de presupuesto y control de gastos
// ─────────────────────────────────────────────────────────────────────────────
export const eventBudgetItems = pgTable("event_budget_items", {
  id:            uuid("id").defaultRandom().primaryKey(),
  eventId:       uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  category:      text("category").notNull().default("other"),
  name:          text("name").notNull(),
  vendor:        text("vendor"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost:    decimal("actual_cost", { precision: 10, scale: 2 }),
  notes:         text("notes"),
  isPaid:        boolean("is_paid").notNull().default(false),
  sortOrder:     integer("sort_order").notNull().default(0),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("budget_items_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG — trazabilidad de acciones
// ─────────────────────────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id:         bigserial("id", { mode: "number" }).primaryKey(),
  userId:     text("user_id"),
  eventId:    uuid("event_id"),
  action:     text("action").notNull(),
  entityType: text("entity_type"),
  entityId:   text("entity_id"),
  payload:    jsonb("payload").$type<Record<string, unknown>>(),
  ip:         text("ip"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("audit_log_user_idx").on(t.userId),
  index("audit_log_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EVENT STORES — tienda del evento (commerce embebido)
// ─────────────────────────────────────────────────────────────────────────────
export const eventStores = pgTable("event_stores", {
  id:          uuid("id").defaultRandom().primaryKey(),
  eventId:     uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  isActive:    boolean("is_active").default(false).notNull(),
  title:       text("title"),              // "Merch del evento" o personalizado
  description: text("description"),
  currency:    text("currency").default("EUR").notNull(),
  visibility:  storeVisibilityEnum("visibility").default("public").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("event_stores_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id:             uuid("id").defaultRandom().primaryKey(),
  storeId:        uuid("store_id").notNull().references(() => eventStores.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  description:    text("description"),
  type:           productTypeEnum("type").notNull(),
  status:         productStatusEnum("status").default("draft").notNull(),
  requiresQuote:  boolean("requires_quote").default(false).notNull(),  // para 3D
  sortOrder:      integer("sort_order").default(0).notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("products_store_idx").on(t.storeId),
  index("products_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT ASSETS — mockups, previews, production files
// ─────────────────────────────────────────────────────────────────────────────
export const productAssets = pgTable("product_assets", {
  id:        uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type:      text("type").notNull(),  // preview|mockup|production|template
  url:       text("url").notNull(),
  r2Key:     text("r2_key"),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [
  index("product_assets_product_idx").on(t.productId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT PERSONALIZATION SCHEMAS — campos dinámicos de personalización
// ─────────────────────────────────────────────────────────────────────────────
export const productPersonalizationSchemas = pgTable("product_personalization_schemas", {
  id:           uuid("id").defaultRandom().primaryKey(),
  productId:    uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  fieldKey:     text("field_key").notNull(),   // "nombre", "fecha", "foto"
  fieldType:    personalizationFieldTypeEnum("field_type").notNull(),
  label:        text("label").notNull(),
  placeholder:  text("placeholder"),
  isRequired:   boolean("is_required").default(false).notNull(),
  options:      jsonb("options").$type<Array<{ value: string; label: string }>>(),
  sortOrder:    integer("sort_order").default(0).notNull(),
}, (t) => [
  index("pers_schema_product_idx").on(t.productId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT VARIANTS — tallas, colores, materiales
// ─────────────────────────────────────────────────────────────────────────────
export const productVariants = pgTable("product_variants", {
  id:                   uuid("id").defaultRandom().primaryKey(),
  productId:            uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku:                  text("sku"),
  name:                 text("name").notNull(),   // "Talla M - Azul"
  attributes:           jsonb("attributes").$type<Record<string, string>>().default({}),
  priceCents:           integer("price_cents").notNull(),
  compareAtPriceCents:  integer("compare_at_price_cents"),
  isAvailable:          boolean("is_available").default(true).notNull(),
}, (t) => [
  index("variants_product_idx").on(t.productId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// CARTS
// ─────────────────────────────────────────────────────────────────────────────
export const carts = pgTable("carts", {
  id:         uuid("id").defaultRandom().primaryKey(),
  eventId:    uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  guestEmail: text("guest_email"),
  guestName:  text("guest_name"),
  expiresAt:  timestamp("expires_at"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("carts_event_idx").on(t.eventId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// CART ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const cartItems = pgTable("cart_items", {
  id:               uuid("id").defaultRandom().primaryKey(),
  cartId:           uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  variantId:        uuid("variant_id").notNull().references(() => productVariants.id),
  quantity:         integer("quantity").default(1).notNull(),
  unitPriceCents:   integer("unit_price_cents").notNull(),
  personalization:  jsonb("personalization").$type<Record<string, string>>().default({}),
}, (t) => [
  index("cart_items_cart_idx").on(t.cartId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS — pedidos de la tienda
// ─────────────────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id:                     uuid("id").defaultRandom().primaryKey(),
  eventId:                uuid("event_id").notNull().references(() => events.id),
  storeId:                uuid("store_id").notNull().references(() => eventStores.id),
  guestEmail:             text("guest_email"),
  guestName:              text("guest_name"),
  guestPhone:             text("guest_phone"),
  status:                 orderStatusEnum("status").default("draft").notNull(),
  subtotalCents:          integer("subtotal_cents").notNull(),
  shippingCents:          integer("shipping_cents").default(0).notNull(),
  taxCents:               integer("tax_cents").default(0).notNull(),
  totalCents:             integer("total_cents").notNull(),
  shippingAddress:        jsonb("shipping_address").$type<{
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  }>(),
  stripePaymentIntentId:  text("stripe_payment_intent_id"),
  notes:                  text("notes"),
  paidAt:                 timestamp("paid_at"),
  createdAt:              timestamp("created_at").defaultNow().notNull(),
  updatedAt:              timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("orders_event_idx").on(t.eventId),
  index("orders_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS — líneas de pedido
// ─────────────────────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id:               uuid("id").defaultRandom().primaryKey(),
  orderId:          uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId:        uuid("product_id").notNull().references(() => products.id),
  variantId:        uuid("variant_id").references(() => productVariants.id),
  quantity:         integer("quantity").notNull(),
  unitPriceCents:   integer("unit_price_cents").notNull(),
  productName:      text("product_name").notNull(),    // snapshot
  variantName:      text("variant_name"),
  personalization:  jsonb("personalization").$type<Record<string, string>>().default({}),
}, (t) => [
  index("order_items_order_idx").on(t.orderId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// EVENT PHOTOS — fotos épicas subidas por invitados (Momentos Épicos)
// ─────────────────────────────────────────────────────────────────────────────
export const eventPhotos = pgTable("event_photos", {
  id:             uuid("id").defaultRandom().primaryKey(),
  eventId:        uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  url:            text("url").notNull(),          // R2 public URL
  r2Key:          text("r2_key"),                 // for deletion
  guestName:      text("guest_name"),             // nombre del invitado
  guestEmail:     text("guest_email"),
  caption:        text("caption"),
  likes:          integer("likes").default(0).notNull(),
  status:         eventPhotoStatusEnum("status").default("pending").notNull(),
  usedForProduct: boolean("used_for_product").default(false).notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("event_photos_event_idx").on(t.eventId),
  index("event_photos_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  events:     many(events),
  eventHosts: many(eventHosts),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  owner:           one(users, { fields: [events.ownerId], references: [users.id] }),
  hosts:           many(eventHosts),
  guestGroups:     many(guestGroups),
  guests:          many(guests),
  rsvpResponses:   many(rsvpResponses),
  menus:           many(menus),
  giftLists:       many(giftLists),
  videoInvitations: many(videoInvitations),
  videoProjects:   many(videoProjects),
  faceSwapJobs:    many(faceSwapJobs),
  notifications:   many(notifications),
  checkIns:        many(checkIns),
  itinerary:       many(eventItinerary),
  budgetItems:     many(eventBudgetItems),
  store:           one(eventStores, { fields: [events.id], references: [eventStores.eventId] }),
  carts:           many(carts),
  orders:          many(orders),
  photos:          many(eventPhotos),
}));

export const eventHostsRelations = relations(eventHosts, ({ one }) => ({
  event: one(events, { fields: [eventHosts.eventId], references: [events.id] }),
  user:  one(users,  { fields: [eventHosts.userId],  references: [users.id] }),
}));

export const guestGroupsRelations = relations(guestGroups, ({ one, many }) => ({
  event:  one(events, { fields: [guestGroups.eventId], references: [events.id] }),
  guests: many(guests),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  event:        one(events, { fields: [guests.eventId], references: [events.id] }),
  group:        one(guestGroups, { fields: [guests.groupId], references: [guestGroups.id] }),
  rsvpResponse: one(rsvpResponses, { fields: [guests.id], references: [rsvpResponses.guestId] }),
  contributions: many(contributions),
  notifications: many(notifications),
  checkIn:      one(checkIns, { fields: [guests.id], references: [checkIns.guestId] }),
}));

export const rsvpResponsesRelations = relations(rsvpResponses, ({ one }) => ({
  guest: one(guests, { fields: [rsvpResponses.guestId], references: [guests.id] }),
  event: one(events, { fields: [rsvpResponses.eventId], references: [events.id] }),
  menu:  one(menus,  { fields: [rsvpResponses.menuChoiceId], references: [menus.id] }),
}));

export const menusRelations = relations(menus, ({ one }) => ({
  event: one(events, { fields: [menus.eventId], references: [events.id] }),
}));

export const giftListsRelations = relations(giftLists, ({ one, many }) => ({
  event:         one(events, { fields: [giftLists.eventId], references: [events.id] }),
  items:         many(giftItems),
  contributions: many(contributions),
}));

export const giftItemsRelations = relations(giftItems, ({ one, many }) => ({
  giftList:      one(giftLists, { fields: [giftItems.giftListId], references: [giftLists.id] }),
  contributions: many(contributions),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  giftList: one(giftLists, { fields: [contributions.giftListId], references: [giftLists.id] }),
  giftItem: one(giftItems, { fields: [contributions.giftItemId], references: [giftItems.id] }),
  guest:    one(guests,    { fields: [contributions.guestId],    references: [guests.id] }),
}));

export const videoInvitationsRelations = relations(videoInvitations, ({ one }) => ({
  event: one(events, { fields: [videoInvitations.eventId], references: [events.id] }),
}));

export const faceSwapJobsRelations = relations(faceSwapJobs, ({ one }) => ({
  event: one(events, { fields: [faceSwapJobs.eventId], references: [events.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  event: one(events, { fields: [notifications.eventId], references: [events.id] }),
  guest: one(guests, { fields: [notifications.guestId], references: [guests.id] }),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  event:    one(events, { fields: [checkIns.eventId], references: [events.id] }),
  guest:    one(guests, { fields: [checkIns.guestId], references: [guests.id] }),
  operator: one(users,  { fields: [checkIns.operatorId], references: [users.id] }),
}));

export const eventItineraryRelations = relations(eventItinerary, ({ one }) => ({
  event: one(events, { fields: [eventItinerary.eventId], references: [events.id] }),
}));

export const eventBudgetItemsRelations = relations(eventBudgetItems, ({ one }) => ({
  event: one(events, { fields: [eventBudgetItems.eventId], references: [events.id] }),
}));

export const eventStoresRelations = relations(eventStores, ({ one, many }) => ({
  event:    one(events, { fields: [eventStores.eventId], references: [events.id] }),
  products: many(products),
  orders:   many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store:                 one(eventStores, { fields: [products.storeId], references: [eventStores.id] }),
  assets:                many(productAssets),
  personalizationSchema: many(productPersonalizationSchemas),
  variants:              many(productVariants),
  orderItems:            many(orderItems),
}));

export const productAssetsRelations = relations(productAssets, ({ one }) => ({
  product: one(products, { fields: [productAssets.productId], references: [products.id] }),
}));

export const productPersonalizationSchemasRelations = relations(productPersonalizationSchemas, ({ one }) => ({
  product: one(products, { fields: [productPersonalizationSchemas.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product:    one(products, { fields: [productVariants.productId], references: [products.id] }),
  cartItems:  many(cartItems),
  orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  event: one(events, { fields: [carts.eventId], references: [events.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart:    one(carts,           { fields: [cartItems.cartId],    references: [carts.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  event: one(events,       { fields: [orders.eventId],  references: [events.id] }),
  store: one(eventStores,  { fields: [orders.storeId],  references: [eventStores.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order:   one(orders,          { fields: [orderItems.orderId],    references: [orders.id] }),
  product: one(products,        { fields: [orderItems.productId],  references: [products.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId],  references: [productVariants.id] }),
}));

export const eventPhotosRelations = relations(eventPhotos, ({ one }) => ({
  event: one(events, { fields: [eventPhotos.eventId], references: [events.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO INVITATION PROJECTS — nuevo sistema IA (Seedance 2.0 + Kling 3.0)
// Reemplaza la tabla video_invitations (deprecated, mantenida por compat)
// ─────────────────────────────────────────────────────────────────────────────

export const videoProjectModeEnum = pgEnum("video_project_mode", [
  "visual",    // imagen → vídeo cinematográfico (Seedance 2.0)
  "lipsync",   // imagen + audio → talking head (InfiniteTalk)
]);

export const videoProjectStatusEnum = pgEnum("video_project_status", [
  "draft",
  "assets_uploaded",
  "prompt_compiled",
  "preview_queued",
  "preview_processing",
  "preview_ready",
  "preview_failed",
  "awaiting_approval",
  "approved_for_final",
  "final_queued",
  "final_processing",
  "final_ready",
  "final_failed",
  "published",
]);

export const generationJobKindEnum = pgEnum("generation_job_kind", [
  "preview", "final",
]);

export const generationJobStatusEnum = pgEnum("generation_job_status", [
  "queued", "processing", "ready", "failed",
]);

export const videoAssetKindEnum = pgEnum("video_asset_kind", [
  "protagonist_image", "audio", "preview_video", "final_video", "thumbnail",
]);

// ── Proyectos de videoinvitación ─────────────────────────────────────────────
export const videoProjects = pgTable("video_projects", {
  id:      uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),

  // Modo de generación
  mode:    videoProjectModeEnum("mode").default("visual").notNull(),

  // Inputs del wizard
  protagonistName:          text("protagonist_name").notNull().default(""),
  protagonistDescription:   text("protagonist_description"),
  transformationDescription: text("transformation_description"),
  sceneDescription:         text("scene_description"),
  styleDescription:         text("style_description"),
  language:                 text("language").default("es").notNull(),
  durationSeconds:          integer("duration_seconds").default(8).notNull(),
  aspectRatio:              text("aspect_ratio").default("9:16").notNull(), // "9:16" | "16:9" | "1:1"

  // Assets (Supabase Storage paths)
  protagonistImagePath: text("protagonist_image_path"),  // bucket path
  protagonistImageUrl:  text("protagonist_image_url"),   // public URL
  audioPath:            text("audio_path"),
  audioUrl:             text("audio_url"),

  // Estado de la máquina de estados
  status: videoProjectStatusEnum("status").default("draft").notNull(),

  // Resultados finales
  previewVideoUrl: text("preview_video_url"),
  finalVideoUrl:   text("final_video_url"),
  thumbnailUrl:    text("thumbnail_url"),
  publishedAt:     timestamp("published_at"),

  // Límites
  regenerationCount: integer("regeneration_count").default(0).notNull(),
  maxRegenerations:  integer("max_regenerations").default(3).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("video_projects_event_idx").on(t.eventId),
  index("video_projects_status_idx").on(t.status),
]);

// ── Versiones de prompt — inmutables una vez enviadas a Kie ──────────────────
export const promptVersions = pgTable("prompt_versions", {
  id:        uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),

  kind:           generationJobKindEnum("kind").notNull(), // preview | final
  visualPrompt:   text("visual_prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  model:          text("model").notNull(),  // "bytedance/seedance-2" | "kling-3.0/video"

  // Snapshot de los inputs en el momento de compilar
  inputSnapshot: jsonb("input_snapshot").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("prompt_versions_project_idx").on(t.projectId),
]);

// ── Jobs de generación — uno por cada llamada a Kie.ai ──────────────────────
export const generationJobs = pgTable("generation_jobs", {
  id:        uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  promptVersionId: uuid("prompt_version_id").references(() => promptVersions.id),

  kind:    generationJobKindEnum("kind").notNull(),
  status:  generationJobStatusEnum("status").default("queued").notNull(),

  // Kie.ai
  provider:       text("provider").default("kie").notNull(),
  providerModel:  text("provider_model").notNull(),  // "bytedance/seedance-2"
  providerTaskId: text("provider_task_id"),          // taskId devuelto por Kie

  // Payloads para auditoría
  requestPayload:  jsonb("request_payload").$type<Record<string, unknown>>(),
  callbackPayload: jsonb("callback_payload").$type<Record<string, unknown>>(),

  // Resultado
  resultVideoUrl: text("result_video_url"),  // URL temporal de Kie (expira)
  storedVideoPath: text("stored_video_path"), // path en Supabase Storage

  errorMessage: text("error_message"),

  startedAt:   timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("gen_jobs_project_idx").on(t.projectId),
  index("gen_jobs_task_id_idx").on(t.providerTaskId),
  index("gen_jobs_status_idx").on(t.status),
]);

// ── Assets de vídeo — archivos propios almacenados en Supabase ───────────────
export const videoAssets = pgTable("video_assets", {
  id:        uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  jobId:     uuid("job_id").references(() => generationJobs.id),

  kind:      videoAssetKindEnum("kind").notNull(),
  storagePath: text("storage_path").notNull(),  // Supabase Storage path
  publicUrl:   text("public_url").notNull(),
  mimeType:    text("mime_type"),
  sizeBytes:   integer("size_bytes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("video_assets_project_idx").on(t.projectId),
]);

// ── Relaciones ────────────────────────────────────────────────────────────────
export const videoProjectsRelations = relations(videoProjects, ({ one, many }) => ({
  event:         one(events,          { fields: [videoProjects.eventId],  references: [events.id] }),
  promptVersions: many(promptVersions),
  generationJobs: many(generationJobs),
  videoAssets:    many(videoAssets),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one, many }) => ({
  project: one(videoProjects, { fields: [promptVersions.projectId], references: [videoProjects.id] }),
  jobs:    many(generationJobs),
}));

export const generationJobsRelations = relations(generationJobs, ({ one, many }) => ({
  project:       one(videoProjects,  { fields: [generationJobs.projectId],       references: [videoProjects.id] }),
  promptVersion: one(promptVersions, { fields: [generationJobs.promptVersionId], references: [promptVersions.id] }),
  assets:        many(videoAssets),
}));

export const videoAssetsRelations = relations(videoAssets, ({ one }) => ({
  project: one(videoProjects,  { fields: [videoAssets.projectId], references: [videoProjects.id] }),
  job:     one(generationJobs, { fields: [videoAssets.jobId],     references: [generationJobs.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export type User              = typeof users.$inferSelect;
export type NewUser           = typeof users.$inferInsert;
export type Event             = typeof events.$inferSelect;
export type NewEvent          = typeof events.$inferInsert;
export type EventHost         = typeof eventHosts.$inferSelect;
export type GuestGroup        = typeof guestGroups.$inferSelect;
export type Guest             = typeof guests.$inferSelect;
export type NewGuest          = typeof guests.$inferInsert;
export type RsvpResponse      = typeof rsvpResponses.$inferSelect;
export type NewRsvpResponse   = typeof rsvpResponses.$inferInsert;
export type Menu              = typeof menus.$inferSelect;
export type NewMenu           = typeof menus.$inferInsert;
export type GiftList          = typeof giftLists.$inferSelect;
export type NewGiftList       = typeof giftLists.$inferInsert;
export type GiftItem          = typeof giftItems.$inferSelect;
export type NewGiftItem       = typeof giftItems.$inferInsert;
export type Contribution      = typeof contributions.$inferSelect;
export type NewContribution   = typeof contributions.$inferInsert;
export type VideoInvitation   = typeof videoInvitations.$inferSelect;
export type NewVideoInvitation = typeof videoInvitations.$inferInsert;
export type FaceSwapJob       = typeof faceSwapJobs.$inferSelect;
export type Notification      = typeof notifications.$inferSelect;
export type CheckIn           = typeof checkIns.$inferSelect;
export type EventItineraryItem = typeof eventItinerary.$inferSelect;
export type NewEventItineraryItem = typeof eventItinerary.$inferInsert;
export type EventBudgetItem   = typeof eventBudgetItems.$inferSelect;
export type NewEventBudgetItem = typeof eventBudgetItems.$inferInsert;
export type EventPhoto        = typeof eventPhotos.$inferSelect;
export type NewEventPhoto     = typeof eventPhotos.$inferInsert;

// Video invitation projects (new IA system)
export type VideoProject      = typeof videoProjects.$inferSelect;
export type NewVideoProject   = typeof videoProjects.$inferInsert;
export type PromptVersion     = typeof promptVersions.$inferSelect;
export type NewPromptVersion  = typeof promptVersions.$inferInsert;
export type GenerationJob     = typeof generationJobs.$inferSelect;
export type NewGenerationJob  = typeof generationJobs.$inferInsert;
export type VideoAsset        = typeof videoAssets.$inferSelect;
export type NewVideoAsset     = typeof videoAssets.$inferInsert;

export type VideoProjectStatus = typeof videoProjectStatusEnum.enumValues[number];
export type GenerationJobStatus = typeof generationJobStatusEnum.enumValues[number];
export type VideoProjectMode = typeof videoProjectModeEnum.enumValues[number];
// Commerce
export type EventStore        = typeof eventStores.$inferSelect;
export type NewEventStore     = typeof eventStores.$inferInsert;
export type Product           = typeof products.$inferSelect;
export type NewProduct        = typeof products.$inferInsert;
export type ProductAsset      = typeof productAssets.$inferSelect;
export type NewProductAsset   = typeof productAssets.$inferInsert;
export type ProductPersonalizationSchema = typeof productPersonalizationSchemas.$inferSelect;
export type NewProductPersonalizationSchema = typeof productPersonalizationSchemas.$inferInsert;
export type ProductVariant    = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Cart              = typeof carts.$inferSelect;
export type NewCart           = typeof carts.$inferInsert;
export type CartItem          = typeof cartItems.$inferSelect;
export type NewCartItem       = typeof cartItems.$inferInsert;
export type Order             = typeof orders.$inferSelect;
export type NewOrder          = typeof orders.$inferInsert;
export type OrderItem         = typeof orderItems.$inferSelect;
export type NewOrderItem      = typeof orderItems.$inferInsert;
