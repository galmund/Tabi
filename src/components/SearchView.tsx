"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BedDouble, ListChecks, Search, ShoppingBag, StickyNote, X } from "lucide-react";
import { IDEA_ICON, TRAVEL_COLOR, TRAVEL_ICON } from "@/components/icons";
import { NavBar } from "@/components/NavBar";
import { CopyIcon } from "@/components/quick";
import { GroupedList, IconCircle, SectionHeader } from "@/components/ui";
import { daysBetween, formatDay, formatRange, formatShortDay } from "@/lib/dates";
import { IDEA_KIND_COLOR, IDEA_KIND_LABEL, TRAVEL_MODE_LABEL } from "@/lib/labels";
import type { TripData } from "@/lib/trip";

type Hit = { key: string; href: string; icon: ReactNode; title: string; detail: string; copy?: string; text: string };
type Group = { title: string; hits: Hit[] };

const fold = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

function buildGroups(data: TripData): Group[] {
  const { trip, stays, legs, ideas, todos, wishes, notes } = data;
  const dayNumber = (day: string) => daysBetween(trip.startDate, day) + 1;

  return [
    {
      title: "Stays",
      hits: stays.map((stay) => ({
        key: `stay-${stay.id}`,
        href: `/bookings?stay=${stay.id}`,
        icon: (
          <IconCircle color={stay.city.color}>
            <BedDouble className="h-[18px] w-[18px]" />
          </IconCircle>
        ),
        title: stay.name,
        detail: join(formatRange(stay.checkIn, stay.checkOut), stay.city.name, stay.status === "OPTION" ? "Option" : null, stay.bookingRef ? `#${stay.bookingRef}` : null),
        copy: stay.name,
        text: join(stay.name, stay.city.name, stay.city.nameJa, stay.address, stay.bookingRef, stay.notes),
      })),
    },
    {
      title: "Travel",
      hits: legs.map((leg) => {
        const Icon = TRAVEL_ICON[leg.mode];
        return {
          key: `leg-${leg.id}`,
          href: `/bookings?leg=${leg.id}`,
          icon: (
            <IconCircle color={TRAVEL_COLOR}>
              <Icon className="h-[18px] w-[18px]" />
            </IconCircle>
          ),
          title: `${leg.origin} → ${leg.destination}`,
          detail: join(formatShortDay(leg.departDate), leg.departTime, leg.carrier, leg.bookingRef ? `#${leg.bookingRef}` : null),
          text: join(leg.origin, leg.destination, TRAVEL_MODE_LABEL[leg.mode], leg.carrier, leg.bookingRef, leg.seat, leg.notes),
        };
      }),
    },
    {
      title: "Ideas",
      hits: ideas.map((idea) => {
        const Icon = IDEA_ICON[idea.kind];
        return {
          key: `idea-${idea.id}`,
          href: `/ideas?idea=${idea.id}`,
          icon: (
            <IconCircle color={IDEA_KIND_COLOR[idea.kind]}>
              <Icon className="h-[18px] w-[18px]" />
            </IconCircle>
          ),
          title: idea.name,
          detail: join(IDEA_KIND_LABEL[idea.kind], idea.city?.name, idea.day ? `Day ${dayNumber(idea.day)}, ${formatShortDay(idea.day)}` : "Not on a day"),
          copy: idea.name,
          text: join(idea.name, IDEA_KIND_LABEL[idea.kind], idea.city?.name, idea.city?.nameJa, idea.notes),
        };
      }),
    },
    {
      title: "To-dos",
      hits: todos.map((todo) => ({
        key: `todo-${todo.id}`,
        href: `/todos?todo=${todo.id}`,
        icon: (
          <IconCircle color="#5ec28c">
            <ListChecks className="h-[18px] w-[18px]" />
          </IconCircle>
        ),
        title: todo.title,
        detail: join(todo.done ? "Done" : "Open", todo.dueDate ? `Due ${formatShortDay(todo.dueDate)}` : null),
        text: join(todo.title, todo.stay?.name, todo.idea?.name, todo.leg ? `${todo.leg.origin} ${todo.leg.destination}` : null),
      })),
    },
    {
      title: "Wish List",
      hits: wishes.map((wish) => ({
        key: `wish-${wish.id}`,
        href: `/todos?list=wish&wish=${wish.id}`,
        icon: (
          <IconCircle color="#e9ac45">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </IconCircle>
        ),
        title: wish.name,
        detail: join(wish.bought ? "Bought" : "To buy", wish.forWhom ? `For ${wish.forWhom}` : null, wish.city?.name),
        copy: wish.name,
        text: join(wish.name, wish.forWhom, wish.city?.name, wish.notes),
      })),
    },
    {
      title: "Day notes",
      hits: [...notes]
        .sort((a, b) => a.day.localeCompare(b.day))
        .map((note) => ({
          key: `note-${note.day}`,
          href: `/days#day-${note.day}`,
          icon: (
            <IconCircle color={TRAVEL_COLOR}>
              <StickyNote className="h-[18px] w-[18px]" />
            </IconCircle>
          ),
          title: `Day ${dayNumber(note.day)} · ${formatDay(note.day)}`,
          detail: note.text.replace(/\s+/g, " "),
          text: note.text,
        })),
    },
  ];
}

export function SearchView({ data }: { data: TripData }) {
  const [query, setQuery] = useState("");
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const results =
    terms.length === 0
      ? []
      : buildGroups(data)
          .map((group) => ({
            ...group,
            hits: group.hits.filter((hit) => {
              const haystack = fold(`${hit.title} ${hit.text}`);
              return terms.every((term) => haystack.includes(term));
            }),
          }))
          .filter((group) => group.hits.length > 0);
  const total = results.reduce((sum, group) => sum + group.hits.length, 0);

  return (
    <>
      <NavBar title="Search" back={{ href: "/", label: "Home" }} />

      <div className="sticky top-[calc(var(--safe-top)+var(--navbar-h))] z-20 -mx-4 mb-6 bg-bg px-4 pb-3 lg:-mx-8 lg:px-8">
        <label className="flex h-11 items-center gap-2 rounded-[12px] bg-elev px-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-accent/60">
          <Search className="h-[18px] w-[18px] shrink-0 text-dim" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Hotels, booking numbers, ideas, notes…"
            aria-label="Search the trip"
            className="input min-w-0 flex-1 text-[17px] [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="press-fade flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill text-dim"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          ) : null}
        </label>
      </div>

      <div className="space-y-8" aria-live="polite">
        {terms.length === 0 ? (
          <p className="px-1 text-[15px] text-dim">
            Search every stay, journey, idea, to-do, wish and day note — booking numbers and addresses too. Works
            offline.
          </p>
        ) : total === 0 ? (
          <p className="px-1 text-[15px] text-dim">Nothing matches “{query.trim()}”.</p>
        ) : (
          results.map((group) => (
            <section key={group.title}>
              <SectionHeader title={group.title} trailing={group.hits.length} />
              <GroupedList inset={16 + 36 + 12}>
                {group.hits.map((hit) => (
                  <li key={hit.key}>
                    <Link href={hit.href} className="flex items-center gap-3 px-4 py-2.5 active:bg-fill">
                      {hit.icon}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[17px] leading-tight">{hit.title}</span>
                          {hit.copy ? <CopyIcon value={hit.copy} className="-my-1.5 -ml-1" /> : null}
                        </span>
                        {hit.detail ? (
                          <span className="tnum mt-0.5 block truncate text-[14px] text-dim">{hit.detail}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </GroupedList>
            </section>
          ))
        )}
      </div>
    </>
  );
}
