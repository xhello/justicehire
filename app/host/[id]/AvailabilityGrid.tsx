"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import type { AvailabilitySlot } from "@/lib/types";
import { formatDayLabel, formatHour } from "@/lib/format";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function AvailabilityGrid({ slots }: { slots: AvailabilitySlot[] }) {
  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const slotMap = useMemo(() => {
    const m = new Map<string, AvailabilitySlot>();
    for (const s of slots) {
      const d = new Date(s.starts_at);
      m.set(`${d.toDateString()}|${d.getHours()}`, s);
    }
    return m;
  }, [slots]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-line">
        <div className="bg-cream" />
        {days.map((d) => {
          const { weekday, day } = formatDayLabel(d);
          return (
            <div key={d.toISOString()} className="bg-cream pb-2 pt-1 text-center">
              <p className="text-[10px] tracking-widest text-muted">{weekday}</p>
              <p className="font-display text-lg">{day}</p>
            </div>
          );
        })}

        {HOURS.map((h) => (
          <Fragment key={`row-${h}`}>
            <div className="bg-cream pr-2 pt-2 text-right text-[10px] text-muted">
              {formatHour(new Date(2024, 0, 1, h))}
            </div>
            {days.map((d) => {
              const slot = slotMap.get(`${d.toDateString()}|${h}`);
              const isOpen = slot?.status === "open";
              const cellClass = isOpen
                ? "bg-cream hover:bg-ink hover:text-cream cursor-pointer"
                : slot?.status === "booked"
                  ? "bg-line/60 text-muted"
                  : "bg-cream/40 text-muted/40";
              const content = (
                <div
                  className={`flex h-12 items-center justify-center text-[11px] transition ${cellClass}`}
                >
                  {isOpen ? "Book" : slot?.status === "booked" ? "—" : ""}
                </div>
              );
              return isOpen && slot ? (
                <Link key={`${d.toISOString()}-${h}`} href={`/book/${slot.id}`}>
                  {content}
                </Link>
              ) : (
                <div key={`${d.toISOString()}-${h}`}>{content}</div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
