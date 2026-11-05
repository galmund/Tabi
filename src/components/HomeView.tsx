"use client";

import Link from "next/link";
import {
  BedDouble,
  CalendarX,
  ChevronRight,
  CircleCheck,
  Clock,
  Lightbulb,
  ListChecks,
  Moon,
  Settings,
  StickyNote,
} from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { PhotoStrip } from "@/components/PhotoViewer";
import { RouteBar } from "@/components/RouteBar";
import { IdeaSummary, LegSummary } from "@/components/rows";
import { Card, CityTag, GroupedList, MapButtons, SectionHeader, Tag } from "@/components/ui";
import {
  addDays,
  daysBetween,
  formatDay,
  formatRange,
  formatShortDay,
  formatWeekday,
  plural,
} from "@/lib/dates";
import { useToday } from "@/lib/device";
import {
  bookedStayOn,
  citiesOnDay,
  comingUp,
  missingRanges,
  nightStates,
  overnightLegOn,
  routeSegments,
  tripPhase,
} from "@/lib/plan";
import type { TripData } from "@/lib/trip";

const SOON_DAYS = 14;

export function HomeView({ data, serverToday }: { data: TripData; serverToday: string }) {
  const today = useToday(serverToday);
  const { trip, stays, legs, ideas, todos } = data;
  const phase = tripPhase(trip, today);
  const states = nightStates(trip, stays, legs);
  const missing = missingRanges(states);
  const covered = states.length - states.filter((state) => state.kind === "missing").length;
  const totalDays = daysBetween(trip.startDate, trip.endDate) + 1;
  const dayNumber = daysBetween(trip.startDate, today) + 1;
  const upcoming = comingUp(today, stays, todos);
  const overdue = todos.filter((todo) => !todo.done && todo.dueDate && todo.dueDate < today);
  const openTodos = todos.filter((todo) => !todo.done).length;
  const planned = ideas.filter((idea) => idea.day).length;
  const showMissing = missing.length > 0 && phase !== "after";

  const eyebrow =
    phase === "before"
      ? `${plural(daysBetween(today, trip.startDate), "day")} to go`
      : phase === "during"
        ? `Day ${dayNumber} of ${totalDays}`
        : "Okaeri — welcome home";

  return (
    <>
      <NavBar
        title={trip.name}
        eyebrow={eyebrow}
        trailing={
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent active:bg-fill lg:hidden"
          >
            <Settings className="h-[22px] w-[22px]" />
          </Link>
        }
      />

      <div className="rise-in space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-8 lg:space-y-0">
        {phase === "during" ? (
          <TodaySection data={data} today={today} dayNumber={dayNumber} />
        ) : phase === "before" ? (
          <Countdown days={daysBetween(today, trip.startDate)} startDate={trip.startDate} endDate={trip.endDate} nights={states.length} />
        ) : null}

        <section className="lg:col-span-2">
          <SectionHeader title="Route" trailing={`${covered}/${states.length} nights`} />
          <Card>
            <RouteBar segments={routeSegments(states)} startDate={trip.startDate} endDate={trip.endDate} />
          </Card>
        </section>

        {showMissing ? (
          <section>
            <SectionHeader
              title="No hotel yet"
              trailing={plural(missing.reduce((sum, range) => sum + range.nights, 0), "night")}
            />
            <GroupedList inset={16 + 36 + 12}>
              {missing.map((range) => (
                <li key={range.from}>
                  <Link
                    href={`/bookings?add=stay&from=${range.from}&to=${addDays(range.to, 1)}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-fill"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bad/15 text-bad">
                      <BedDouble className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="tnum block text-[17px]">
                        {range.nights === 1 ? `Night of ${formatDay(range.from)}` : `${formatRange(range.from, range.to)} nights`}
                      </span>
                      <span className="block text-[14px] text-dim">{plural(range.nights, "night")} · tap to add a stay</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </GroupedList>
          </section>
        ) : null}

        <section className={showMissing ? undefined : "lg:col-span-2"}>
          <SectionHeader title="Coming up" />
          {upcoming.length + overdue.length === 0 ? (
            <Card className="flex items-center gap-3 text-[15px] text-dim">
              <CircleCheck className="h-5 w-5 shrink-0 text-good" />
              Nothing due in the next few weeks.
            </Card>
          ) : (
            <GroupedList inset={16 + 36 + 12}>
              {overdue.map((todo) => (
                <ComingRow
                  key={`overdue-${todo.id}`}
                  href="/todos"
                  icon={<ListChecks className="h-[18px] w-[18px]" />}
                  tone="bad"
                  title={todo.title}
                  detail={`Overdue since ${formatDay(todo.dueDate!)}`}
                />
              ))}
              {upcoming.map((item) =>
                item.kind === "cancel" ? (
                  <ComingRow
                    key={`cancel-${item.stay.id}`}
                    href="/bookings"
                    icon={<CalendarX className="h-[18px] w-[18px]" />}
                    tone={daysBetween(today, item.day) <= SOON_DAYS ? "orange" : "neutral"}
                    title={`Free cancellation ends · ${item.stay.name}`}
                    detail={`${formatDay(item.day)} · ${inDays(today, item.day)}`}
                  />
                ) : (
                  <ComingRow
                    key={`todo-${item.todo.id}`}
                    href="/todos"
                    icon={<ListChecks className="h-[18px] w-[18px]" />}
                    tone={daysBetween(today, item.day) <= SOON_DAYS ? "accent" : "neutral"}
                    title={item.todo.title}
                    detail={`Due ${formatDay(item.day)} · ${inDays(today, item.day)}`}
                  />
                )
              )}
            </GroupedList>
          )}
        </section>

        <section
          className={`grid grid-cols-3 gap-2 lg:gap-3 ${
            phase === "before" ? "lg:col-start-2 lg:row-start-1 lg:self-stretch" : "lg:col-span-2"
          }`}
        >
          <Stat href="/bookings" icon={<Moon className="h-5 w-5" />} value={`${covered}/${states.length}`} label="Nights covered" />
          <Stat href="/ideas" icon={<Lightbulb className="h-5 w-5" />} value={`${planned}/${ideas.length}`} label="Ideas planned" />
          <Stat href="/todos" icon={<ListChecks className="h-5 w-5" />} value={String(openTodos)} label="To-dos open" />
        </section>
      </div>
    </>
  );
}

function inDays(today: string, day: string): string {
  const days = daysBetween(today, day);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function Countdown({
  days,
  startDate,
  endDate,
  nights,
}: {
  days: number;
  startDate: string;
  endDate: string;
  nights: number;
}) {
  return (
    <Card className="flex items-center gap-4 py-5 lg:self-stretch">
      <div className="text-center">
        <p className="num text-[44px] font-bold leading-none text-accent">{days}</p>
        <p className="mt-1 text-[13px] font-medium text-dim">{days === 1 ? "day" : "days"}</p>
      </div>
      <div className="min-w-0 border-l border-line pl-4">
        <p className="text-[17px] font-semibold">
          {formatShortDay(startDate)} → {formatShortDay(endDate)}
        </p>
        <p className="mt-0.5 text-[15px] text-dim">
          {plural(nights, "night")} · {startDate.slice(0, 4)}
        </p>
      </div>
    </Card>
  );
}

function TodaySection({ data, today, dayNumber }: { data: TripData; today: string; dayNumber: number }) {
  const { trip, stays, legs, ideas, notes, dayCities } = data;
  const cities = citiesOnDay(stays, today, dayCities);
  const todaysLegs = legs.filter((leg) => leg.departDate === today || leg.arriveDate === today);
  const activities = ideas.filter((idea) => idea.day === today);
  const note = notes.find((entry) => entry.day === today)?.text;
  const tonight = bookedStayOn(stays, today);
  const inTransit = overnightLegOn(legs, today);
  const lastDay = today === trip.endDate;

  return (
    <>
      <section>
        <SectionHeader
          title={formatWeekday(today)}
          trailing={
            <Link href={`/days#day-${today}`} className="text-accent">
              Day {dayNumber}
            </Link>
          }
        />
        <Card className="space-y-3">
          {cities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => (
                <CityTag key={city.id} city={city} />
              ))}
            </div>
          ) : null}
          {todaysLegs.map((leg) => (
            <div key={leg.id} className="space-y-2">
              <LegSummary leg={leg} />
              <PhotoStrip title={`${leg.origin} → ${leg.destination}`} photos={leg.photos} />
            </div>
          ))}
          {activities.map((idea) => (
            <IdeaSummary key={idea.id} idea={idea} />
          ))}
          {note ? (
            <p className="flex gap-2 whitespace-pre-wrap text-[15px] text-dim">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
              {note}
            </p>
          ) : null}
          {todaysLegs.length + activities.length === 0 && !note ? (
            <p className="text-[15px] text-dim">Nothing planned — a free day.</p>
          ) : null}
        </Card>
      </section>

      {lastDay ? null : (
        <section>
          <SectionHeader title="Tonight" />
          {tonight ? (
            <Card className="space-y-3">
              <div>
                <p className="text-[20px] font-bold leading-tight">{tonight.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <CityTag city={tonight.city} />
                  {tonight.checkIn === today ? (
                    <Tag tone="accent">
                      <Clock className="h-3 w-3" />
                      Check-in from {tonight.checkInTime}
                    </Tag>
                  ) : null}
                  {tonight.checkOut === addDays(today, 1) ? (
                    <Tag>Check-out tomorrow by {tonight.checkOutTime}</Tag>
                  ) : null}
                </div>
              </div>
              {tonight.address ? <p className="text-[15px]">{tonight.address}</p> : null}
              {tonight.bookingRef ? (
                <p className="tnum text-[15px] text-dim">
                  Booking no. <span className="select-all text-ink">{tonight.bookingRef}</span>
                </p>
              ) : null}
              <PhotoStrip title={tonight.name} photos={tonight.photos} />
              <MapButtons query={tonight.address ?? `${tonight.name}, ${tonight.city.name}, Japan`} />
            </Card>
          ) : inTransit ? (
            <Card>
              <LegSummary leg={inTransit} />
            </Card>
          ) : (
            <Link href={`/bookings?add=stay&from=${today}&to=${addDays(today, 1)}`}>
              <Card className="flex items-center gap-3 text-[15px] text-bad">
                <BedDouble className="h-5 w-5 shrink-0" />
                No hotel booked for tonight — tap to add one.
              </Card>
            </Link>
          )}
        </section>
      )}
    </>
  );
}

function ComingRow({
  href,
  icon,
  tone,
  title,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  tone: "bad" | "orange" | "accent" | "neutral";
  title: string;
  detail: string;
}) {
  const tones = {
    bad: "bg-bad/15 text-bad",
    orange: "bg-orange/15 text-orange",
    accent: "bg-accent/15 text-accent",
    neutral: "bg-fill text-dim",
  };
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 active:bg-fill">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px]">{title}</span>
          <span className="tnum block text-[14px] text-dim">{detail}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
      </Link>
    </li>
  );
}

function Stat({
  href,
  icon,
  value,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Link href={href} className="pressable flex flex-col items-center rounded-card bg-elev px-2 py-4 text-center">
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
        {icon}
      </span>
      <span className="num text-[22px] font-bold leading-none">{value}</span>
      <span className="mt-1.5 text-[12px] font-medium leading-tight text-dim">{label}</span>
    </Link>
  );
}
