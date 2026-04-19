import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  users, events, contributions, guests,
  videoProjects, generationJobs, auditLog,
} from "@/db/schema";
import { desc, eq, count, sum, and, gte, inArray, sql, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

function ago(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `hace ${mins} min`;
  if (mins < 60 * 24) return `hace ${Math.floor(mins / 60)} h`;
  return `hace ${Math.floor(mins / (60 * 24))} d`;
}

const TYPE_MAP: Record<string, string> = {
  birthday: "cumpleanos", wedding: "boda", graduation: "graduacion",
  bachelor: "despedida", communion: "comunion", baptism: "bautizo",
  christmas: "navidad", corporate: "empresa", other: "otros",
};

export async function GET() {
  const { userId } = await auth();
  const adminId = process.env.ADMIN_USER_ID;
  if (!userId || !adminId || userId !== adminId) {
    return new NextResponse(null, { status: 404 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  // ── KPIs (parallel) ───────────────────────────────────────────────
  const [
    [{ totalUsers }],
    [{ activeEvents }],
    [{ totalEvents }],
    [{ revenueCents }],
    [{ videoJobsLive }],
    [{ newUsersWeek }],
    [{ newEventsWeek }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ activeEvents: count() }).from(events).where(eq(events.status, "published")),
    db.select({ totalEvents: count() }).from(events),
    db.select({ revenueCents: sum(contributions.amount) }).from(contributions).where(eq(contributions.paymentStatus, "paid")),
    db.select({ videoJobsLive: count() }).from(generationJobs).where(eq(generationJobs.status, "processing")),
    db.select({ newUsersWeek: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
    db.select({ newEventsWeek: count() }).from(events).where(gte(events.createdAt, sevenDaysAgo)),
  ]);

  // ── Recent users ──────────────────────────────────────────────────
  const rawUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, plan: users.plan, stripeCustomerId: users.stripeCustomerId, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  const userIds = rawUsers.map(u => u.id);
  const userEventCounts = userIds.length > 0
    ? await db.select({ ownerId: events.ownerId, c: count() }).from(events).where(inArray(events.ownerId, userIds)).groupBy(events.ownerId)
    : [];
  const evtCntMap: Record<string, number> = Object.fromEntries(userEventCounts.map(r => [r.ownerId, Number(r.c)]));

  const recentUsers = rawUsers.map(u => ({
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    plan: u.plan,
    events: evtCntMap[u.id] || 0,
    stripe: !!u.stripeCustomerId,
    reg: ago(u.createdAt),
    regFull: ago(u.createdAt),
  }));

  // ── Recent events ─────────────────────────────────────────────────
  const rawEvents = await db
    .select({ id: events.id, title: events.title, slug: events.slug, type: events.type, status: events.status, paymentStatus: events.paymentStatus, eventDate: events.eventDate, maxGuests: events.maxGuests, ownerId: events.ownerId, createdAt: events.createdAt })
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(8);

  const ownerIds = [...new Set(rawEvents.map(e => e.ownerId))];
  const [ownerRows, guestCountRows, videoCountRows] = await Promise.all([
    ownerIds.length > 0 ? db.select({ id: users.id, name: users.name, email: users.email, plan: users.plan }).from(users).where(inArray(users.id, ownerIds)) : [],
    rawEvents.length > 0 ? db.select({ eventId: guests.eventId, c: count() }).from(guests).where(inArray(guests.eventId, rawEvents.map(e => e.id))).groupBy(guests.eventId) : [],
    rawEvents.length > 0 ? db.select({ eventId: videoProjects.eventId, c: count() }).from(videoProjects).where(inArray(videoProjects.eventId, rawEvents.map(e => e.id))).groupBy(videoProjects.eventId) : [],
  ]);

  const ownerMap = Object.fromEntries(ownerRows.map(o => [o.id, o]));
  const guestMap = Object.fromEntries(guestCountRows.map(r => [r.eventId, Number(r.c)]));
  const videoMap = Object.fromEntries(videoCountRows.map(r => [r.eventId, Number(r.c)]));

  const recentEvents = rawEvents.map(e => {
    const owner = ownerMap[e.ownerId] || { id: e.ownerId, name: null, email: "desconocido", plan: "free" };
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      type: TYPE_MAP[e.type] || "otros",
      status: e.status,
      pago: e.paymentStatus === "paid" ? "paid" : "unpaid",
      owner: { id: owner.id, name: owner.name || owner.email, email: owner.email, plan: owner.plan },
      guests: guestMap[e.id] || 0,
      total: e.maxGuests || 0,
      rsvp: 0,
      videos: videoMap[e.id] || 0,
      videoStatus: null,
      date: e.eventDate || "Sin fecha",
    };
  });

  // ── Recent transactions ───────────────────────────────────────────
  const [rawContribs, rawUnlocks] = await Promise.all([
    db.select({ id: contributions.id, amount: contributions.amount, paymentStatus: contributions.paymentStatus, contributorName: contributions.contributorName, createdAt: contributions.createdAt }).from(contributions).orderBy(desc(contributions.createdAt)).limit(6),
    db.select({ id: events.id, title: events.title, ownerId: events.ownerId, paidAt: events.paidAt }).from(events).where(and(eq(events.paymentStatus, "paid"), isNotNull(events.paidAt))).orderBy(desc(events.paidAt)).limit(4),
  ]);

  const unlockOwnerIds = [...new Set(rawUnlocks.map(u => u.ownerId))];
  const unlockOwners = unlockOwnerIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, unlockOwnerIds))
    : [];
  const unlockOwnerMap = Object.fromEntries(unlockOwners.map(o => [o.id, o.name || o.email]));

  const transactions = [
    ...rawUnlocks.map(u => ({
      id: `unlock-${u.id}`,
      type: "unlock",
      amt: 4.99,
      ev: u.title,
      user: { id: u.ownerId, name: unlockOwnerMap[u.ownerId] || "Usuario", email: "" },
      status: "paid",
      pi: "",
      ts: u.paidAt ? ago(u.paidAt) : "—",
    })),
    ...rawContribs.map(c => ({
      id: `contrib-${c.id}`,
      type: "contrib",
      amt: c.amount / 100,
      ev: "Evento",
      user: { id: "", name: c.contributorName || "Anónimo", email: "" },
      status: c.paymentStatus === "paid" ? "paid" : c.paymentStatus === "pending" ? "pending" : "failed",
      pi: "",
      ts: ago(c.createdAt),
      gift: "",
      fee: (c.amount / 100) * 0.03,
      tr: null,
      contribUser: c.contributorName || "Anónimo",
    })),
  ].slice(0, 8);

  // ── Active video jobs ──────────────────────────────────────────────
  const activeJobs = await db
    .select({ id: generationJobs.id, providerModel: generationJobs.providerModel, status: generationJobs.status, startedAt: generationJobs.startedAt })
    .from(generationJobs)
    .where(eq(generationJobs.status, "processing"))
    .orderBy(desc(generationJobs.createdAt))
    .limit(6);

  // ── Daily chart data (last 30 days) ───────────────────────────────
  const [eventsChartRaw, revenueChartRaw] = await Promise.all([
    db.execute(sql`SELECT DATE(created_at AT TIME ZONE 'Europe/Madrid') as day, COUNT(*) as c FROM events WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`) as unknown as { rows: Array<{day: string; c: string}> },
    db.execute(sql`SELECT DATE(created_at AT TIME ZONE 'Europe/Madrid') as day, SUM(amount) as s FROM contributions WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`) as unknown as { rows: Array<{day: string; s: string}> },
  ]);

  const eventsChart = buildDaily(eventsChartRaw.rows, 30, false);
  const revenueChart = buildDaily(revenueChartRaw.rows as Array<{day: string; s: string}>, 30, true);

  // ── Audit log ─────────────────────────────────────────────────────
  const recentAudit = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(20);

  return NextResponse.json({
    kpis: {
      totalUsers: Number(totalUsers),
      newUsersWeek: Number(newUsersWeek),
      activeEvents: Number(activeEvents),
      totalEvents: Number(totalEvents),
      newEventsWeek: Number(newEventsWeek),
      revenueCents: Number(revenueCents || 0),
      videoJobsLive: Number(videoJobsLive),
    },
    users: recentUsers,
    events: recentEvents,
    transactions,
    activeJobs: activeJobs.map(j => ({
      id: j.id,
      model: j.providerModel,
      status: j.status,
      startedAt: j.startedAt,
    })),
    eventsChart,
    revenueChart,
    auditLog: recentAudit.map(a => ({
      id: a.id,
      userId: a.userId,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      ip: a.ip,
      ts: ago(a.createdAt),
      createdAt: a.createdAt,
    })),
  });
}

function buildDaily(
  rows: Array<Record<string, string>>,
  days: number,
  isRevenue: boolean
): number[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = String(row.day).slice(0, 10);
    map[key] = isRevenue ? Math.round(Number(row.s || 0) / 100) : Number(row.c || 0);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    return map[d.toISOString().slice(0, 10)] || 0;
  });
}
