import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Stripe is not configured yet. Add STRIPE_SECRET_KEY on the server.");
  }

  return new Stripe(secretKey);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin access is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY on the server.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function readRawBody(req: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function updateProfileFromSubscription(
  userId: string,
  details: {
    subscriptionTier: "free" | "premium";
    customerId?: string | null;
    subscriptionId?: string | null;
    priceId?: string | null;
    subscriptionStatus?: string | null;
  },
) {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_tier: details.subscriptionTier,
      stripe_customer_id: details.customerId ?? null,
      stripe_subscription_id: details.subscriptionId ?? null,
      stripe_price_id: details.priceId ?? null,
      subscription_status: details.subscriptionStatus ?? null,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

function subscriptionTierForStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" ? "premium" : "free";
}

export default async function handler(
  req: NodeJS.ReadableStream & { method?: string; headers: Record<string, string | string[] | undefined> },
  res: { status: (code: number) => { json: (payload: unknown) => void } },
) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      throw new Error("Stripe webhook signing secret is not configured yet.");
    }

    const signatureHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) {
      res.status(400).json({ error: "Missing Stripe signature header." });
      return;
    }

    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ?? session.client_reference_id ?? "";

      if (userId) {
        await updateProfileFromSubscription(userId, {
          subscriptionTier: "premium",
          customerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
          subscriptionStatus: "active",
        });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id ?? "";

      if (userId) {
        const primaryItem = subscription.items.data[0];
        await updateProfileFromSubscription(userId, {
          subscriptionTier: subscriptionTierForStatus(subscription.status),
          customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
          subscriptionId: subscription.id,
          priceId: primaryItem?.price.id ?? null,
          subscriptionStatus: subscription.status,
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Stripe webhook failed.",
    });
  }
}
