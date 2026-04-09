type BillingInterval = "monthly" | "yearly";

export async function startPremiumCheckout(input: {
  accessToken: string | null;
  interval: BillingInterval;
  userId: string;
  userEmail: string;
}) {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : {}),
    },
    body: JSON.stringify({
      interval: input.interval,
      userId: input.userId,
      userEmail: input.userEmail,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string; sessionId?: string; url?: string | null } | null;
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Unable to start Stripe checkout right now.");
  }

  window.location.assign(payload.url);
}
