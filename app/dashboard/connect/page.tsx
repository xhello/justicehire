import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { buildSumUpAuthorizeUrl } from "@/lib/sumup/oauth";

export const metadata = { title: "Connect SumUp — Company" };

export default async function ConnectPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/dashboard/connect");

  const { data: profile } = await supabase
    .from("profiles")
    .select("sumup_merchant_code, sumup_email")
    .eq("id", user.id)
    .maybeSingle();

  const authorizeUrl = buildSumUpAuthorizeUrl({ state: user.id });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Payments</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">Connect SumUp</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          When a guest books you, they pay through SumUp&rsquo;s secure hosted
          checkout. Funds land <strong>directly in your SumUp Business
          account</strong> — Company never touches the money. You manage
          payouts to your bank from <a href="https://me.sumup.com" target="_blank" rel="noreferrer" className="underline">me.sumup.com</a>.
        </p>
        <p className="mt-3 text-xs text-muted">
          SumUp US fee: <strong>3.5% + $0.15</strong> per transaction. You set your
          hourly rate; SumUp deducts their fee from each payment before it
          settles.
        </p>

        {profile?.sumup_merchant_code ? (
          <div className="mt-8 rounded-md border border-line bg-white p-5">
            <p className="font-display text-lg">Connected</p>
            <p className="mt-1 text-sm text-muted">
              Merchant code: {profile.sumup_merchant_code}
            </p>
            {profile.sumup_email && (
              <p className="text-sm text-muted">Email: {profile.sumup_email}</p>
            )}
          </div>
        ) : (
          <a
            href={authorizeUrl}
            className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm text-cream"
          >
            Authorize with SumUp
          </a>
        )}
      </main>
    </>
  );
}
