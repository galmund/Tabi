"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BedDouble, Plane, Plus, StickyNote } from "lucide-react";
import { addDayCity, arrangeDay, saveDayNote, scheduleIdea, setDayCity } from "@/app/actions";
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
import { CityDot, CityTag, Tag } from "@/components/ui";
import { addDays, daysBetween, formatDay, formatRange, plural } from "@/lib/dates";
import { useToday } from "@/lib/device";
import { bookedStayOn, dayOptions, nightStates, overnightLegOn, type DayOption } from "@/lib/plan";
import type { CityRow, IdeaRow, LegRow, TripData } from "@/lib/trip";

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
        await arrangeDay(day, keys, moved, fromDay);
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
      <NavBar title="Days" eyebrow={`${formatRange(trip.startDate, trip.endDate)} · ${plural(days.length, "day")}`} />
      <DayStrip days={days} today={today} missing={missingNights} />

      <div className="rise-in space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
        {days.map((option) => (
          <DayCard
            key={option.day}
            option={option}
            isToday={option.day === today}
            isLast={option.day === trip.endDate}
            items={dayItems(option.day, ideas, legs)}
            note={notes.find((entry) => entry.day === option.day)?.text ?? ""}
            stay={bookedStayOn(stays, option.day)}
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
  stay,
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
  stay: TripData["stays"][number] | undefined;
  transit: LegRow | undefined;
  allIdeas: IdeaRow[];
  onEdit: (editing: Editing) => void;
  drag: ReturnType<typeof useActivityDrag>;
}) {
  const dropping = drag.targetDay === option.day;
  const hasActivities = items.some((item) => item.kind === "idea");
  return (
    <section
      id={`day-${option.day}`}
      ref={drag.dayRef(option.day)}
      className={`scroll-mt-[calc(var(--safe-top)+124px)] lg:scroll-mt-[calc(var(--safe-top)+132px)] overflow-hidden rounded-card bg-elev transition-shadow duration-150 ${
        dropping ? "ring-2 ring-accent/60" : isToday ? "ring-2 ring-accent" : ""
      }`}
    >
      <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3.5">
        <div className="min-w-0">
          <p className="tnum text-[13px] font-semibold uppercase tracking-[0.02em] text-dim">
            Day {option.number}
            {isToday ? <span className="ml-1.5 text-accent">· Today</span> : null}
          </p>
          <h2 className="text-[20px] font-bold tracking-tight">{formatDay(option.day)}</h2>
        </div>
        <button
          type="button"
          onClick={() => onEdit({ kind: "cities", day: option.day })}
          aria-label={`Cities on ${formatDay(option.day)}`}
          className="flex flex-wrap justify-end gap-1 rounded-full pt-1 active:opacity-60"
        >
          {option.cities.map((city) => (
            <CityTag key={city.id} city={city} />
          ))}
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-fill px-2 py-0.5 text-[12px] font-semibold text-dim">
            <Plus className="h-3 w-3" strokeWidth={2.8} />
            {option.cities.length === 0 ? "City" : null}
          </span>
        </button>
      </header>

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
                    <IdeaSummary idea={item.idea} />
                  </button>
                  <PinLink href={ideaMapsHref(item.idea)} label={`Open ${item.idea.name} in Google Maps`} />
                  <EditButton label={`Edit ${item.idea.name}`} onClick={() => onEdit({ kind: "idea", idea: item.idea })} />
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {!hasActivities && option.cities.length > 0 ? (
        <Suggestions
          day={option.day}
          cities={option.cities}
          ideas={allIdeas}
          className={`px-4 py-2.5 ${items.length > 0 ? "border-t border-line" : ""}`}
        />
      ) : null}

      <DayNote day={option.day} initial={note} />

      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => onEdit({ kind: "add", day: option })}
          className="pressable flex h-8 items-center gap-1 rounded-full bg-accent/15 px-3 text-[14px] font-semibold text-accent"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Activity
        </button>
        <button
          type="button"
          onClick={() => onEdit({ kind: "new-leg", day: option.day })}
          className="pressable flex h-8 items-center gap-1 rounded-full bg-fill px-3 text-[14px] font-semibold text-accent"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Travel
        </button>
        <div className="min-w-0 flex-1 text-right text-[14px]">
          <SleepLine day={option.day} isLast={isLast} stay={stay} transit={transit} />
        </div>
      </div>
    </section>
  );
}

function SleepLine({
  day,
  isLast,
  stay,
  transit,
}: {
  day: string;
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
      <Link href="/bookings" className="inline-flex max-w-full items-center gap-1.5 text-dim">
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
      href={`/bookings?add=stay&from=${day}&to=${addDays(day, 1)}`}
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-bad"
    >
      <BedDouble className="h-4 w-4 shrink-0" />
      No hotel<span className="hidden sm:inline lg:hidden xl:inline"> booked</span>
    </Link>
  );
}

function DayNote({ day, initial }: { day: string; initial: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [synced, setSynced] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (synced !== initial && !editing) {
    setSynced(initial);
    setValue(initial);
  }

  const save = () => {
    setEditing(false);
    if (value.trim() === initial.trim()) return;
    startTransition(async () => {
      await saveDayNote(day, value);
    });
  };

  if (!editing && !value.trim()) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-[15px] text-faint active:bg-fill"
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
  const cityIds = option.cities.map((city) => city.id);
  const suggested = ideas.filter((idea) => idea.cityId && cityIds.includes(idea.cityId));
  const others = ideas.filter((idea) => !suggested.includes(idea));

  const add = (idea: IdeaRow, close: () => void) =>
    startTransition(async () => {
      const result = await scheduleIdea(idea.id, option.day);
      if (result.ok) close();
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
            className="pressable flex h-12 w-full items-center gap-3 rounded-[12px] bg-group px-4 text-[17px] font-medium text-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent">
              <Plus className="h-4 w-4" strokeWidth={2.8} />
            </span>
            New activity
          </button>
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
      const result = await setDayCity(option.day, id, on);
      if (!result.ok) setError(result.error);
    });
  };

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await addDayCity(option.day, trimmed);
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
                      className="pressable flex h-9 items-center rounded-full px-3.5 text-[15px] font-semibold transition-colors"
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
                  className="shrink-0 px-2 text-[17px] font-semibold text-accent disabled:text-faint"
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
