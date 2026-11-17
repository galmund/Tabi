"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, BedDouble, Car, LogIn, LogOut, Plane, Plus, StickyNote } from "lucide-react";
import { addDayCity, arrangeDay, scheduleIdea, setDayCity } from "@/app/actions";
import { useActivityDrag } from "@/components/ActivityDrag";
import { LegSheet } from "@/components/BookingSheets";
import { EditButton, IdeaDetail, LegDetail } from "@/components/DetailSheets";
import { DayPickerSheet, IdeaSheet } from "@/components/IdeaSheets";
import { DayStrip } from "@/components/DayStrip";
import { NavBar } from "@/components/NavBar";
import { ideaMapsHref, legTransitHref, PinLink } from "@/components/quick";
import { Suggestions } from "@/components/Suggestions";
import { IdeaSummary, LegSummary } from "@/components/rows";
import { FormGroup, GroupLabel } from "@/components/form";
import { Sheet } from "@/components/Sheet";
import { saveOrQueue } from "@/components/QueueSync";
import { safely, useToast } from "@/components/Toast";
import { useQueuedValue } from "@/lib/queue";
import { CityDot, CityTag, StationMark, Tag } from "@/components/ui";
import { addDays, daysBetween, formatDay, formatRange, plural } from "@/lib/dates";
import { useToday } from "@/lib/device";
import {
  bookedStayOn,
  carDays,
  carOn,
  dayOptions,
  newCarHref,
  newStayHref,
  nightStates,
  overnightLegOn,
  timeClashes,
  type DayOption,
} from "@/lib/plan";
import type { CarRow, CityRow, IdeaRow, LegRow, TripData } from "@/lib/trip";

type Editing =
  | { kind: "idea"; idea: IdeaRow; fromDetail?: boolean }
  | { kind: "view-idea"; id: string }
  | { kind: "view-leg"; id: string }
  | { kind: "move"; idea: IdeaRow }
  | { kind: "new-idea"; day: string; city?: string }
  | { kind: "add"; day: DayOption }
  | { kind: "new-leg"; day: string }
  | { kind: "leg"; leg: LegRow; fromDetail?: boolean }
  | { kind: "cities"; day: string }
  | null;

export function DaysView({ data, serverToday }: { data: TripData; serverToday: string }) {
  const today = useToday(serverToday);
  const { trip, stays, notes, cities, dayCities } = data;
  const serverKey = [
    ...data.ideas.map((idea) => `${idea.id}:${idea.day}:${idea.dayOrder}`),
    ...data.legs.map((leg) => `${leg.id}:${leg.departDate}:${leg.arriveDate}:${leg.departOrder}:${leg.arriveOrder}`),
  ].join(",");
  const [arranged, setArranged] = useState<{ key: string; ideas: IdeaRow[]; legs: LegRow[] } | null>(null);
  const ideas = arranged?.key === serverKey ? arranged.ideas : data.ideas;
  const legs = arranged?.key === serverKey ? arranged.legs : data.legs;
  const days = dayOptions(trip, stays, ideas, dayCities);
  const missingNights = nightStates(trip, stays, legs)
    .filter((state) => state.kind === "missing")
    .map((state) => state.night);
  const [editing, setEditing] = useState<Editing>(null);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const drag = useActivityDrag({
    days: days.map((option) => option.day),
    order: (day) => dayItems(day, ideas, legs).map((item) => item.key),
    onDrop: (moved, day, keys, fromDay) => {
      const [kind, movedId] = moved.split(":");
      const shift = daysBetween(fromDay, day);
      const position = (key: string) => keys.indexOf(key);
      const nextIdeas = ideas
        .map((idea) => (kind === "i" && idea.id === movedId ? { ...idea, day } : idea))
        .map((idea) => (idea.day === day ? { ...idea, dayOrder: position(`i:${idea.id}`) } : idea))
        .sort((a, b) => a.dayOrder - b.dayOrder);
      const nextLegs = legs
        .map((leg) =>
          kind === "l" && leg.id === movedId && shift !== 0
            ? {
                ...leg,
                departDate: addDays(leg.departDate, shift),
                arriveDate: leg.arriveDate ? addDays(leg.arriveDate, shift) : null,
                departOrder: null,
                arriveOrder: null,
              }
            : leg
        )
        .map((leg) =>
          leg.departDate === day
            ? { ...leg, departOrder: position(`l:${leg.id}`) }
            : leg.arriveDate === day
              ? { ...leg, arriveOrder: position(`l:${leg.id}`) }
              : leg
        )
        .sort(
          (a, b) =>
            a.departDate.localeCompare(b.departDate) || (a.departTime ?? "~").localeCompare(b.departTime ?? "~")
        );
      setArranged({ key: serverKey, ideas: nextIdeas, legs: nextLegs });
      startTransition(async () => {
        const result = await safely(arrangeDay(day, keys, moved, fromDay));
        if (!result.ok) {
          setArranged(null);
          toast({ message: result.error, tone: "bad" });
        }
      });
    },
    renderGhost: (key) => {
      const [kind, id] = key.split(":");
      const idea = kind === "i" ? ideas.find((candidate) => candidate.id === id) : undefined;
      const leg = kind === "l" ? legs.find((candidate) => candidate.id === id) : undefined;
      return idea ? <IdeaSummary idea={idea} /> : leg ? <LegSummary leg={leg} /> : null;
    },
  });
  const viewingIdea = editing?.kind === "view-idea" ? ideas.find((idea) => idea.id === editing.id) : undefined;
  const viewingLeg = editing?.kind === "view-leg" ? legs.find((leg) => leg.id === editing.id) : undefined;
  const citiesDay = editing?.kind === "cities" ? days.find((option) => option.day === editing.day) : undefined;

  useEffect(() => {
    if (window.location.hash) return;
    if (today >= trip.startDate && today <= trip.endDate) {
      document.getElementById(`day-${today}`)?.scrollIntoView({ block: "start" });
    }
  }, [today, trip.startDate, trip.endDate]);

  return (
    <>
      <NavBar title="Days" subtitle={`${formatRange(trip.startDate, trip.endDate)} · ${plural(days.length, "day")}`} />
      <DayStrip days={days} today={today} missing={missingNights} cars={carDays(data.cars)} />

      <div className="rise-in space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0 xl:grid-cols-2">
        {days.map((option) => (
          <DayCard
            key={option.day}
            option={option}
            isToday={option.day === today}
            isLast={option.day === trip.endDate}
            items={dayItems(option.day, ideas, legs)}
            note={notes.find((entry) => entry.day === option.day)?.text ?? ""}
            cars={data.cars}
            stay={bookedStayOn(stays, option.day)}
            leaving={stays.find((stay) => stay.status === "BOOKED" && stay.checkOut === option.day)}
            clashes={timeClashes(option.day, ideas, legs)}
            transit={overnightLegOn(legs, option.day)}
            allIdeas={ideas}
            onEdit={setEditing}
            drag={drag}
          />
        ))}
      </div>
      {drag.overlay}

      {editing?.kind === "idea" ? (
        <IdeaSheet
          key={editing.idea.id}
          idea={editing.idea}
          cities={cities}
          onDone={() => setEditing(editing.fromDetail ? { kind: "view-idea", id: editing.idea.id } : null)}
        />
      ) : null}
      {viewingIdea ? (
        <IdeaDetail
          key={viewingIdea.id}
          idea={viewingIdea}
          onEdit={() => setEditing({ kind: "idea", idea: viewingIdea, fromDetail: true })}
          onMove={() => setEditing({ kind: "move", idea: viewingIdea })}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {viewingLeg ? (
        <LegDetail
          key={viewingLeg.id}
          leg={viewingLeg}
          onEdit={() => setEditing({ kind: "leg", leg: viewingLeg, fromDetail: true })}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === "new-idea" ? (
        <IdeaSheet
          key={`new-${editing.day}`}
          cities={cities}
          defaultDay={editing.day}
          defaultCity={editing.city}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === "move" ? (
        <DayPickerSheet key={editing.idea.id} idea={editing.idea} days={days} onDone={() => setEditing(null)} />
      ) : null}
      {editing?.kind === "new-leg" ? (
        <LegSheet key={`new-${editing.day}`} defaultDay={editing.day} onDone={() => setEditing(null)} />
      ) : null}
      {editing?.kind === "leg" ? (
        <LegSheet
          key={editing.leg.id}
          leg={editing.leg}
          onDone={() => setEditing(editing.fromDetail ? { kind: "view-leg", id: editing.leg.id } : null)}
        />
      ) : null}
      {citiesDay ? (
        <DayCitiesSheet key={citiesDay.day} option={citiesDay} cities={cities} onDone={() => setEditing(null)} />
      ) : null}
      {editing?.kind === "add" ? (
        <AddActivitySheet
          key={editing.day.day}
          option={editing.day}
          ideas={ideas.filter((idea) => !idea.day)}
          onNew={() =>
            setEditing({ kind: "new-idea", day: editing.day.day, city: editing.day.cities.at(-1)?.name })
          }
          onDone={() => setEditing((current) => (current?.kind === "add" ? null : current))}
        />
      ) : null}
    </>
  );
}

type DayItem = { key: string; order: number } & (
  | { kind: "leg"; leg: LegRow }
  | { kind: "idea"; idea: IdeaRow }
);

function dayItems(day: string, ideas: IdeaRow[], legs: LegRow[]): DayItem[] {
  const legItems: DayItem[] = legs
    .filter((leg) => leg.departDate === day || leg.arriveDate === day)
    .map((leg) => ({
      key: `l:${leg.id}`,
      order: (leg.departDate === day ? leg.departOrder : leg.arriveOrder) ?? -1,
      kind: "leg",
      leg,
    }));
  const ideaItems: DayItem[] = ideas
    .filter((idea) => idea.day === day)
    .map((idea) => ({ key: `i:${idea.id}`, order: idea.dayOrder, kind: "idea", idea }));
  return [...legItems, ...ideaItems].sort((a, b) => a.order - b.order);
}

function DayCard({
  option,
  isToday,
  isLast,
  items,
  note,
  cars,
  stay,
  leaving,
  clashes,
  transit,
  allIdeas,
  onEdit,
  drag,
}: {
  option: DayOption;
  isToday: boolean;
  isLast: boolean;
  items: DayItem[];
  note: string;
  cars: CarRow[];
  stay: TripData["stays"][number] | undefined;
  leaving: TripData["stays"][number] | undefined;
  clashes: Map<string, string>;
  transit: LegRow | undefined;
  allIdeas: IdeaRow[];
  onEdit: (editing: Editing) => void;
  drag: ReturnType<typeof useActivityDrag>;
}) {
  const dropping = drag.targetDay === option.day;
  const hasActivities = items.some((item) => item.kind === "idea");
  const nightColor = stay?.city.color;
  return (
    <section
      id={`day-${option.day}`}
      ref={drag.dayRef(option.day)}
      className={`card relative scroll-mt-[calc(var(--safe-top)+124px)] overflow-hidden transition-shadow duration-150 lg:scroll-mt-[calc(var(--safe-top)+132px)] ${
        dropping ? "ring-2 ring-accent/60" : isToday ? "ring-2 ring-accent" : ""
      }`}
    >
      {isLast ? null : nightColor ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16"
          style={{
            background: `linear-gradient(180deg, ${nightColor} 0, ${nightColor} 3px, color-mix(in srgb, ${nightColor} 16%, transparent) 3px, transparent 100%)`,
          }}
        />
      ) : transit ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-elev3" />
      ) : (
        <div aria-hidden className="hatched-edge pointer-events-none absolute inset-x-0 top-0 h-[3px]" />
      )}
      <header className="relative flex items-center justify-between gap-3 px-4 pb-2.5 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <StationMark number={option.number} label="day" tone={isToday ? "accent" : "ink"} />
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold leading-6 tracking-[-0.02em]">{formatDay(option.day)}</h2>
            {isToday ? <p className="text-[13px] font-semibold text-accent">Today</p> : null}
          </div>
        </div>
        <div className="flex items-start gap-1">
          <CarChip day={option.day} car={carOn(cars, option.day)} />
          <button
            type="button"
            onClick={() => onEdit({ kind: "cities", day: option.day })}
            aria-label={`Cities on ${formatDay(option.day)}`}
            className="flex flex-wrap justify-end gap-1 rounded-full press-fade"
          >
            {option.cities.map((city) => (
              <CityTag key={city.id} city={city} />
            ))}
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-fill px-2 py-0.5 text-[12px] font-semibold text-dim">
              <Plus className="h-3 w-3" strokeWidth={2.8} />
              {option.cities.length === 0 ? "City" : null}
            </span>
          </button>
        </div>
      </header>

      {cars
        .filter((car) => car.pickupDate === option.day)
        .map((car) => (
          <StayMoment
            key={`pickup-${car.id}`}
            icon={<Car className="h-4 w-4" />}
            label={`Pick up car${car.status === "OPTION" ? " (option)" : ""} · ${car.pickupPlace ?? car.company}`}
            time={car.pickupTime ?? ""}
            edge="bottom"
          />
        ))}
      {leaving && leaving.id !== stay?.id ? (
        <StayMoment
          icon={<LogOut className="h-4 w-4" />}
          label={`Check out of ${leaving.name}`}
          time={`by ${leaving.checkOutTime}`}
          edge={items.length > 0 ? "bottom" : undefined}
        />
      ) : null}
      <div ref={drag.anchorRef(option.day)} />
      {items.length > 0 ? (
        <ul className="separated">
          {items.map((item) => (
            <li
              key={item.key}
              ref={drag.rowRef(item.key, option.day)}
              data-drag-row
              className={`flex items-center gap-1 py-1.5 pl-1 pr-2 transition-opacity duration-150 ${
                drag.draggingId === item.key ? "opacity-30" : ""
              }`}
            >
              {item.kind === "leg" ? (
                <>
                  {drag.handle(item.key, option.day, `${item.leg.origin} to ${item.leg.destination}`)}
                  <button
                    type="button"
                    onClick={() => onEdit({ kind: "view-leg", id: item.leg.id })}
                    className="flex min-w-0 flex-1 items-center py-1 text-left"
                  >
                    <LegSummary leg={item.leg} />
                  </button>
                  <PinLink href={legTransitHref(item.leg)} label={`Directions to ${item.leg.destination}`} />
                  <EditButton
                    label={`Edit ${item.leg.origin} to ${item.leg.destination}`}
                    onClick={() => onEdit({ kind: "leg", leg: item.leg })}
                  />
                </>
              ) : (
                <>
                  {drag.handle(item.key, option.day, item.idea.name)}
                  <button
                    type="button"
                    onClick={() => onEdit({ kind: "view-idea", id: item.idea.id })}
                    className="flex min-w-0 flex-1 items-center py-1 text-left"
                  >
                    <IdeaSummary
                      idea={item.idea}
                      copy
                      trailing={
                        clashes.has(item.idea.id) ? (
                          <span className="flex min-w-0 items-center gap-1 text-orange">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{clashes.get(item.idea.id)}</span>
                          </span>
                        ) : null
                      }
                    />
                  </button>
                  <PinLink href={ideaMapsHref(item.idea)} label={`Open ${item.idea.name} in Google Maps`} />
                  <EditButton label={`Edit ${item.idea.name}`} onClick={() => onEdit({ kind: "idea", idea: item.idea })} />
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {cars
        .filter((car) => car.returnDate === option.day)
        .map((car) => (
          <StayMoment
            key={`return-${car.id}`}
            icon={<Car className="h-4 w-4" />}
            label={`Return car${car.status === "OPTION" ? " (option)" : ""} · ${car.returnPlace ?? car.company}`}
            time={car.returnTime ?? ""}
            edge="top"
          />
        ))}
      {stay && stay.checkIn === option.day ? (
        <StayMoment
          icon={<LogIn className="h-4 w-4" />}
          label={`Check in to ${stay.name}`}
          time={`from ${stay.checkInTime}`}
          edge={items.length > 0 || (leaving && leaving.id !== stay.id) ? "top" : undefined}
        />
      ) : null}

      {!hasActivities && option.cities.length > 0 ? (
        <Suggestions
          day={option.day}
          cities={option.cities}
          ideas={allIdeas}
          className={`px-4 py-2.5 ${items.length > 0 ? "border-t-[0.5px] border-line" : ""}`}
        />
      ) : null}

      <DayNote day={option.day} initial={note} />

      <div className="flex items-center gap-2 border-t-[0.5px] border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => onEdit({ kind: "add", day: option })}
          className="pressable hit-area flex h-8 items-center gap-1 rounded-full bg-accent/12 px-3 text-[14px] font-semibold text-accent hover:bg-accent/18"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Activity
        </button>
        <button
          type="button"
          onClick={() => onEdit({ kind: "new-leg", day: option.day })}
          className="pressable hit-area flex h-8 items-center gap-1 rounded-full bg-fill px-3 text-[14px] font-semibold text-accent hover:bg-accent/12"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Travel
        </button>
        <div className="min-w-0 flex-1 text-right text-[14px]">
          <SleepLine day={option.day} city={option.cities.at(-1)?.name} isLast={isLast} stay={stay} transit={transit} />
        </div>
      </div>
    </section>
  );
}

function StayMoment({
  icon,
  label,
  time,
  edge,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
  edge?: "top" | "bottom";
}) {
  const border = edge === "top" ? "border-t-[0.5px] border-line" : edge === "bottom" ? "border-b-[0.5px] border-line" : "";
  return (
    <p className={`flex items-center gap-2.5 px-4 py-2 text-[15px] text-dim ${border}`}>
      <span className="flex w-5 shrink-0 justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="tnum shrink-0 font-semibold text-ink">{time}</span>
    </p>
  );
}

function SleepLine({
  day,
  city,
  isLast,
  stay,
  transit,
}: {
  day: string;
  city?: string;
  isLast: boolean;
  stay: TripData["stays"][number] | undefined;
  transit: LegRow | undefined;
}) {
  if (isLast) {
    return (
      <span className="inline-flex items-center gap-1.5 text-dim">
        <Plane className="h-4 w-4" />
        Heading home
      </span>
    );
  }
  if (stay) {
    return (
      <Link href={`/bookings?stay=${stay.id}`} className="inline-flex max-w-full items-center gap-1.5 text-dim">
        <BedDouble className="h-4 w-4 shrink-0" />
        <span className="truncate text-ink">{stay.name}</span>
        <CityDot color={stay.city.color} className="h-2 w-2" />
      </Link>
    );
  }
  if (transit) {
    return (
      <span className="inline-flex items-center gap-1.5 text-dim">
        <Plane className="h-4 w-4" />
        Overnight travel
      </span>
    );
  }
  return (
    <Link
      href={newStayHref(day, addDays(day, 1), city)}
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-bad"
    >
      <BedDouble className="h-4 w-4 shrink-0" />
      No hotel<span className="hidden sm:inline lg:hidden xl:inline"> booked</span>
    </Link>
  );
}

function DayNote({ day, initial: saved }: { day: string; initial: string }) {
  const queued = useQueuedValue<string>(`note:${day}`);
  const initial = queued ?? saved;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [synced, setSynced] = useState(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  if (synced !== initial && !editing) {
    setSynced(initial);
    setValue(initial);
  }

  const save = () => {
    setEditing(false);
    if (value.trim() === initial.trim()) return;
    startTransition(async () => {
      const result = await saveOrQueue({ key: `note:${day}`, action: "dayNote", args: [day, value] });
      if (!result.ok) {
        toast({
          message: result.error,
          tone: "bad",
          action: { label: "Edit", run: () => setEditing(true) },
        });
      }
    });
  };

  if (!editing && !value.trim()) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-[15px] text-placeholder active:bg-fill"
      >
        <StickyNote className="h-4 w-4" />
        Add a note
      </button>
    );
  }

  return (
    <div className={`border-t border-line px-4 py-2.5 ${pending ? "opacity-60" : ""}`}>
      {editing ? (
        <textarea
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          rows={3}
          maxLength={4000}
          placeholder="Reservations, what to wear, who we're meeting…"
          className="input resize-none text-[15px] leading-snug"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full gap-2 text-left text-[15px] leading-snug text-dim"
        >
          <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="whitespace-pre-wrap">{value}</span>
        </button>
      )}
    </div>
  );
}

function AddActivitySheet({
  option,
  ideas,
  onNew,
  onDone,
}: {
  option: DayOption;
  ideas: IdeaRow[];
  onNew: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const cityIds = option.cities.map((city) => city.id);
  const suggested = ideas.filter((idea) => idea.cityId && cityIds.includes(idea.cityId));
  const others = ideas.filter((idea) => !suggested.includes(idea));

  const add = (idea: IdeaRow, close: () => void) =>
    startTransition(async () => {
      const result = await safely(scheduleIdea(idea.id, option.day));
      if (result.ok) close();
      else setError(result.error);
    });

  const list = (label: string, items: IdeaRow[], close: () => void) =>
    items.length > 0 ? (
      <div>
        <GroupLabel>{label}</GroupLabel>
        <FormGroup>
          {items.map((idea) => (
            <button
              key={idea.id}
              type="button"
              disabled={pending}
              onClick={() => add(idea, close)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left active:bg-fill disabled:opacity-60"
            >
              <IdeaSummary idea={idea} showCity />
              <Plus className="h-5 w-5 shrink-0 text-accent" />
            </button>
          ))}
        </FormGroup>
      </div>
    ) : null;

  return (
    <Sheet title={formatDay(option.day)} onDone={onDone}>
      {(close) => (
        <>
          <button
            type="button"
            onClick={() => {
              close();
              onNew();
            }}
            className="pressable flex h-12 w-full items-center gap-3 rounded-[12px] bg-group shadow-[var(--shadow-card)] px-4 text-[17px] font-medium text-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent">
              <Plus className="h-4 w-4" strokeWidth={2.8} />
            </span>
            New activity
          </button>
          {error ? <p className="rounded-[12px] bg-bad/15 px-4 py-3 text-[15px] text-bad">{error}</p> : null}
          {ideas.length === 0 ? (
            <p className="px-4 text-[15px] text-dim">
              Every idea is already on a day. Add more on the Ideas tab, or create one here.
            </p>
          ) : null}
          {list(
            option.cities.length > 0 ? `Ideas in ${option.cities.map((city) => city.name).join(" & ")}` : "Ideas",
            suggested,
            close
          )}
          {list(suggested.length > 0 ? "Everywhere else" : "Ideas", others, close)}
          {suggested.length === 0 && option.cities.length > 0 && ideas.length > 0 ? (
            <Tag>No ideas saved for {option.cities.map((city) => city.name).join(" or ")} yet</Tag>
          ) : null}
        </>
      )}
    </Sheet>
  );
}

function DayCitiesSheet({
  option,
  cities,
  onDone,
}: {
  option: DayOption;
  cities: CityRow[];
  onDone: () => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fromStays = cities.filter((city) => option.stayCityIds.includes(city.id));
  const choices = cities.filter((city) => !option.stayCityIds.includes(city.id));
  const isOn = (id: string) => overrides[id] ?? option.cities.some((city) => city.id === id);

  const toggle = (id: string) => {
    const on = !isOn(id);
    setOverrides((current) => ({ ...current, [id]: on }));
    setError(null);
    startTransition(async () => {
      const result = await safely(setDayCity(option.day, id, on));
      if (!result.ok) {
        setOverrides((current) => ({ ...current, [id]: !on }));
        setError(result.error);
      }
    });
  };

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await safely(addDayCity(option.day, trimmed));
      if (result.ok) setName("");
      else setError(result.error);
    });
  };

  return (
    <Sheet title={formatDay(option.day)} onDone={onDone}>
      {() => (
        <>
          {fromStays.length > 0 ? (
            <div>
              <GroupLabel>From your hotel</GroupLabel>
              <div className="flex flex-wrap gap-1.5">
                {fromStays.map((city) => (
                  <CityTag key={city.id} city={city} />
                ))}
              </div>
            </div>
          ) : null}
          {choices.length > 0 ? (
            <div>
              <GroupLabel>Cities this day</GroupLabel>
              <div className="flex flex-wrap gap-2">
                {choices.map((city) => {
                  const active = isOn(city.id);
                  return (
                    <button
                      key={city.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(city.id)}
                      className="pressable flex h-9 items-center rounded-full px-3.5 text-[15px] font-semibold"
                      style={{
                        color: active ? "#fff" : city.color,
                        backgroundColor: active ? city.color : `${city.color}22`,
                      }}
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div>
            <GroupLabel>New city</GroupLabel>
            <FormGroup>
              <div className="flex h-12 items-center gap-2 pl-4 pr-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      add();
                    }
                  }}
                  maxLength={60}
                  placeholder="Nikko, Hakone…"
                  aria-label="New city"
                  autoComplete="off"
                  className="input"
                />
                <button
                  type="button"
                  onClick={add}
                  disabled={pending || !name.trim()}
                  className="shrink-0 px-2 text-[17px] font-semibold text-accent disabled:text-placeholder"
                >
                  Add
                </button>
              </div>
            </FormGroup>
          </div>
          {error ? <p className="rounded-[12px] bg-bad/15 px-4 py-3 text-[15px] text-bad">{error}</p> : null}
        </>
      )}
    </Sheet>
  );
}

function CarChip({ day, car }: { day: string; car: CarRow | undefined }) {
  if (!car) {
    return (
      <Link
        href={newCarHref(day, day)}
        aria-label={`Plan a rental car from ${formatDay(day)}`}
        title="Plan a rental car"
        className="pressable hit-area inline-flex h-[22px] shrink-0 items-center gap-0.5 rounded-full bg-fill px-2 text-[12px] font-semibold text-dim hover:text-ink"
      >
        <Plus className="h-3 w-3" strokeWidth={2.8} />
        <Car className="h-3.5 w-3.5" strokeWidth={2.2} />
      </Link>
    );
  }
  const option = car.status === "OPTION";
  return (
    <Link
      href={`/bookings?car=${car.id}`}
      aria-label={`${option ? "Planned" : "Booked"} rental car: ${car.company}`}
      title={`${car.company}${option ? " · option, not booked yet" : " · booked"}`}
      className={`pressable hit-area inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 text-[12px] font-semibold ${
        option ? "border border-dashed border-accent/70 text-accent" : "bg-accent text-on-accent"
      }`}
    >
      <Car className="h-3.5 w-3.5" strokeWidth={2.2} />
      {option ? "Car?" : "Car"}
    </Link>
  );
}
