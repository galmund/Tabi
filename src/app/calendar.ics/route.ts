import { addDays } from "@/lib/dates";
import { TRAVEL_MODE_LABEL } from "@/lib/labels";
import { getTripData } from "@/lib/trip";

export const dynamic = "force-dynamic";

type Event = {
  uid: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string | null;
  description?: (string | null | undefined)[];
  alarmDaysBefore?: number;
};

const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const compactDay = (day: string) => day.replaceAll("-", "");

const stamp = (day: string, time: string) => `${compactDay(day)}T${time.replace(":", "")}00`;

function plusHour(day: string, time: string): [string, string] {
  const hour = Number(time.slice(0, 2)) + 1;
  return hour >= 24 ? [addDays(day, 1), `${String(hour - 24).padStart(2, "0")}${time.slice(2)}`] : [day, `${String(hour).padStart(2, "0")}${time.slice(2)}`];
}

const encoder = new TextEncoder();

function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function render(event: Event, now: string): string[] {
  const description = (event.description ?? []).filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}@tabi`,
    `DTSTAMP:${now}`,
    event.allDay ? `DTSTART;VALUE=DATE:${event.start}` : `DTSTART:${event.start}`,
    event.allDay ? `DTEND;VALUE=DATE:${event.end}` : `DTEND:${event.end}`,
    `SUMMARY:${escape(event.summary)}`,
    event.location ? `LOCATION:${escape(event.location)}` : null,
    description ? `DESCRIPTION:${escape(description)}` : null,
    event.allDay ? "TRANSP:TRANSPARENT" : null,
    ...(event.alarmDaysBefore
      ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escape(event.summary)}`, `TRIGGER:-P${event.alarmDaysBefore}D`, "END:VALARM"]
      : []),
    "END:VEVENT",
  ];
  return lines.filter((line): line is string => line !== null);
}

export async function GET() {
  const { trip, stays, legs, ideas, todos } = await getTripData();
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const events: Event[] = [];

  for (const stay of stays.filter((entry) => entry.status === "BOOKED")) {
    events.push({
      uid: `stay-${stay.id}`,
      summary: stay.name,
      start: compactDay(stay.checkIn),
      end: compactDay(stay.checkOut),
      allDay: true,
      location: stay.address ?? `${stay.name}, ${stay.city.name}, Japan`,
      description: [
        `Check-in from ${stay.checkInTime}, check-out by ${stay.checkOutTime}`,
        stay.bookingRef ? `Booking no. ${stay.bookingRef}` : null,
        stay.url,
        stay.notes,
      ],
    });
    if (stay.cancelBy) {
      events.push({
        uid: `cancel-${stay.id}`,
        summary: `Free cancellation ends · ${stay.name}`,
        start: compactDay(stay.cancelBy),
        end: compactDay(addDays(stay.cancelBy, 1)),
        allDay: true,
        alarmDaysBefore: 2,
      });
    }
  }

  for (const leg of legs) {
    const title = `${leg.origin} → ${leg.destination}`;
    const description = [
      TRAVEL_MODE_LABEL[leg.mode],
      leg.carrier,
      leg.bookingRef ? `Booking no. ${leg.bookingRef}` : null,
      leg.seat ? `Seat ${leg.seat}` : null,
      leg.notes,
    ];
    if (leg.departTime) {
      const arriveDay = leg.arriveDate ?? leg.departDate;
      const [endDay, endTime] = leg.arriveTime ? [arriveDay, leg.arriveTime] : plusHour(leg.departDate, leg.departTime);
      events.push({
        uid: `leg-${leg.id}`,
        summary: `${title}${leg.carrier ? ` · ${leg.carrier}` : ""}`,
        start: stamp(leg.departDate, leg.departTime),
        end: stamp(endDay, endTime),
        allDay: false,
        location: leg.origin,
        description,
      });
    } else {
      events.push({
        uid: `leg-${leg.id}`,
        summary: title,
        start: compactDay(leg.departDate),
        end: compactDay(addDays(leg.arriveDate ?? leg.departDate, 1)),
        allDay: true,
        description,
      });
    }
  }

  for (const idea of ideas.filter((entry) => entry.day)) {
    const [endDay, endTime] = idea.time ? plusHour(idea.day!, idea.time) : [addDays(idea.day!, 1), ""];
    events.push({
      uid: `idea-${idea.id}`,
      summary: idea.name,
      start: idea.time ? stamp(idea.day!, idea.time) : compactDay(idea.day!),
      end: idea.time ? stamp(endDay, endTime) : compactDay(endDay),
      allDay: !idea.time,
      location: idea.mapsUrl ?? [idea.name, idea.city?.name, "Japan"].filter(Boolean).join(", "),
      description: [idea.notes],
    });
  }

  for (const todo of todos.filter((entry) => !entry.done && entry.dueDate)) {
    events.push({
      uid: `todo-${todo.id}`,
      summary: `To-do: ${todo.title}`,
      start: compactDay(todo.dueDate!),
      end: compactDay(addDays(todo.dueDate!, 1)),
      allDay: true,
      alarmDaysBefore: 1,
    });
  }

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tabi//Trip planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(trip.name)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...events.flatMap((event) => render(event, now)),
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");

  return new Response(`${body}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="tabi.ics"',
      "Cache-Control": "no-store",
    },
  });
}
