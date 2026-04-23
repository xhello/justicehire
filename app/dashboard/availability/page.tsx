import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Availability — Company" };

export default async function AvailabilityEditorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/dashboard/availability");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Editor</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">Availability</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Toggle hours open or blocked. A spreadsheet-style grid will live here.
        </p>

        <div className="mt-10 rounded-md border border-dashed border-line bg-white p-12 text-center text-sm text-muted">
          Sheets-style editor — coming next iteration.
        </div>
      </main>
    </>
  );
}
