import Link from "next/link";
import Header from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <section className="grid gap-12 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Issue №01 — In-person, on purpose
            </p>
            <h1 className="font-display mt-6 text-6xl leading-[0.95] tracking-tight md:text-8xl">
              Time, in person.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted">
              A directory of verified people who&rsquo;ll meet you for coffee, a hike,
              a concert, or dinner. Book by the hour. Show up.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/browse"
                className="rounded-full bg-ink px-6 py-3 text-sm text-cream hover:opacity-90"
              >
                Browse people
              </Link>
              <Link
                href="/signup/host"
                className="rounded-full border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-cream"
              >
                Become a host
              </Link>
            </div>
          </div>

          <aside className="md:col-span-4">
            <div className="border-t border-ink pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                What this is not
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>— Not a dating app.</li>
                <li>— Not virtual.</li>
                <li>— Not a friend simulator.</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="mt-24 grid gap-8 border-t border-line pt-12 md:grid-cols-3">
          {[
            { n: "01", t: "Browse", d: "Filter by city and activity. Read profiles, see real reviews." },
            { n: "02", t: "Book", d: "Pick an open hour. Agree on where to meet. Pay securely." },
            { n: "03", t: "Show up", d: "Meet in a public place. Have a real conversation." },
          ].map((step) => (
            <div key={step.n}>
              <p className="text-xs tracking-widest text-muted">{step.n}</p>
              <h3 className="font-display mt-2 text-2xl">{step.t}</h3>
              <p className="mt-2 text-sm text-muted">{step.d}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted">
          © {new Date().getFullYear()} Company. Verified hosts. ID checks. Public meetings.
        </div>
      </footer>
    </>
  );
}
