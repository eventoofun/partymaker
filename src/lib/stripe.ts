import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

/** Create or retrieve a Stripe customer for a user */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const existing = await stripe.customers.search({
    query: `metadata["clerk_user_id"]:"${userId}"`,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { clerk_user_id: userId },
  });

  return customer.id;
}

/** Create a Payment Intent for a collective gift contribution */
export async function createContributionPaymentIntent(params: {
  amount: number; // in euro cents
  wishItemId: string;
  eventSlug: string;
  contributorEmail?: string;
  connectedAccountId?: string; // organizer's Stripe Connect ID
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const { amount, wishItemId, eventSlug, contributorEmail, connectedAccountId, metadata } = params;

  // Platform fee: 3% of contribution (minimum €0.30)
  const platformFee = Math.max(30, Math.round(amount * 0.03));

  const intentData: Stripe.PaymentIntentCreateParams = {
    amount,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      wish_item_id: wishItemId,
      event_slug: eventSlug,
      wishItemId,
      ...metadata,
    },
    receipt_email: contributorEmail ?? undefined,
    description: `Aportación regalo colectivo — eventoo.es/e/${eventSlug}`,
  };

  // If organizer has Stripe Connect, route directly to their account
  if (connectedAccountId) {
    return stripe.paymentIntents.create({
      ...intentData,
      application_fee_amount: platformFee,
      transfer_data: { destination: connectedAccountId },
    });
  }

  return stripe.paymentIntents.create(intentData);
}

/** Create Stripe Connect Express account onboarding link */
export async function createConnectOnboardingLink(
  userId: string,
  email: string,
  returnUrl: string
): Promise<{ url: string; accountId: string }> {
  const account = await stripe.accounts.create({
    type: "express",
    country: "ES",
    email,
    capabilities: { transfers: { requested: true } },
    business_type: "individual",
    metadata: { clerk_user_id: userId },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return { url: link.url, accountId: account.id };
}

/** Retrieve a Payment Intent with latest charge */
export async function getPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(id, {
    expand: ["latest_charge"],
  });
}
