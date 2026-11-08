"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CalendarCheck, CalendarPlus, Lightbulb, Plus, Star, Ticket } from "lucide-react";
import { moveIdea } from "@/app/actions";
import { useActivityDrag } from "@/components/ActivityDrag";
import { EditButton, IdeaDetail } from "@/components/DetailSheets";
import { DayPickerSheet, IdeaSheet } from "@/components/IdeaSheets";
import { NavBar } from "@/components/NavBar";
import { IDEA_ICON } from "@/components/icons";
import { IdeaSummary, Thumb } from "@/components/rows";
import { CityDot, EmptyState, GroupedList, IconCircle, SectionHeader, Tag } from "@/components/ui";
import { formatDay, formatShortDay, plural } from "@/lib/dates";
import { IDEA_KIND_COLOR, IDEA_KIND_LABEL } from "@/lib/labels";
import { dayOptions } from "@/lib/plan";
import type { CityRow, IdeaRow, TripData } from "@/lib/trip";

type Editing =
  | { kind: "edit"; idea: IdeaRow; fromDetail?: boolean }
  | { kind: "view"; id: string }
  | { kind: "new"; city?: string }
  | { kind: "schedule"; idea: IdeaRow }
  | null;

const ALL = "all";
const NO_CITY = "none";

export function IdeasView({ data }: { data: TripData }) {
  const { trip, stays, cities, dayCities } = data;
  const serverKey = data.ideas.map((idea) => `${idea.id}:${idea.cityId}:${idea.cityOrder}`).join(",");
  const [moved, setMoved] = useState<{ key: string; ideas: IdeaRow[] } | null>(null);
  const ideas = moved?.key === serverKey ? moved.ideas : data.ideas;
  const [filter, setFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<Editing>(null);
  const [, startTransition] = useTransition();
  const days = dayOptions(trip, stays, ideas, dayCities);

  const groups: { key: string; city: CityRow | null; ideas: IdeaRow[] }[] = [
    ...cities.map((city) => ({ key: city.id, city, ideas: ideas.filter((idea) => idea.cityId === city.id) })),
    { key: NO_CITY, city: null, ideas: ideas.filter((idea) => !idea.cityId) },
  ]
    .filter((group) => group.ideas.length > 0 && (filter === ALL || filter === group.key))
    .map((group) => ({ ...group, ideas: sortIdeas(group.ideas) }));

  const dragOptions = {
    unit: "city",
    days: groups.map((group) => group.key),
    order: (key: string) => groups.find((group) => group.key === key)?.ideas.map((idea) => idea.id) ?? [],
    onDrop: (id: string, key: string, ids: string[]) => {
      const cityId = key === NO_CITY ? null : key;
      const city = cities.find((candidate) => candidate.id === cityId) ?? null;
      const next = ideas
        .map((idea) => (idea.id === id ? { ...idea, cityId, city } : idea))
        .map((idea) => ((idea.cityId ?? NO_CITY) === key ? { ...idea, cityOrder: ids.indexOf(idea.id) } : idea));
      setMoved({ key: serverKey, ideas: next });
      startTransition(async () => {
        await moveIdea(id, cityId, ids);
      });
    },
  };
  const ghostIdea = (id: string) => ideas.find((idea) => idea.id === id);
  const listDrag = useActivityDrag({
    ...dragOptions,
    renderGhost: (id) => {
      const idea = ghostIdea(id);
      return idea ? <IdeaSummary idea={idea} /> : null;
    },
  });
  const gridDrag = useActivityDrag({
    ...dragOptions,
    grid: true,
    ghostClassName: "scale-[1.03] rounded-card bg-elev p-4 shadow-[var(--shadow-lift)]",
    renderGhost: (id) => {
      const idea = ghostIdea(id);
      return idea ? <IdeaCardHeading idea={idea} /> : null;
    },
  });

  const filterCities = cities.filter((city) => ideas.some((idea) => idea.cityId === city.id));
  const unplanned = ideas.filter((idea) => !idea.day).length;
  const viewing = editing?.kind === "view" ? ideas.find((idea) => idea.id === editing.id) : undefined;

  return (
    <>
      <NavBar
        title="Ideas"
        eyebrow={`${plural(ideas.length, "idea")} · ${unplanned} not on a day yet`}
        trailing={
          <button
            type="button"
            aria-label="Add idea"
            onClick={() => setEditing({ kind: "new" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent active:bg-fill"
          >
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </button>
        }
      />

      {filterCities.length > 0 ? (
        <div className="no-scrollbar -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:mb-6 lg:flex-wrap lg:px-0">
          <FilterChip active={filter === ALL} onClick={() => setFilter(ALL)}>
            All
          </FilterChip>
          {filterCities.map((city) => (
            <FilterChip key={city.id} active={filter === city.id} color={city.color} onClick={() => setFilter(city.id)}>
              {city.name}
            </FilterChip>
          ))}
          {ideas.some((idea) => !idea.cityId) ? (
            <FilterChip active={filter === NO_CITY} onClick={() => setFilter(NO_CITY)}>
              No city
            </FilterChip>
          ) : null}
        </div>
      ) : null}

      <div className="rise-in space-y-8 lg:space-y-10">
        {ideas.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-6 w-6" />}
            title="No ideas yet"
            hint="Temples, ramen, onsen, that bar someone recommended — save them here, then add them to a day."
          />
        ) : (
          groups.map((group) => {
            const planned = group.ideas.filter((idea) => idea.day).length;
            const actions = (idea: IdeaRow) => ({
              onView: () => setEditing({ kind: "view", id: idea.id }),
              onSchedule: () => setEditing({ kind: "schedule", idea }),
              onEdit: () => setEditing({ kind: "edit", idea }),
            });
            return (
              <section key={group.key}>
                <SectionHeader
                  title={
                    <span className="flex items-center gap-2">
                      {group.city ? <CityDot color={group.city.color} className="h-3 w-3" /> : null}
                      {group.city?.name ?? "No city yet"}
                      {group.city?.nameJa ? (
                        <span className="text-[17px] font-medium text-dim">{group.city.nameJa}</span>
                      ) : null}
                    </span>
                  }
                  trailing={
                    <>
                      <span className="lg:hidden">{group.ideas.length}</span>
                      <span className="tnum hidden lg:inline">
                        {plural(group.ideas.length, "idea")}
                        {planned > 0 ? ` · ${planned} planned` : ""}
                      </span>
                    </>
                  }
                />
                <div
                  ref={listDrag.dayRef(group.key)}
                  className={`rounded-card transition-shadow duration-150 lg:hidden ${
                    listDrag.targetDay === group.key ? "ring-2 ring-accent/60" : ""
                  }`}
                >
                  <GroupedList inset={4 + 28 + 4 + 36 + 12}>
                    {group.ideas.map((idea) => (
                      <IdeaListRow
                        key={idea.id}
                        idea={idea}
                        {...actions(idea)}
                        rowRef={listDrag.rowRef(idea.id)}
                        dragging={listDrag.draggingId === idea.id}
                        handle={listDrag.handle(idea.id, group.key, idea.name)}
                      />
                    ))}
                  </GroupedList>
                </div>
                <div
                  ref={gridDrag.dayRef(group.key)}
                  className={`hidden gap-3 rounded-[24px] outline-offset-[6px] lg:grid lg:grid-cols-2 xl:grid-cols-3 ${
                    gridDrag.targetDay === group.key ? "outline-2 outline-dashed outline-accent/50" : ""
                  }`}
                >
                  {group.ideas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      {...actions(idea)}
                      rowRef={gridDrag.rowRef(idea.id)}
                      dragging={gridDrag.draggingId === idea.id}
                      handle={gridDrag.handle(idea.id, group.key, idea.name, "h-9 w-9 rounded-full hover:bg-fill")}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditing({ kind: "new", city: group.city?.name })}
                    className="pressable flex min-h-[132px] items-center justify-center gap-2 rounded-card border border-dashed border-line text-[15px] font-semibold text-dim transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    <Plus className="h-[18px] w-[18px]" />
                    {group.city ? `Add to ${group.city.name}` : "Add idea"}
                  </button>
                </div>
              </section>
            );
          })
        )}
      </div>

      {listDrag.overlay}
      {gridDrag.overlay}

      {editing?.kind === "edit" ? (
        <IdeaSheet
          key={editing.idea.id}
          idea={editing.idea}
          cities={cities}
          onDone={() => setEditing(editing.fromDetail ? { kind: "view", id: editing.idea.id } : null)}
        />
      ) : null}
      {viewing ? (
        <IdeaDetail
          key={viewing.id}
          idea={viewing}
          onEdit={() => setEditing({ kind: "edit", idea: viewing, fromDetail: true })}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === "new" ? (
        <IdeaSheet
          key="new"
          cities={cities}
          defaultCity={editing.city ?? cities.find((city) => city.id === filter)?.name}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === "schedule" ? (
        <DayPickerSheet key={editing.idea.id} idea={editing.idea} days={days} onDone={() => setEditing(null)} />
      ) : null}
    </>
  );
}

type IdeaItemProps = {
  idea: IdeaRow;
  onView: () => void;
  onSchedule: () => void;
  onEdit: () => void;
  rowRef: (node: HTMLElement | null) => void;
  dragging: boolean;
  handle: ReactNode;
};

function IdeaListRow({ idea, onView, onSchedule, onEdit, rowRef, dragging, handle }: IdeaItemProps) {
  return (
    <li
      ref={rowRef}
      data-drag-row
      className={`flex items-center gap-1 py-1.5 pl-1 pr-2 transition-opacity duration-150 ${dragging ? "opacity-30" : ""}`}
    >
      {handle}
      <button type="button" onClick={onView} className="flex min-w-0 flex-1 items-center py-1 text-left">
        <IdeaSummary
          idea={idea}
          trailing={
            idea.needsBooking ? (
              <span className="flex items-center gap-1 text-orange">
                <Ticket className="h-3.5 w-3.5" />
                Book ahead
              </span>
            ) : null
          }
        />
      </button>
      <DayButton idea={idea} onClick={onSchedule} compact className="ml-1" />
      <EditButton label={`Edit ${idea.name}`} onClick={onEdit} />
    </li>
  );
}

function IdeaCard({ idea, onView, onSchedule, onEdit, rowRef, dragging, handle }: IdeaItemProps) {
  return (
    <article
      ref={rowRef}
      data-drag-row
      className={`group relative flex min-h-[132px] flex-col rounded-card bg-elev p-4 transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-thumb)] ${
        dragging ? "opacity-30" : ""
      }`}
    >
      <button
        type="button"
        onClick={onView}
        aria-label={`Open ${idea.name}`}
        className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-accent"
      />
      <div className="flex items-start gap-2">
        <IdeaCardHeading idea={idea} />
        <div className="relative -mr-2 -mt-2 flex transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          {handle}
          <EditButton label={`Edit ${idea.name}`} onClick={onEdit} />
        </div>
      </div>
      {idea.notes ? (
        <p dir="auto" className="mt-2 line-clamp-2 text-left text-[14px] leading-snug text-dim">
          {idea.notes}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-2 pt-3">
        {idea.needsBooking ? (
          <Tag tone="orange">
            <Ticket className="h-3.5 w-3.5" />
            Book ahead
          </Tag>
        ) : null}
        {idea.time ? <span className="tnum text-[13px] text-dim">{idea.time}</span> : null}
        <DayButton idea={idea} onClick={onSchedule} quiet className="relative -mr-1.5 ml-auto" />
      </div>
    </article>
  );
}

function IdeaCardHeading({ idea }: { idea: IdeaRow }) {
  const Icon = IDEA_ICON[idea.kind];
  const color = IDEA_KIND_COLOR[idea.kind];
  const cover = idea.photos[0];
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      {cover ? (
        <Thumb src={cover.src} size={44} />
      ) : (
        <IconCircle color={color} size={44}>
          <Icon className="h-5 w-5" />
        </IconCircle>
      )}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide" style={{ color }}>
          {IDEA_KIND_LABEL[idea.kind]}
          {idea.priority === "MUST" ? (
            <span className="flex items-center gap-0.5 text-yellow">
              <Star className="h-3 w-3 fill-current" />
              Must-do
            </span>
          ) : null}
        </p>
        <h3 dir="auto" className="mt-0.5 line-clamp-2 text-left text-[17px] font-semibold leading-snug">
          {idea.name}
        </h3>
      </div>
    </div>
  );
}

function DayButton({
  idea,
  onClick,
  quiet = false,
  compact = false,
  className = "",
}: {
  idea: IdeaRow;
  onClick: () => void;
  quiet?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={idea.day ? `Planned for ${formatDay(idea.day)}, change day` : "Add to a day"}
      className={`pressable flex h-8 shrink-0 items-center justify-center gap-1 rounded-full text-[13px] font-semibold ${
        compact && !idea.day ? "w-8" : "px-2.5"
      } ${
        idea.day ? "bg-fill text-ink" : quiet ? "text-accent hover:bg-accent/10" : "bg-accent/15 text-accent"
      } ${className}`}
    >
      {idea.day ? (
        <>
          <CalendarCheck className="h-4 w-4 text-good" />
          <span className="tnum">{formatShortDay(idea.day)}</span>
        </>
      ) : (
        <>
          <CalendarPlus className="h-4 w-4" />
          {compact ? null : "Add to day"}
        </>
      )}
    </button>
  );
}

function sortIdeas(ideas: IdeaRow[]): IdeaRow[] {
  return [...ideas].sort((a, b) => {
    if (a.cityOrder !== b.cityOrder) return a.cityOrder - b.cityOrder;
    if (!!a.day !== !!b.day) return a.day ? 1 : -1;
    if (a.priority !== b.priority) return a.priority === "MUST" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`pressable flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold ${
        active ? "bg-ink text-bg" : "bg-elev text-dim"
      }`}
    >
      {color ? <CityDot color={color} className="h-2 w-2" /> : null}
      {children}
    </button>
  );
}
