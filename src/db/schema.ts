import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user ID
    email: text("email").notNull(),
    name: text("name"),
    plan: text("plan", { enum: ["free", "pro"] }).default("free").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeConnectId: text("stripe_connect_id"), // Stripe Connect Express (for payouts)
    stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(), // public URL: eventoo.es/e/mi-fiesta-2025
    type: text("type", {
      enum: ["cumpleanos", "comunion", "bautizo", "navidad", "graduacion", "otro"],
    }).notNull(),
    celebrantName: text("celebrant_name").notNull(),
    celebrantAge: integer("celebrant_age"),
    eventDate: date("event_date"),
    eventTime: text("event_time"),
    venue: text("venue"),
    venueAddress: text("venue_address"),
    description: text("description"),
    coverImage: text("cover_image"), // Cloudflare R2 URL
    isPublic: boolean("is_public").default(true).notNull(),
    allowRsvp: boolean("allow_rsvp").default(true).notNull(),
    allowGifts: boolean("allow_gifts").default(true).notNull(),
    status: text("status", { enum: ["draft", "active", "past", "archived"] })
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("events_slug_idx").on(t.slug),
    index("events_user_id_idx").on(t.userId),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// WISH LISTS (one per event)
// ─────────────────────────────────────────────────────────────────────────────
export const wishLists = pgTable("wish_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  title: text("title").default("Lista de Regalos").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true).notNull(),
  allowCollective: boolean("allow_collective").default(true).notNull(), // collective gifting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// WISH ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const wishItems = pgTable(
  "wish_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishListId: uuid("wish_list_id")
      .notNull()
      .references(() => wishLists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"), // product link (Amazon, El Corte Inglés, etc.)
    image: text("image"), // scraped or uploaded image
    price: integer("price"), // in euro cents
    // Collective gifting
    isCollective: boolean("is_collective").default(false).notNull(),
    targetAmount: integer("target_amount"), // goal in euro cents
    collectedAmount: integer("collected_amount").default(0).notNull(), // funded in cents
    // Status
    category: text("category", {
      enum: ["juguete", "ropa", "libro", "tecnologia", "experiencia", "deporte", "otro"],
    })
      .default("otro")
      .notNull(),
    priority: text("priority", { enum: ["alta", "media", "baja"] })
      .default("media")
      .notNull(),
    status: text("status", {
      enum: ["available", "partially_funded", "funded", "purchased", "reserved"],
    })
      .default("available")
      .notNull(),
    reservedByName: text("reserved_by_name"), // for non-collective single-buyer reserve
    reservedByEmail: text("reserved_by_email"),
    position: integer("position").default(0).notNull(), // drag-to-reorder
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("wish_items_list_idx").on(t.wishListId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// CONTRIBUTIONS (collective gifting payments)
// ─────────────────────────────────────────────────────────────────────────────
export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishItemId: uuid("wish_item_id")
      .notNull()
      .references(() => wishItems.id, { onDelete: "cascade" }),
    contributorName: text("contributor_name").notNull(),
    contributorEmail: text("contributor_email"),
    amount: integer("amount").notNull(), // in euro cents
    message: text("message"), // optional gift message
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    stripeTransferId: text("stripe_transfer_id"), // for Connect payout
    status: text("status", { enum: ["pending", "completed", "refunded", "failed"] })
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("contributions_item_idx").on(t.wishItemId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// GUESTS
// ─────────────────────────────────────────────────────────────────────────────
export const guests = pgTable(
  "guests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    rsvpStatus: text("rsvp_status", {
      enum: ["pending", "attending", "not_attending", "maybe"],
    })
      .default("pending")
      .notNull(),
    adults: integer("adults").default(1).notNull(),
    children: integer("children").default(0).notNull(),
    dietaryRestrictions: text("dietary_restrictions"),
    notes: text("notes"),
    rsvpToken: text("rsvp_token").unique(), // for one-click RSVP links
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("guests_event_idx").on(t.eventId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO INVITATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const videoInvitations = pgTable("video_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  template: text("template").notNull(), // 'pirata', 'superhero', 'princesa', etc.
  wizardData: text("wizard_data"), // JSON stringified wizard form values
  dijenJobId: text("dijen_job_id"), // Dijen.ai async job ID
  generatedUrl: text("generated_url"), // Cloudflare R2 URL of generated video
  thumbnailUrl: text("thumbnail_url"),
  shareUrl: text("share_url"), // short link for sharing
  status: text("status", {
    enum: ["draft", "generating", "ready", "failed"],
  })
    .default("draft")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS (Pro plan via Stripe)
// ─────────────────────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  plan: text("plan", { enum: ["pro"] }).notNull(),
  status: text("status", {
    enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
  }).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  events: many(events),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(users, { fields: [events.userId], references: [users.id] }),
  wishList: one(wishLists, { fields: [events.id], references: [wishLists.eventId] }),
  guests: many(guests),
  videoInvitations: many(videoInvitations),
}));

export const wishListsRelations = relations(wishLists, ({ one, many }) => ({
  event: one(events, { fields: [wishLists.eventId], references: [events.id] }),
  items: many(wishItems),
}));

export const wishItemsRelations = relations(wishItems, ({ one, many }) => ({
  wishList: one(wishLists, { fields: [wishItems.wishListId], references: [wishLists.id] }),
  contributions: many(contributions),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  wishItem: one(wishItems, {
    fields: [contributions.wishItemId],
    references: [wishItems.id],
  }),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  event: one(events, { fields: [guests.eventId], references: [events.id] }),
}));

export const videoInvitationsRelations = relations(videoInvitations, ({ one }) => ({
  event: one(events, {
    fields: [videoInvitations.eventId],
    references: [events.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS (inferred from schema)
// ─────────────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type WishList = typeof wishLists.$inferSelect;
export type WishItem = typeof wishItems.$inferSelect;
export type NewWishItem = typeof wishItems.$inferInsert;
export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
export type VideoInvitation = typeof videoInvitations.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
