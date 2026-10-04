"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock3,
  MapPin,
  Music2,
  Moon,
  Sun,
  CreditCard,
  ExternalLink,
  Info,
} from "lucide-react";
import { type Trip, site } from "@/data/site";
import { CommunityButton, Modal } from "./site-shell";

export function TripDetails({
  trip,
  onClose,
  tripDate,
}: {
  trip: Trip;
  onClose: () => void;
  tripDate?: string;
}) {
  return (
    <Modal title={`${trip.name} trip details`} onClose={onClose}>
      <span className={`trip-label ${trip.theme}`}>
        {tripDate || `${trip.day} · ${trip.label}`}
      </span>
      <h2 className="trip-modal-title">
        Let’s go to
        <br />
        {trip.name}.
      </h2>
      <p>{trip.description}</p>
      <div className="trip-details-list">
        <div>
          <Clock3 size={20} />
          <span>
            <small>TRIP TIMES · BARCELONA</small>
            <strong>
              {trip.start} – {trip.end}
              {trip.nextDay ? " (next day)" : ""}
            </strong>
          </span>
        </div>
        <div>
          <MapPin size={20} />
          <span>
            <small>MEETING POINT</small>
            <strong>{site.pickup}</strong>
            <a href={site.pickupMap} target="_blank" rel="noreferrer">
              Open pickup map <ExternalLink size={13} />
            </a>
          </span>
        </div>
        <div>
          <CreditCard size={20} />
          <span>
            <small>PAYMENT</small>
            <strong>Secure payment via SumUp</strong>
            <span className="muted">
              Check the price and what’s included before paying.
            </span>
          </span>
        </div>
      </div>
      <div className="soft-note">
        <Info size={18} />
        <span>
          Check availability before paying. Your seat is confirmed only once
          payment is received. No payment means no reservation.
        </span>
      </div>
      <p className="booking-rules-note">
        Departures are at the announced time. Any wait is limited to a maximum
        of 10 minutes. Please read our{" "}
        <Link href="/faq#community-rules" onClick={onClose}>
          community rules
        </Link>{" "}
        before booking.
      </p>
      <a
        className="button button-gold full-width"
        href={trip.paymentUrl}
        target="_blank"
        rel="noreferrer"
      >
        <CreditCard size={18} />
        View SumUp booking link
      </a>
      <CommunityButton className="button button-outline full-width">
        Ask about this trip
      </CommunityButton>
      <p className="modal-footnote">
        Payment is handled by SumUp. Use the link for your chosen trip and
        follow the community’s booking instructions.
      </p>
    </Modal>
  );
}

export function TripCard({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <article className={`trip-card ${trip.theme}`}>
        <div className="trip-art">
          <div className="trip-art-top">
            <span className="trip-label">{trip.label}</span>
            {trip.theme === "gold" ? <Moon size={23} /> : <Sun size={25} />}
          </div>
          <div className="trip-art-title">
            <span>{trip.name}</span>
            <Music2 className="trip-art-music" size={50} strokeWidth={1} />
          </div>
          <span className="trip-art-bottom">
            BACHATA · SALSA · GOOD COMPANY
          </span>
          <div className="day-stamp">
            <span>{trip.dayShort}</span>
            <strong>{trip.day === "Saturday" ? "NIGHT" : "VIBES"}</strong>
          </div>
        </div>
        <div className="trip-card-body">
          <div>
            <h3>
              {trip.day} at {trip.name}
            </h3>
            <p>{trip.tagline}</p>
          </div>
          <div className="trip-meta">
            <span>
              <Clock3 size={17} />
              {trip.start} – {trip.end}
              {trip.nextDay && <small>+1</small>}
            </span>
            <span>
              <MapPin size={17} />
              Sagrada Família pickup
            </span>
          </div>
          <div className="trip-card-bottom">
            <span>Let’s ride. Let’s dance.</span>
            <button
              className="button button-dark"
              onClick={() => setOpen(true)}
            >
              Trip details
            </button>
          </div>
        </div>
      </article>
      {open && <TripDetails trip={trip} onClose={() => setOpen(false)} />}
    </>
  );
}
