import { refreshAccessToken } from "./oauth";
import { decrypt, encrypt } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase/server";

const SUMUP_API = "https://api.sumup.com";

type HostTokens = {
  id: string;
  sumup_access_token: string | null;
  sumup_refresh_token: string | null;
  sumup_token_expires_at: string | null;
  sumup_email: string | null;
};

async function getValidAccessToken(hostId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, sumup_access_token, sumup_refresh_token, sumup_token_expires_at, sumup_email",
    )
    .eq("id", hostId)
    .maybeSingle<HostTokens>();

  if (error || !data?.sumup_refresh_token) {
    throw new Error("Host has not connected SumUp");
  }

  const expiresAt = data.sumup_token_expires_at
    ? new Date(data.sumup_token_expires_at).getTime()
    : 0;
  const stillValid = expiresAt > Date.now() + 60_000 && data.sumup_access_token;

  if (stillValid) return decrypt(data.sumup_access_token!);

  const refreshed = await refreshAccessToken(decrypt(data.sumup_refresh_token));
  await supabase
    .from("profiles")
    .update({
      sumup_access_token: encrypt(refreshed.access_token),
      sumup_refresh_token: encrypt(refreshed.refresh_token),
      sumup_token_expires_at: new Date(
        Date.now() + refreshed.expires_in * 1000,
      ).toISOString(),
    })
    .eq("id", hostId);

  return refreshed.access_token;
}

export async function createCheckout(opts: {
  hostId: string;
  hostEmail: string;
  bookingId: string;
  amountCents: number;
  description: string;
  redirectUrl: string;
  returnUrl: string;
}) {
  const token = await getValidAccessToken(opts.hostId);
  const res = await fetch(`${SUMUP_API}/v0.1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: opts.bookingId,
      amount: Number((opts.amountCents / 100).toFixed(2)),
      currency: "USD",
      pay_to_email: opts.hostEmail,
      description: opts.description,
      return_url: opts.returnUrl,
      redirect_url: opts.redirectUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`SumUp checkout failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as {
    id: string;
    checkout_url: string;
    status: string;
  };
}

export async function getCheckoutStatus(checkoutId: string, hostId: string) {
  const token = await getValidAccessToken(hostId);
  const res = await fetch(`${SUMUP_API}/v0.1/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`SumUp status fetch failed: ${res.status}`);
  }
  return (await res.json()) as { id: string; status: string; checkout_reference: string };
}
