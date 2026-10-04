"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  List,
  MapPin,
  Music2,
  Info,
} from "lucide-react";
import {
  dateKey,
  getBarcelonaToday,
  getTripForDate,
  site,
  type Trip,
} from "@/data/site";
import { TripDetails } from "./trip-card";

const displayDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
const initialDate = new Date(2026, 9, 4, 12);

export function TripCalendar() {
  const [today, setToday] = useState(initialDate);
  const [month, setMonth] = useState(new Date(2026, 9, 1, 12));
  const [selected, setSelected] = useState(initialDate);
  const [view, setView] = useState<"month" | "list">("month");
  const [details, setDetails] = useState<Trip | null>(null);
  const selectedPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 600px)").matches) setView("list");
    const now = getBarcelonaToday();
    setToday(now);
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12));
    const nextTrip = new Date(now);
    for (let i = 0; i < 7 && !getTripForDate(nextTrip); i++)
      nextTrip.setDate(nextTrip.getDate() + 1);
    setSelected(nextTrip);
  }, []);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthName = month.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, i) => {
      const day = i - offset + 1;
      return day > 0 && day <= days
        ? new Date(year, monthIndex, day, 12)
        : null;
    },
  );
  const selectedTrip = getTripForDate(selected);
  const monthTrips = cells.filter(
    (date): date is Date => !!date && !!getTripForDate(date),
  );
  const isPast = dateKey(selected) < dateKey(today);
  function changeMonth(direction: number) {
    const next = new Date(year, monthIndex + direction, 1, 12);
    setMonth(next);
    const firstTrip = new Date(next);
    for (let i = 0; i < 7 && !getTripForDate(firstTrip); i++)
      firstTrip.setDate(firstTrip.getDate() + 1);
    setSelected(firstTrip);
  }
  function jumpToday() {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12));
    setSelected(today);
  }
  function selectDate(date: Date) {
    setSelected(date);
    if (!window.matchMedia("(max-width: 600px)").matches) return;
    const trip = getTripForDate(date);
    if (trip && dateKey(date) >= dateKey(today)) {
      setDetails(trip);
    } else {
      requestAnimationFrame(() => {
        selectedPanel.current?.scrollIntoView({ block: "start" });
      });
    }
  }
  return (
    <div className="calendar-layout">
      <div>
        <section className="calendar-panel" aria-label="Trip calendar">
          <div className="calendar-toolbar">
            <div className="calendar-month">
              <button
                className="icon-button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 aria-live="polite">{monthName}</h2>
              <button
                className="icon-button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="calendar-toolbar-actions">
              <button className="today-button" onClick={jumpToday}>
                Today
              </button>
              <div className="view-switch" aria-label="Calendar view">
                <button
                  aria-label="Month view"
                  aria-pressed={view === "month"}
                  onClick={() => setView("month")}
                >
                  <CalendarDays size={17} />
                  <span>Month</span>
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={17} />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>
          {view === "month" ? (
            <table className="calendar-table" aria-label={monthName}>
              <thead>
                <tr>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <th scope="col" key={day}>
                        {day}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cells.length / 7 }, (_, week) => (
                  <tr key={week}>
                    {cells.slice(week * 7, week * 7 + 7).map((date, i) => {
                      if (!date)
                        return (
                          <td className="calendar-blank" key={`blank-${i}`} />
                        );
                      const trip = getTripForDate(date);
                      return (
                        <td key={dateKey(date)}>
                          <button
                            className={`calendar-day ${dateKey(date) === dateKey(selected) ? "is-selected" : ""} ${dateKey(date) === dateKey(today) ? "is-today" : ""}`}
                            aria-label={`${displayDate(date)}${trip ? `: ${trip.name}, ${trip.start}` : ": no trip scheduled"}`}
                            aria-pressed={dateKey(date) === dateKey(selected)}
                            onClick={() => selectDate(date)}
                          >
                            <span className="day-number">{date.getDate()}</span>
                            {trip && (
                              <span className={`calendar-event ${trip.theme}`}>
                                <strong className="event-full-name">
                                  {trip.name}
                                </strong>
                                <strong className="event-short-name">
                                  {trip.id === "manisero" ? "MAN" : "QUE"}
                                </strong>
                                <span className="event-time">{trip.start}</span>
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="calendar-list">
              {monthTrips.length ? (
                monthTrips.map((date) => {
                  const trip = getTripForDate(date)!;
                  return (
                    <button
                      key={dateKey(date)}
                      className="list-trip"
                      aria-label={`${displayDate(date)}: ${trip.name}`}
                      aria-pressed={dateKey(date) === dateKey(selected)}
                      onClick={() => selectDate(date)}
                    >
                      <span className="list-date">
                        <small>{trip.dayShort}</small>
                        <strong>{date.getDate()}</strong>
                      </span>
                      <span className="list-trip-title">
                        <strong>{trip.name}</strong>
                        <small>Sagrada Família pickup</small>
                      </span>
                      <span>
                        {trip.start} – {trip.end}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="list-empty">
                  No trips are listed for this month.
                </p>
              )}
            </div>
          )}
          <div className="calendar-legend">
            <span>
              <i className="legend-swatch" />
              Manisero · Saturdays
            </span>
            <span>
              <i className="legend-swatch green" />
              Quechimba · Sundays
            </span>
          </div>
        </section>
        <p className="calendar-bottom-note">
          <Info size={15} />
          All times are local to Barcelona. Check the community for schedule
          changes.
        </p>
      </div>
      <aside className="calendar-sidebar">
        <section
          ref={selectedPanel}
          className="selected-trip"
          aria-live="polite"
        >
          <p className="eyebrow">
            {selectedTrip ? "YOUR NEXT DANCE NIGHT" : "A LITTLE BREATHER"}
          </p>
          {selectedTrip ? (
            <>
              <span className="trip-label">{selectedTrip.label}</span>
              <h2>{selectedTrip.name}</h2>
              <div className="selected-date">{displayDate(selected)}</div>
              <p>{selectedTrip.tagline}</p>
              <div className="trip-meta">
                <span>
                  <Clock3 size={17} />
                  {selectedTrip.start} – {selectedTrip.end}
                  {selectedTrip.nextDay ? " (+1 day)" : ""}
                </span>
                <span>
                  <MapPin size={17} />
                  Sagrada Família
                </span>
              </div>
              {isPast ? (
                <p className="past-trip-note">
                  This trip date has passed. Choose an upcoming weekend to plan
                  your next ride.
                </p>
              ) : (
                <button
                  className="button button-gold full-width"
                  onClick={() => setDetails(selectedTrip)}
                >
                  View trip & booking
                </button>
              )}
            </>
          ) : (
            <>
              <Music2 className="empty-icon" size={33} />
              <h2>No trip this day.</h2>
              <div className="selected-date">{displayDate(selected)}</div>
              <p>
                Our dance nights are on Saturdays and Sundays. Pick a weekend
                date to find your next ride.
              </p>
            </>
          )}
        </section>
        <section className="pickup-note">
          <MapPin size={23} />
          <h3>One place to meet.</h3>
          <p>
            We leave from Sagrada Família, Barcelona. Check the exact pickup pin
            and be there at the announced time. Any wait is limited to a maximum
            of 10 minutes.
          </p>
          <a href={site.pickupMap} target="_blank" rel="noreferrer">
            Open the pickup map
          </a>
        </section>
      </aside>
      {details && (
        <TripDetails
          trip={details}
          onClose={() => setDetails(null)}
          tripDate={displayDate(selected)}
        />
      )}
    </div>
  );
}
