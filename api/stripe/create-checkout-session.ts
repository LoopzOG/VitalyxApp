import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

type BillingInterval = "monthly" | "yearly";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Stripe is not configured yet. Add STRIPE_SECRET_KEY on the server.");
  }

  return new Stripe(secretKey);
}

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server verification is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getAppUrl() {
  const configuredUrl = process.env.VITE_APP_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.endsWith("/") ? configuredUrl.slice(0, -1) : configuredUrl;
  }

  return "https://www.vitalyxapp.com";
}

function getPriceForInterval(interval: BillingInterval) {
  if (interval === "yearly") {
    return {
      unitAmount: 5999,
      interval: "year" as const,
      label: "Vitalyx Premium Membership - Yearly",
      description: "$59.99 billed once per year.",
    };
  }

  return {
    unitAmount: 999,
    interval: "month" as const,
    label: "Vitalyx Premium Membership - Monthly",
    description: "$9.99 billed once per month.",
  };
}

async function readJsonBody(req: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? (JSON.parse(rawBody) as { interval?: BillingInterval }) : {};
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

    const authorizationHeader = req.headers.authorization;
    const bearerToken =
      typeof authorizationHeader === "string" && authorizationHeader.startsWith("Bearer ")
        ? authorizationHeader.slice("Bearer ".length).trim()
        : "";

    if (!bearerToken) {
      res.status(401).json({ error: "Sign in again before starting checkout." });
      return;
    }

    const body = await readJsonBody(req);
    const interval: BillingInterval = body.interval === "yearly" ? "yearly" : "monthly";
    const supabase = getSupabaseClient();
    const stripe = getStripeClient();

    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (error || !data.user) {
      res.status(401).json({ error: "Your session could not be verified. Please sign in again." });
      return;
    }

    const user = data.user;
    const price = getPriceForInterval(interval);
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${appUrl}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?billing=cancelled`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        user_id: user.id,
        billing_interval: interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          billing_interval: interval,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: price.unitAmount,
            recurring: {
              interval: price.interval,
            },
            product_data: {
              name: price.label,
              description: price.description,
            },
          },
        },
      ],
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to start Stripe checkout right now.",
    });
  }
}
