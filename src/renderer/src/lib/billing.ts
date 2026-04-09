type BillingInterval = "monthly" | "yearly";

export async function startPremiumCheckout(input: { accessToken: string; interval: BillingInterval }) {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      interval: input.interval,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string; sessionId?: string; url?: string | null } | null;
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Unable to start Stripe checkout right now.");
  }

  window.location.assign(payload.url);
}
