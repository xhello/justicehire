import type { Metadata } from "next";
import { TripCalendar } from "@/components/trip-calendar";
import { CommunityBanner } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Trip calendar",
  description:
    "Plan your next BachataVan trip. Manisero on Saturdays, Quechimba on Sundays, and a shared pickup point at Sagrada Família in Barcelona.",
};

export default function CalendarPage() {
  return (
    <main id="main" className="container">
      <header className="page-heading">
        <p className="eyebrow">MAKE ROOM FOR A LITTLE BACHATA</p>
        <h1>Your next night out.</h1>
        <p>Pick a date. Find your dance floor. We’ll see you at pickup.</p>
      </header>
      <TripCalendar />
      <div className="banner-wrap">
        <CommunityBanner />
      </div>
    </main>
  );
}
