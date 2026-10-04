import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container not-found">
      <p className="eyebrow">LOOKS LIKE A WRONG TURN</p>
      <h1>
        Let’s get you
        <br />
        back to the dance.
      </h1>
      <p>That page isn’t here, but your next night out could be.</p>
      <Link href="/calendar" className="button button-gold">
        Find a trip
      </Link>
    </main>
  );
}
