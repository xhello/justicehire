const SUMUP_AUTHORIZE_URL = "https://api.sumup.com/authorize";
const SUMUP_TOKEN_URL = "https://api.sumup.com/token";

export function buildSumUpAuthorizeUrl({ state }: { state: string }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SUMUP_CLIENT_ID!,
    redirect_uri: process.env.SUMUP_OAUTH_REDIRECT_URI!,
    scope: "payments user.profile_readonly",
    state,
  });
  return `${SUMUP_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.SUMUP_CLIENT_ID!,
    client_secret: process.env.SUMUP_CLIENT_SECRET!,
    redirect_uri: process.env.SUMUP_OAUTH_REDIRECT_URI!,
  });

  const res = await fetch(SUMUP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`SumUp token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as SumUpTokenResponse;
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SUMUP_CLIENT_ID!,
    client_secret: process.env.SUMUP_CLIENT_SECRET!,
  });
  const res = await fetch(SUMUP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`SumUp token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as SumUpTokenResponse;
}

export type SumUpTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
};
