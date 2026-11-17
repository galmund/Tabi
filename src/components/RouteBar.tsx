"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { BedDouble, Car, ChevronRight, Flag, Plus, StickyNote, TrainFront, X, type LucideIcon } from "lucide-react";
import { IDEA_ICON, TRAVEL_ICON } from "@/components/icons";
import { addDays, daysBetween, eachDay, formatDay, formatRange, formatShortDay, plural } from "@/lib/dates";
import { IDEA_KIND_COLOR } from "@/lib/labels";
import { carOn, daysOfCar, newCarHref, newStayHref, type NightState, type RouteSegment } from "@/lib/plan";
import type { CarRow, LegRow, StayRow, TripData } from "@/lib/trip";

const TIP_WIDTH = 272;
const TIP_PLAN_LIMIT = 4;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

type Plan = { key: string; icon: LucideIcon; color?: string; time?: string | null; label: string };

export type RouteDay = {
  day: string;
  dayNumber: number;
  kind: RouteSegment["kind"] | "last";
  stayId?: string;
  cities: { name: string; color: string }[];
  sleep: string;
  car?: { id: string; company: string; booked: boolean; moment?: string };
  note?: string;
  plans: Plan[];
};

export function routeDays(
  trip: { startDate: string; endDate: string },
  states: NightState<StayRow, LegRow>[],
  data: Pick<TripData, "ideas" | "legs" | "dayCities" | "notes" | "cars">
): Map<string, RouteDay> {
  const byNight = new Map(states.map((state) => [state.night, state]));
  const days = new Map<string, RouteDay>();
  for (const day of eachDay(trip.startDate, trip.endDate)) {
    const state = byNight.get(day);
    const plans = [
      ...data.legs
        .filter((leg) => leg.departDate === day || leg.arriveDate === day)
        .map((leg) => {
          const departs = leg.departDate === day;
          return {
            order: (departs ? leg.departOrder : leg.arriveOrder) ?? -1,
            plan: {
              key: `l:${leg.id}`,
              icon: TRAVEL_ICON[leg.mode],
              time: departs ? leg.departTime : leg.arriveTime && `arr ${leg.arriveTime}`,
              label: `${leg.origin} → ${leg.destination}`,
            },
          };
        }),
      ...data.ideas
        .filter((idea) => idea.day === day)
        .map((idea) => ({
          order: idea.dayOrder,
          plan: {
            key: `i:${idea.id}`,
            icon: IDEA_ICON[idea.kind],
            color: IDEA_KIND_COLOR[idea.kind],
            time: idea.time,
            label: idea.name,
          },
        })),
    ]
      .sort((a, b) => a.order - b.order)
      .map(({ plan }) => plan);

    const cities = state?.kind === "stay" ? [state.stay.city] : [];
    for (const { city } of data.dayCities.filter((entry) => entry.day === day)) {
      if (!cities.some((other) => other.id === city.id)) cities.push(city);
    }

    const car = carOn(data.cars, day);
    const moment = car
      ? [
          car.pickupDate === day ? `pick up${car.pickupTime ? ` ${car.pickupTime}` : ""}` : null,
          car.returnDate === day ? `return${car.returnTime ? ` ${car.returnTime}` : ""}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "";

    days.set(day, {
      day,
      dayNumber: daysBetween(trip.startDate, day) + 1,
      kind: state?.kind ?? "last",
      stayId: state?.kind === "stay" ? state.stay.id : undefined,
      cities: cities.map(({ name, color }) => ({ name, color })),
      note: data.notes.find((entry) => entry.day === day)?.text.trim() || undefined,
      sleep: !state
        ? "Last day of the trip"
        : state.kind === "stay"
          ? state.stay.name
          : state.kind === "transit"
            ? `Overnight ${state.leg.origin} → ${state.leg.destination}`
            : "No bed yet",
      car: car ? { id: car.id, company: car.company, booked: car.status === "BOOKED", moment: moment || undefined } : undefined,
      plans,
    });
  }
  return days;
}

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useFinePointer() {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );
}

function tileStyle(segment: RouteSegment): CSSProperties | undefined {
  const color = segment.city?.color;
  if (segment.kind !== "stay" || !color) return undefined;
  return {
    background: `linear-gradient(180deg, ${color} 0, ${color} 36%, color-mix(in srgb, ${color} 34%, var(--color-elev)) 100%)`,
  };
}

function placeOf(segment: RouteSegment) {
  if (segment.kind === "stay") return segment.city?.name ?? "Stay";
  return segment.kind === "transit" ? "In transit" : "No bed";
}

function hrefOf(segment: RouteSegment, city?: string) {
  if (segment.kind === "stay" && segment.stayId) return `/bookings?stay=${segment.stayId}`;
  if (segment.kind === "missing") {
    return newStayHref(segment.from, addDays(segment.from, segment.nights), city);
  }
  return undefined;
}

function formatSpan(from: string, out: string) {
  const [fromDay, fromMonth] = formatShortDay(from).split(" ");
  const [outDay, outMonth] = formatShortDay(out).split(" ");
  return fromMonth === outMonth ? `${fromDay}–${outDay} ${outMonth}` : `${fromDay} ${fromMonth} – ${outDay} ${outMonth}`;
}

function Swatch({ segment }: { segment: RouteSegment }) {
  if (segment.kind === "missing") return <span className="hatched-edge h-2.5 w-2.5 shrink-0 rounded-[2px]" />;
  if (segment.kind === "transit") return <span className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-elev3" />;
  return <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: segment.city?.color }} />;
}

function CarMark({ booked, className = "" }: { booked: boolean; className?: string }) {
  return (
    <Car
      aria-hidden
      strokeWidth={2.4}
      className={`shrink-0 ${booked ? "text-accent" : "text-dim opacity-70"} ${className}`}
    />
  );
}

function DayInfo({ info }: { info: RouteDay }) {
  const shown = info.plans.slice(0, TIP_PLAN_LIMIT);
  const more = info.plans.length - shown.length;
  const missing = info.kind === "missing";
  const SleepIcon = info.kind === "transit" ? TrainFront : info.kind === "last" ? Flag : BedDouble;
  return (
    <>
      <p className="tnum flex items-baseline justify-between gap-3 text-[14px] font-semibold">
        {formatDay(info.day)}
        <span className="text-[12px] font-medium text-dim">Day {info.dayNumber}</span>
      </p>
      {info.cities.length > 0 ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold">
          {info.cities.map((city) => (
            <span key={city.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: city.color }} />
              {city.name}
            </span>
          ))}
        </p>
      ) : null}
      <p className={`mt-1 flex items-center gap-1.5 text-[13px] ${missing ? "font-semibold text-bad" : "text-dim"}`}>
        <SleepIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{info.sleep}</span>
      </p>
      {info.car ? (
        <p className="mt-1 flex items-center gap-1.5 text-[13px]">
          <CarMark booked={info.car.booked} className="h-3.5 w-3.5" />
          <span className="min-w-0 truncate">
            <span className="font-semibold">{info.car.company}</span>
            {info.car.booked ? "" : " · option, not booked"}
            {info.car.moment ? <span className="text-dim"> · {info.car.moment}</span> : null}
          </span>
        </p>
      ) : null}
      <div className="mt-2 space-y-1.5 border-t-[0.5px] border-line pt-2">
        {shown.length === 0 && !info.note ? <p className="text-[13px] text-dim">Nothing planned yet</p> : null}
        {shown.length > 0 ? (
          <ul className="space-y-1">
            {shown.map((plan) => (
              <li key={plan.key} className="flex items-center gap-2 text-[13px]">
                <plan.icon className="h-3.5 w-3.5 shrink-0 text-dim" style={plan.color ? { color: plan.color } : undefined} />
                <span className="min-w-0 flex-1 truncate">{plan.label}</span>
                {plan.time ? <span className="tnum shrink-0 text-[12px] text-dim">{plan.time}</span> : null}
              </li>
            ))}
            {more > 0 ? <li className="pl-[22px] text-[12px] text-dim">+{more} more</li> : null}
          </ul>
        ) : null}
        {info.note ? (
          <p className="flex gap-2 text-[13px] text-dim">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2 whitespace-pre-line">{info.note}</span>
          </p>
        ) : null}
      </div>
    </>
  );
}

const primaryButton =
  "pressable flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1 text-[13px] font-semibold text-on-accent hover:brightness-110";
const secondaryButton =
  "pressable flex shrink-0 items-center gap-1 rounded-full bg-accent/12 px-3 py-1 text-[13px] font-semibold text-accent hover:bg-accent/18";

function cellStyle(info: RouteDay): CSSProperties | undefined {
  const color = info.kind === "stay" ? info.cities[0]?.color : undefined;
  if (color) return { backgroundColor: `color-mix(in srgb, ${color} 20%, var(--color-elev))` };
  if (info.kind === "missing") return { backgroundColor: "color-mix(in srgb, var(--color-bad) 9%, var(--color-elev))" };
  return undefined;
}

export function RouteBar({
  segments,
  days,
  cars,
  startDate,
  endDate,
  today,
}: {
  segments: RouteSegment[];
  days: Map<string, RouteDay>;
  cars: CarRow[];
  startDate: string;
  endDate: string;
  today?: string;
}) {
  const fine = useFinePointer();
  const stripRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ day: string; x: number; width: number } | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const lastNight = addDays(endDate, -1);

  const cityFor = (from: string, to: string) =>
    days.get(from)?.cities[0]?.name ??
    days.get(addDays(from, -1))?.cities[0]?.name ??
    days.get(addDays(to, 1))?.cities[0]?.name;
  const stops = segments.map((segment) => ({
    segment,
    href: hrefOf(segment, cityFor(segment.from, addDays(segment.from, segment.nights - 1))),
  }));
  const hasCarNight = segments.some((segment) =>
    Array.from({ length: segment.nights }, (_, night) => days.get(addDays(segment.from, night))?.car).some(Boolean)
  );

  const order = (a: string, b: string) => (a <= b ? [a, b] : [b, a]);
  const other = end ?? hovered ?? anchor;
  const selection = anchor && other && anchor !== endDate ? order(anchor, other) : null;
  const chosen = anchor && anchor !== endDate ? order(anchor, end ?? anchor) : null;
  const previewed = selection ?? chosen;

  useEffect(() => {
    if (!anchor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anchor]);

  function pick(day: string) {
    if (anchor && !end && day === anchor) return clearSelection();
    if (day === endDate) {
      if (anchor && !end && anchor !== endDate) setEnd(lastNight);
      else {
        setAnchor(endDate);
        setEnd(null);
      }
      return;
    }
    if (!anchor || end || anchor === endDate) {
      setAnchor(day);
      setEnd(null);
    } else {
      setEnd(day);
    }
  }

  function showTip(day: string, element: HTMLElement) {
    const strip = stripRef.current;
    if (!strip) return;
    const box = strip.getBoundingClientRect();
    const tile = element.getBoundingClientRect();
    setTip({ day, x: tile.left + tile.width / 2 - box.left, width: box.width });
    setHovered(day);
  }

  function clearSelection() {
    setAnchor(null);
    setEnd(null);
  }

  const inRange = (day: string, range: string[] | null) => (range ? range[0] <= day && day <= range[1] : false);
  const stayHref = chosen ? newStayHref(chosen[0], addDays(chosen[1], 1), cityFor(chosen[0], chosen[1])) : null;
  const carHref = chosen ? newCarHref(chosen[0], chosen[1]) : null;
  const tipInfo = tip ? days.get(tip.day) : undefined;
  const tipLeft = tip ? Math.min(Math.max(tip.x - TIP_WIDTH / 2, 0), Math.max(tip.width - TIP_WIDTH, 0)) : 0;
  const focused = anchor && !end ? days.get(anchor) : undefined;

  const leading = (new Date(`${startDate}T00:00:00Z`).getUTCDay() + 6) % 7;
  const calendar = [...Array.from({ length: leading }, () => null), ...eachDay(startDate, endDate)];

  return (
    <div>
      <div className="relative hidden md:block">
        {fine && tip && tipInfo ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full z-20 mb-3 rounded-[12px] bg-elev2 px-3 py-2.5 shadow-lift"
            style={{ left: tipLeft, width: TIP_WIDTH }}
          >
            <DayInfo info={tipInfo} />
            <span
              className="absolute top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-elev2"
              style={{ left: tip.x - tipLeft }}
            />
          </div>
        ) : null}
        <div
          ref={stripRef}
          onPointerLeave={() => {
            setTip(null);
            setHovered(null);
          }}
        >
          <div className="flex h-10 gap-[3px]" aria-hidden={!fine}>
            {stops.map(({ segment, href }) => {
              const tiles = Array.from({ length: segment.nights }, (_, night) => {
                const day = addDays(segment.from, night);
                const selected = inRange(day, selection);
                const className = `min-w-0 flex-1 rounded-[3px] transition-[filter,opacity] duration-150 ${
                  segment.kind === "missing" ? "hatched-edge" : segment.kind === "transit" ? "bg-elev3" : ""
                } ${day === today ? "outline-2 outline-offset-2 outline-ink" : ""} ${
                  selection && !selected ? "opacity-30" : ""
                } ${selected ? "brightness-115" : ""}`;
                if (!fine) return <span key={day} className={className} style={tileStyle(segment)} />;
                const info = days.get(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`${formatDay(day)}, ${info?.cities.map((city) => `${city.name}, `).join("") ?? ""}${info?.sleep ?? ""}${info?.car ? `, car ${info.car.booked ? "booked" : "planned"}` : ""}. Select`}
                    aria-pressed={selected}
                    className={`${className} cursor-pointer hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                    style={tileStyle(segment)}
                    onPointerEnter={(event) => showTip(day, event.currentTarget)}
                    onFocus={(event) => {
                      if (event.currentTarget.matches(":focus-visible")) showTip(day, event.currentTarget);
                    }}
                    onBlur={() => setTip(null)}
                    onClick={() => pick(day)}
                  />
                );
              });
              const style = { flex: `${segment.nights} 1 0` };
              return href && !fine ? (
                <Link key={segment.key} href={href} tabIndex={-1} className="flex min-w-0 gap-[2px]" style={style}>
                  {tiles}
                </Link>
              ) : (
                <span key={segment.key} className="flex min-w-0 gap-[2px]" style={style}>
                  {tiles}
                </span>
              );
            })}
          </div>
          {hasCarNight ? (
            <div className="mt-1 flex h-3.5 gap-[3px]" aria-hidden>
              {segments.map((segment) => (
                <span key={segment.key} className="flex min-w-0 gap-[2px]" style={{ flex: `${segment.nights} 1 0` }}>
                  {Array.from({ length: segment.nights }, (_, night) => {
                    const day = addDays(segment.from, night);
                    const car = days.get(day)?.car;
                    return (
                      <span key={day} className="flex min-w-0 flex-1 justify-center">
                        {car ? <CarMark booked={car.booked} className="h-3.5 w-3.5" /> : null}
                      </span>
                    );
                  })}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="tnum mt-2 hidden min-h-6 items-center justify-between gap-3 text-[12px] font-medium text-dim md:flex">
        <span className="shrink-0">{formatShortDay(startDate)}</span>
        {fine && chosen && previewed ? (
          <span className="flex min-w-0 items-center gap-2" aria-live="polite">
            <span className="truncate text-[13px] font-semibold text-ink">
              {formatSpan(previewed[0], addDays(previewed[1], 1))} · {plural(daysBetween(previewed[0], previewed[1]) + 1, "night")}
            </span>
            {end ? null : <span className="hidden truncate xl:inline">· click another night to extend</span>}
            <Link href={stayHref!} className={primaryButton}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add stay
            </Link>
            <Link href={carHref!} className={secondaryButton}>
              <Car className="h-3.5 w-3.5" />
              Plan car
            </Link>
            <button
              type="button"
              aria-label="Clear selection"
              onClick={clearSelection}
              className="pressable flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-dim hover:bg-fill hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : fine ? (
          <span className="truncate">Click a night, then another, to add a stay or car for those dates</span>
        ) : null}
        <span className="shrink-0">{formatShortDay(endDate)}</span>
      </div>

      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1 pb-1.5 text-center text-[11px] font-semibold text-dim" aria-hidden>
          {WEEKDAYS.map((weekday, index) => (
            <span key={index}>{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" role="group" aria-label="Trip calendar">
          {calendar.map((day, index) => {
            if (!day) return <span key={`blank-${index}`} />;
            const info = days.get(day)!;
            const date = Number(day.slice(8));
            const selected = inRange(day, chosen) || anchor === day;
            const dim = (chosen || anchor) && !selected;
            return (
              <button
                key={day}
                type="button"
                onClick={() => pick(day)}
                aria-pressed={selected}
                aria-label={`${formatDay(day)}, ${info.cities.map((city) => `${city.name}, `).join("")}${info.sleep}${info.car ? `, car ${info.car.booked ? "booked" : "planned"}` : ""}`}
                className={`pressable relative flex h-12 flex-col items-start overflow-hidden rounded-[8px] px-1.5 pt-1 text-left transition-opacity duration-150 ${
                  info.kind === "transit" ? "bg-elev2" : info.kind === "last" ? "bg-fill" : ""
                } ${selected ? "ring-2 ring-inset ring-accent" : ""} ${dim ? "opacity-40" : ""} ${
                  day === today ? "outline-2 outline-offset-1 outline-ink" : ""
                }`}
                style={cellStyle(info)}
              >
                <span className="tnum text-[15px] font-semibold leading-none">{date}</span>
                {date === 1 || index === leading ? (
                  <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.04em] text-dim">
                    {formatShortDay(day).split(" ")[1]}
                  </span>
                ) : null}
                {info.car ? <CarMark booked={info.car.booked} className="absolute bottom-[9px] right-1 h-3 w-3" /> : null}
                {info.kind === "last" ? (
                  <Flag aria-hidden className="absolute bottom-1.5 left-1.5 h-3 w-3 text-dim" />
                ) : (
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-0 h-1.5 ${
                      info.kind === "missing" ? "hatched-edge" : info.kind === "transit" ? "bg-elev3" : ""
                    }`}
                    style={info.kind === "stay" && info.cities[0] ? { backgroundColor: info.cities[0].color } : undefined}
                  />
                )}
              </button>
            );
          })}
        </div>

        {anchor ? (
          <div className="mt-3 rounded-[12px] bg-elev2 px-3 py-2.5" aria-live="polite">
            {focused ? (
              <>
                <DayInfo info={focused} />
                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t-[0.5px] border-line pt-2.5">
                  {focused.kind === "stay" && focused.stayId ? (
                    <Link href={`/bookings?stay=${focused.stayId}`} className={secondaryButton}>
                      <BedDouble className="h-3.5 w-3.5" />
                      Open stay
                    </Link>
                  ) : focused.kind !== "last" ? (
                    <Link href={stayHref!} className={focused.kind === "missing" ? primaryButton : secondaryButton}>
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Add stay
                    </Link>
                  ) : null}
                  <Link
                    href={focused.car ? `/bookings?car=${focused.car.id}` : newCarHref(focused.day, focused.day)}
                    className={secondaryButton}
                  >
                    <Car className="h-3.5 w-3.5" />
                    {focused.car ? "Open car" : "Plan car"}
                  </Link>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={clearSelection}
                    className="pressable ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-dim hover:bg-fill hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {focused.kind !== "last" ? (
                  <p className="mt-2 text-[12px] text-dim">Tap another day to choose more nights.</p>
                ) : null}
              </>
            ) : chosen ? (
              <>
                <p className="tnum text-[15px] font-semibold">
                  {formatSpan(chosen[0], addDays(chosen[1], 1))} · {plural(daysBetween(chosen[0], chosen[1]) + 1, "night")}
                </p>
                <p className="tnum mt-0.5 text-[13px] text-dim">
                  Check in {formatDay(chosen[0])} · out {formatDay(addDays(chosen[1], 1))}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Link href={stayHref!} className={primaryButton}>
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Add stay
                  </Link>
                  <Link href={carHref!} className={secondaryButton}>
                    <Car className="h-3.5 w-3.5" />
                    Plan car
                  </Link>
                  <button
                    type="button"
                    aria-label="Clear selection"
                    onClick={clearSelection}
                    className="pressable ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-dim hover:bg-fill hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-dim">Tap a day for its plan, then another to pick nights.</p>
        )}
      </div>

      <ol
        aria-label="Where we sleep each night"
        className="-mx-2 mt-3.5 flex flex-wrap items-center gap-x-1 gap-y-1.5 border-t-[0.5px] border-line pt-3"
      >
        {stops.map(({ segment, href }, index) => {
          const missing = segment.kind === "missing";
          const span = formatSpan(segment.from, addDays(segment.from, segment.nights));
          const content = (
            <>
              <span className="flex items-center gap-1.5 text-[14px] leading-tight">
                {missing ? <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> : <Swatch segment={segment} />}
                <span className="font-semibold">{missing ? `${plural(segment.nights, "night")} no bed` : placeOf(segment)}</span>
                {missing ? null : <span className="tnum text-dim">{segment.nights}n</span>}
              </span>
              <span className={`tnum mt-0.5 block text-[12px] ${missing ? "text-bad/80" : "text-dim"}`}>{span}</span>
            </>
          );
          const base = `block rounded-[8px] px-2 py-1.5 ${missing ? "bg-bad/10 text-bad" : ""}`;
          return (
            <li key={segment.key} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-dim/60" aria-hidden /> : null}
              {href ? (
                <Link
                  href={href}
                  aria-label={
                    missing
                      ? `Add a stay for ${plural(segment.nights, "night")}, ${span}`
                      : `${placeOf(segment)}, ${plural(segment.nights, "night")}, ${span}`
                  }
                  className={`${base} pressable transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${
                    missing ? "hover:bg-bad/15 active:bg-bad/20" : "hover:bg-fill active:bg-fill"
                  }`}
                >
                  {content}
                </Link>
              ) : (
                <span className={base}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>

      {cars.length > 0 ? (
        <ul aria-label="Rental cars" className="-mx-2 mt-1.5 flex flex-wrap gap-1">
          {cars.map((car) => {
            const booked = car.status === "BOOKED";
            return (
              <li key={car.id}>
                <Link
                  href={`/bookings?car=${car.id}`}
                  className={`pressable flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[13px] transition-colors duration-150 hover:bg-fill ${
                    booked ? "" : "border border-dashed border-accent/50"
                  }`}
                >
                  <CarMark booked={booked} className="h-3.5 w-3.5" />
                  <span className="font-semibold">{car.company}</span>
                  <span className="tnum text-dim">
                    {formatRange(car.pickupDate, car.returnDate)} · {plural(daysOfCar(car), "day")}
                  </span>
                  {booked ? null : <span className="text-[12px] font-semibold text-accent">Option</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
