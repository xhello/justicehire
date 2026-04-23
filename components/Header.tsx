import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const user = configured
    ? (await createClient().auth.getUser()).data.user
    : null;

  return (
    <header className="border-b border-line bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl tracking-tight">
          Company
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/browse" className="hover:underline">Browse</Link>
          <Link href="/signup/host" className="hover:underline">Become a host</Link>
          {user ? (
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-full border border-ink px-4 py-1.5 hover:bg-ink hover:text-cream"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
