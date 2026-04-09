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
  return rawBody ? (JSON.parse(rawBody) as { interval?: BillingInterval; userId?: string; userEmail?: string }) : {};
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

    const body = await readJsonBody(req);
    const interval: BillingInterval = body.interval === "yearly" ? "yearly" : "monthly";
    const stripe = getStripeClient();
    let userId = body.userId?.trim() ?? "";
    let userEmail = body.userEmail?.trim() ?? "";

    if (bearerToken) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(bearerToken);
      if (!error && data.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? userEmail;
      }
    }

    if (!userId || !userEmail) {
      res.status(401).json({ error: "Sign in again before starting Vitalyx Premium checkout." });
      return;
    }

    const price = getPriceForInterval(interval);
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${appUrl}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?billing=cancelled`,
      customer_email: userEmail,
      client_reference_id: userId,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        user_id: userId,
        user_email: userEmail,
        billing_interval: interval,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          user_email: userEmail,
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
