import Link from "next/link";
import {
  MapPin,
  Music2,
  Users,
  CalendarDays,
  BusFront,
  Ticket,
  Heart,
  Sparkles,
} from "lucide-react";
import { trips } from "@/data/site";
import { TripCard } from "@/components/trip-card";
import { CommunityBanner } from "@/components/site-shell";
export default function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div
          className="hero-photo"
          role="img"
          aria-label="People enjoying a social dance night"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span />
              BARCELONA, LET’S DANCE
            </span>
            <h1>
              Good people.
              <br />
              Great music.
              <br />
              <em>One ride.</em>
            </h1>
            <p>
              Your ride to bachata nights and new friendships.
              <br className="desktop-only" /> We bring the people. You bring
              your dancing shoes.
            </p>
            <div className="hero-buttons">
              <Link href="/calendar" className="button button-gold">
                <CalendarDays size={19} />
                Find your next trip
              </Link>
              <a href="#how-it-works" className="hero-secondary">
                How it works
              </a>
            </div>
            <div className="hero-location">
              <MapPin size={16} />
              From Sagrada Família, Barcelona
            </div>
          </div>
          <div className="hero-ticket">
            <Music2 size={22} />
            <span>
              A little less planning.
              <br />
              <strong>A lot more dancing.</strong>
            </span>
            <span className="ticket-star">✳</span>
          </div>
          <span className="hero-photo-caption">
            THE NIGHT STARTS WITH THE RIDE.
          </span>
        </div>
      </section>
      <div className="value-strip">
        <div className="container">
          <span>
            <MapPin />
            One easy meeting point
          </span>
          <span>
            <Music2 />
            Bachata & salsa nights
          </span>
          <span>
            <Users />
            Good company, every trip
          </span>
          <span>
            <Heart />
            Made by dancers, for dancers
          </span>
        </div>
      </div>
      <section className="section container" id="trips">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              OUT OF THE GROUP CHAT. ONTO THE DANCE FLOOR.
            </p>
            <h2>Where are we dancing?</h2>
          </div>
          <Link href="/calendar" className="text-link">
            <CalendarDays size={18} />
            Explore the calendar
          </Link>
        </div>
        <div className="trip-grid">
          {trips.map((trip) => (
            <TripCard trip={trip} key={trip.id} />
          ))}
        </div>
        <p className="schedule-note">
          Our shared trip lineup. Check the latest dates and availability with
          the community before booking.
        </p>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LESS LOGISTICS. MORE BACHATA.</p>
              <h2>From “shall we?” to “let’s go.”</h2>
            </div>
            <p>
              Three little steps.
              <br />
              One very good night.
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="step-icon">
                <CalendarDays />
              </span>
              <span className="step-number">01</span>
              <h3>Find your night</h3>
              <p>
                Explore the trips and confirm the date and available seats with
                the community.
              </p>
            </article>
            <article>
              <span className="step-icon">
                <Ticket />
              </span>
              <span className="step-number">02</span>
              <h3>Save your seat</h3>
              <p>
                Pay using your trip’s SumUp link. Your seat is confirmed only
                once payment is received.
              </p>
            </article>
            <article>
              <span className="step-icon">
                <BusFront />
              </span>
              <span className="step-number">03</span>
              <h3>Meet. Ride. Dance.</h3>
              <p>
                Be at the Sagrada Família pickup at the announced time. Any wait
                is limited to a maximum of 10 minutes.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="section container community-story">
        <div className="story-image">
          <img
            src="/images/community.jpg"
            alt="Dancers sharing a moment on the dance floor"
            loading="lazy"
          />
          <div className="story-sticker">
            <Sparkles size={22} />
            <span>
              Strangers at pickup.
              <br />
              <strong>Friends by the first song.</strong>
            </span>
          </div>
        </div>
        <div className="story-copy">
          <p className="eyebrow">MORE THAN A RIDE</p>
          <h2>
            Same rhythm.
            <br />
            New connections.
          </h2>
          <p>
            The best nights aren’t just about where you go. They’re about who
            you go with.
          </p>
          <p>
            BachataVan brings Barcelona’s dance lovers together — from the first
            hello at pickup to that last “one more song.” Come with friends, or
            come meet them.
          </p>
          <p>
            Heading to a festival or arriving in Barcelona? Ask the community
            about festival trips and airport pickups, too.
          </p>
          <Link href="/faq" className="text-link">
            First time with us? Get to know the ride
          </Link>
        </div>
      </section>
      <div className="container banner-wrap">
        <CommunityBanner />
      </div>
    </main>
  );
}
