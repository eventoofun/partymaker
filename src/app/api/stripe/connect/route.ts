import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createConnectOnboardingLink } from "@/lib/stripe";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://eventoo.es"}/dashboard`;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { stripeConnectId: true, stripeConnectOnboarded: true },
  });

  // If already onboarded
  if (user?.stripeConnectOnboarded && user.stripeConnectId) {
    return NextResponse.redirect(returnUrl);
  }

  const { url, accountId } = await createConnectOnboardingLink(userId, email, returnUrl);

  // Save the new Connect account ID (not yet onboarded)
  await db
    .update(users)
    .set({ stripeConnectId: accountId, stripeConnectOnboarded: false })
    .where(eq(users.id, userId));

  return NextResponse.redirect(url);
}
