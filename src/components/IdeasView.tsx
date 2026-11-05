"use client";

import { useState } from "react";
import { CalendarCheck, CalendarPlus, Lightbulb, Plus, Ticket } from "lucide-react";
import { EditButton, IdeaDetail } from "@/components/DetailSheets";
import { DayPickerSheet, IdeaSheet } from "@/components/IdeaSheets";
import { NavBar } from "@/components/NavBar";
import { IdeaSummary } from "@/components/rows";
import { CityDot, EmptyState, GroupedList, SectionHeader } from "@/components/ui";
import { formatDay, formatShortDay, plural } from "@/lib/dates";
import { dayOptions } from "@/lib/plan";
import type { CityRow, IdeaRow, TripData } from "@/lib/trip";

type Editing =
  | { kind: "edit"; idea: IdeaRow; fromDetail?: boolean }
  | { kind: "view"; id: string }
  | { kind: "new" }
  | { kind: "schedule"; idea: IdeaRow }
  | null;

const ALL = "all";
const NO_CITY = "none";

export function IdeasView({ data }: { data: TripData }) {
  const { trip, stays, ideas, cities, dayCities } = data;
  const [filter, setFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<Editing>(null);
  const days = dayOptions(trip, stays, ideas, dayCities);

  const groups: { key: string; city: CityRow | null; ideas: IdeaRow[] }[] = [
    ...cities.map((city) => ({ key: city.id, city, ideas: ideas.filter((idea) => idea.cityId === city.id) })),
    { key: NO_CITY, city: null, ideas: ideas.filter((idea) => !idea.cityId) },
  ].filter((group) => group.ideas.length > 0 && (filter === ALL || filter === group.key));

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

      <div className="rise-in space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-8 lg:space-y-0 lg:[&>:only-child]:col-span-2">
        {ideas.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-6 w-6" />}
            title="No ideas yet"
            hint="Temples, ramen, onsen, that bar someone recommended — save them here, then add them to a day."
          />
        ) : (
          groups.map((group) => (
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
                trailing={String(group.ideas.length)}
              />
              <GroupedList inset={16 + 36 + 12}>
                {sortIdeas(group.ideas).map((idea) => (
                  <li key={idea.id} className="flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ kind: "view", id: idea.id })}
                      className="flex min-w-0 flex-1 items-center py-2.5 pl-4 text-left active:bg-fill"
                    >
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
                    <button
                      type="button"
                      onClick={() => setEditing({ kind: "schedule", idea })}
                      aria-label={idea.day ? `Planned for ${formatDay(idea.day)}, change day` : "Add to a day"}
                      className={`pressable ml-2 flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold ${
                        idea.day ? "bg-fill text-ink" : "bg-accent/15 text-accent"
                      }`}
                    >
                      {idea.day ? (
                        <>
                          <CalendarCheck className="h-4 w-4 text-good" />
                          <span className="tnum">{formatShortDay(idea.day)}</span>
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-4 w-4" />
                          Add to day
                        </>
                      )}
                    </button>
                    <EditButton label={`Edit ${idea.name}`} onClick={() => setEditing({ kind: "edit", idea })} />
                  </li>
                ))}
              </GroupedList>
            </section>
          ))
        )}
      </div>

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
          defaultCity={cities.find((city) => city.id === filter)?.name}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === "schedule" ? (
        <DayPickerSheet key={editing.idea.id} idea={editing.idea} days={days} onDone={() => setEditing(null)} />
      ) : null}
    </>
  );
}

function sortIdeas(ideas: IdeaRow[]): IdeaRow[] {
  return [...ideas].sort((a, b) => {
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
