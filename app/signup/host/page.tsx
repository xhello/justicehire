import Header from "@/components/Header";
import HostApplyForm from "./HostApplyForm";

export const metadata = { title: "Become a host — Company" };

export default function HostSignupPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Apply</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">Become a host</h1>
        <p className="mt-3 text-sm text-muted">
          Hosts are reviewed manually. ID verification and background check are
          required before your profile goes live.
        </p>
        <div className="mt-10">
          <HostApplyForm />
        </div>
      </main>
    </>
  );
}
