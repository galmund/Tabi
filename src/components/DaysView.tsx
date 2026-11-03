"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BedDouble, CalendarDays, Plane, Plus, StickyNote } from "lucide-react";
import { reorderDay, saveDayNote, scheduleIdea } from "@/app/actions";
import { LegSheet } from "@/components/BookingSheets";
import { DayPickerSheet, IdeaSheet } from "@/components/IdeaSheets";
import { NavBar } from "@/components/NavBar";
import { IdeaSummary, LegSummary } from "@/components/rows";
import { FormGroup, GroupLabel } from "@/components/form";
import { Sheet } from "@/components/Sheet";
import { SortableList } from "@/components/SortableList";
import { CityDot, CityTag, Tag } from "@/components/ui";
import { addDays, formatDay, formatRange, plural } from "@/lib/dates";
import { useToday } from "@/lib/device";
import { bookedStayOn, dayOptions, overnightLegOn, type DayOption } from "@/lib/plan";
import type { IdeaRow, LegRow, TripData } from "@/lib/trip";

type Editing =
  | { kind: "idea"; idea: IdeaRow }
  | { kind: "move"; idea: IdeaRow }
  | { kind: "new-idea"; day: string; city?: string }
  | { kind: "add"; day: DayOption }
  | { kind: "leg"; leg: LegRow }
  | null;

export function DaysView({ data, serverToday }: { data: TripData; serverToday: string }) {
  const today = useToday(serverToday);
  const { trip, stays, legs, ideas, notes, cities } = data;
  const days = dayOptions(trip, stays, ideas);
  const [editing, setEditing] = useState<Editing>(null);

  useEffect(() => {
    if (window.location.hash) return;
    if (today >= trip.startDate && today <= trip.endDate) {
      document.getElementById(`day-${today}`)?.scrollIntoView({ block: "start" });
    }
  }, [today, trip.startDate, trip.endDate]);

  return (
    <>
      <NavBar title="Days" eyebrow={`${formatRange(trip.startDate, trip.endDate)} · ${plural(days.length, "day")}`} />

      <div className="rise-in space-y-4">
        {days.map((option) => (
          <DayCard
            key={option.day}
            option={option}
            isToday={option.day === today}
            isLast={option.day === trip.endDate}
            legs={legs.filter((leg) => leg.departDate === option.day || leg.arriveDate === option.day)}
            activities={ideas.filter((idea) => idea.day === option.day)}
            note={notes.find((entry) => entry.day === option.day)?.text ?? ""}
            stay={bookedStayOn(stays, option.day)}
            transit={overnightLegOn(legs, option.day)}
            onEdit={setEditing}
          />
        ))}
      </div>

      {editing?.kind === "idea" ? (
        <IdeaSheet key={editing.idea.id} idea={editing.idea} cities={cities} onDone={() => setEditing(null)} />
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
      {editing?.kind === "leg" ? (
        <LegSheet key={editing.leg.id} leg={editing.leg} onDone={() => setEditing(null)} />
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

function DayCard({
  option,
  isToday,
  isLast,
  legs,
  activities,
  note,
  stay,
  transit,
  onEdit,
}: {
  option: DayOption;
  isToday: boolean;
  isLast: boolean;
  legs: LegRow[];
  activities: IdeaRow[];
  note: string;
  stay: TripData["stays"][number] | undefined;
  transit: LegRow | undefined;
  onEdit: (editing: Editing) => void;
}) {
  return (
    <section
      id={`day-${option.day}`}
      className={`scroll-mt-[calc(var(--safe-top)+56px)] overflow-hidden rounded-card bg-elev ${
        isToday ? "ring-2 ring-accent" : ""
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
        {option.cities.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1 pt-1">
            {option.cities.map((city) => (
              <CityTag key={city.id} city={city} />
            ))}
          </div>
        ) : null}
      </header>

      {legs.length > 0 ? (
        <ul className="separated" style={{ "--inset": "64px" } as React.CSSProperties}>
          {legs.map((leg) => (
            <li key={leg.id}>
              <button
                type="button"
                onClick={() => onEdit({ kind: "leg", leg })}
                className="flex w-full items-center px-4 py-2.5 text-left active:bg-fill"
              >
                <LegSummary leg={leg} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {activities.length > 0 ? (
        <div className={legs.length > 0 ? "border-t border-line" : ""}>
          <SortableList
            items={activities}
            labelOf={(idea) => idea.name}
            onReorder={(ids) => reorderDay(option.day, ids)}
          >
            {(idea, handle, dragging) => (
              <div
                className={`flex items-center gap-1 py-1.5 pr-2 ${handle ? "pl-1" : "pl-4"} ${
                  dragging ? "rounded-[14px] bg-elev2 shadow-[var(--shadow-lift)]" : ""
                }`}
              >
                {handle}
                <button
                  type="button"
                  onClick={() => onEdit({ kind: "idea", idea })}
                  className="flex min-w-0 flex-1 items-center py-1 text-left"
                >
                  <IdeaSummary idea={idea} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${idea.name} to another day`}
                  onClick={() => onEdit({ kind: "move", idea })}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent active:bg-fill"
                >
                  <CalendarDays className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}
          </SortableList>
        </div>
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
      className="inline-flex items-center gap-1.5 font-semibold text-bad"
    >
      <BedDouble className="h-4 w-4" />
      No hotel booked
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
