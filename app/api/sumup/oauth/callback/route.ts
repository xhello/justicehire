import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/sumup/oauth";
import { createServiceClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/connect?error=missing_code`);
  }

  try {
    const tokens = await exchangeCodeForToken(code);

    const meRes = await fetch("https://api.sumup.com/v0.1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const me = meRes.ok ? await meRes.json() : null;

    const supabase = createServiceClient();
    await supabase
      .from("profiles")
      .update({
        sumup_access_token: encrypt(tokens.access_token),
        sumup_refresh_token: encrypt(tokens.refresh_token),
        sumup_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
        sumup_merchant_code: me?.merchant_profile?.merchant_code ?? null,
        sumup_email: me?.account?.username ?? me?.personal_profile?.email ?? null,
      })
      .eq("id", state);

    return NextResponse.redirect(`${origin}/dashboard/connect?connected=1`);
  } catch (e: any) {
    console.error("SumUp OAuth callback error", e);
    return NextResponse.redirect(
      `${origin}/dashboard/connect?error=oauth_failed`,
    );
  }
}
