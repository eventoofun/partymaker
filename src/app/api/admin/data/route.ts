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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  // ── Stage 1: All independent queries in parallel ───────────────────
  const [
    kpiResults,
    rawUsers,
    rawEvents,
    transactionResults,
    activeJobs,
    chartResults,
    recentAudit,
  ] = await Promise.all([
    // KPIs (7 sub-queries)
    Promise.all([
      db.select({ v: count() }).from(users),
      db.select({ v: count() }).from(events).where(eq(events.status, "published")),
      db.select({ v: count() }).from(events),
      db.select({ v: sum(contributions.amount) }).from(contributions).where(eq(contributions.paymentStatus, "paid")),
      db.select({ v: count() }).from(generationJobs).where(eq(generationJobs.status, "processing")),
      db.select({ v: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      db.select({ v: count() }).from(events).where(gte(events.createdAt, sevenDaysAgo)),
      db.select({ v: sum(contributions.amount) }).from(contributions).where(and(eq(contributions.paymentStatus, "paid"), gte(contributions.createdAt, thirtyDaysAgo))),
      db.select({ v: count() }).from(events).where(and(eq(events.paymentStatus, "paid"), gte(events.createdAt, thirtyDaysAgo))),
    ]),

    // Recent users
    db.select({ id: users.id, name: users.name, email: users.email, plan: users.plan, stripeCustomerId: users.stripeCustomerId, createdAt: users.createdAt })
      .from(users).orderBy(desc(users.createdAt)).limit(10),

    // Recent events
    db.select({ id: events.id, title: events.title, slug: events.slug, type: events.type, status: events.status, paymentStatus: events.paymentStatus, eventDate: events.eventDate, maxGuests: events.maxGuests, ownerId: events.ownerId, createdAt: events.createdAt })
      .from(events).orderBy(desc(events.createdAt)).limit(8),

    // Transactions
    Promise.all([
      db.select({ id: contributions.id, amount: contributions.amount, paymentStatus: contributions.paymentStatus, contributorName: contributions.contributorName, createdAt: contributions.createdAt })
        .from(contributions).orderBy(desc(contributions.createdAt)).limit(6),
      db.select({ id: events.id, title: events.title, ownerId: events.ownerId, paidAt: events.paidAt })
        .from(events).where(and(eq(events.paymentStatus, "paid"), isNotNull(events.paidAt))).orderBy(desc(events.paidAt)).limit(4),
    ]),

    // Active video jobs
    db.select({ id: generationJobs.id, providerModel: generationJobs.providerModel, status: generationJobs.status, startedAt: generationJobs.startedAt })
      .from(generationJobs).where(eq(generationJobs.status, "processing")).orderBy(desc(generationJobs.createdAt)).limit(6),

    // Chart data (non-blocking — returns empty on error)
    Promise.all([
      db.execute(sql`SELECT DATE(created_at AT TIME ZONE 'Europe/Madrid') as day, COUNT(*) as c FROM events WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`),
      db.execute(sql`SELECT DATE(created_at AT TIME ZONE 'Europe/Madrid') as day, SUM(amount) as s FROM contributions WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`),
    ]).catch(() => [{ rows: [] }, { rows: [] }]),

    // Audit log (non-blocking)
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(20).catch(() => []),
  ]);

  const [
    [{ v: totalUsers }],
    [{ v: activeEvents }],
    [{ v: totalEvents }],
    [{ v: revenueCents }],
    [{ v: videoJobsLive }],
    [{ v: newUsersWeek }],
    [{ v: newEventsWeek }],
    [{ v: monthlyRevenueCents }],
    [{ v: monthlyUnlocks }],
  ] = kpiResults;

  const [rawContribs, rawUnlocks] = transactionResults;

  // ── Stage 2: Dependent queries in parallel ────────────────────────
  const userIds = rawUsers.map(u => u.id);
  const ownerIds = [...new Set(rawEvents.map(e => e.ownerId))];
  const eventIds = rawEvents.map(e => e.id);
  const unlockOwnerIds = [...new Set(rawUnlocks.map(u => u.ownerId))];

  const [userEventCounts, ownerRows, guestCountRows, videoCountRows, unlockOwners] = await Promise.all([
    userIds.length > 0
      ? db.select({ ownerId: events.ownerId, c: count() }).from(events).where(inArray(events.ownerId, userIds)).groupBy(events.ownerId)
      : [],
    ownerIds.length > 0
      ? db.select({ id: users.id, name: users.name, email: users.email, plan: users.plan }).from(users).where(inArray(users.id, ownerIds))
      : [],
    eventIds.length > 0
      ? db.select({ eventId: guests.eventId, c: count() }).from(guests).where(inArray(guests.eventId, eventIds)).groupBy(guests.eventId)
      : [],
    eventIds.length > 0
      ? db.select({ eventId: videoProjects.eventId, c: count() }).from(videoProjects).where(inArray(videoProjects.eventId, eventIds)).groupBy(videoProjects.eventId)
      : [],
    unlockOwnerIds.length > 0
      ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, unlockOwnerIds))
      : [],
  ]);

  // ── Build response objects ─────────────────────────────────────────
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

  const [eventsChartRaw, revenueChartRaw] = chartResults as unknown as [{ rows: Array<{day: string; c: string}> }, { rows: Array<{day: string; s: string}> }];
  const eventsChart = buildDaily(eventsChartRaw.rows, 30, false);
  const revenueChart = buildDaily(revenueChartRaw.rows, 30, true);

  // Fee estimates (3% on contributions + platform cut on unlocks)
  const monthlyContribRevenue = Number(monthlyRevenueCents || 0);
  const monthlyUnlockCount = Number(monthlyUnlocks || 0);
  const monthlyFeesCents = Math.round(monthlyContribRevenue * 0.03) + monthlyUnlockCount * 499;

  return NextResponse.json({
    kpis: {
      totalUsers: Number(totalUsers),
      newUsersWeek: Number(newUsersWeek),
      activeEvents: Number(activeEvents),
      totalEvents: Number(totalEvents),
      newEventsWeek: Number(newEventsWeek),
      revenueCents: Number(revenueCents || 0),
      videoJobsLive: Number(videoJobsLive),
      monthlyRevenueCents: monthlyContribRevenue,
      monthlyFeesCents,
      monthlyUnlocks: monthlyUnlockCount,
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
    auditLog: (recentAudit as typeof recentAudit).map(a => ({
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
