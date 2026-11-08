"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { scheduleIdea } from "@/app/actions";
import { IdeaSummary } from "@/components/rows";
import { CityDot } from "@/components/ui";
import { unplannedIn } from "@/lib/plan";
import type { IdeaRow } from "@/lib/trip";

const QUICK = 3;

type City = { id: string; name: string; color: string };

export function Suggestions({
  day,
  cities,
  ideas,
  className = "",
}: {
  day: string;
  cities: City[];
  ideas: IdeaRow[];
  className?: string;
}) {
  const [added, setAdded] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const options = unplannedIn(ideas, cities.map((city) => city.id)).filter((idea) => !added.includes(idea.id));
  if (options.length === 0) return null;

  const add = (idea: IdeaRow) => {
    setAdded((current) => [...current, idea.id]);
    startTransition(async () => {
      const result = await scheduleIdea(idea.id, day);
      if (!result.ok) setAdded((current) => current.filter((id) => id !== idea.id));
    });
  };

  const row = (idea: IdeaRow) => (
    <li key={idea.id} className="flex items-center gap-2 py-1">
      <div className="flex min-w-0 flex-1 opacity-70">
        <IdeaSummary idea={idea} />
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => add(idea)}
        aria-label={`Add ${idea.name} to this day`}
        className="pressable flex h-8 shrink-0 items-center gap-1 rounded-full bg-accent/15 px-3 text-[14px] font-semibold text-accent disabled:opacity-60"
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} />
        Add
      </button>
    </li>
  );

  const groups = cities
    .map((city) => ({ city, ideas: options.filter((idea) => idea.cityId === city.id) }))
    .filter((group) => group.ideas.length > 0);

  return (
    <div className={className}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.02em] text-dim">Free day — ideas nearby</p>
      {open ? null : <ul className="mt-1">{options.slice(0, QUICK).map(row)}</ul>}
      {options.length > QUICK || groups.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="mt-1 inline-flex items-center gap-1 rounded-full py-1 text-[15px] font-semibold text-accent active:opacity-60"
          >
            {open ? "Show fewer" : `All ${options.length} in ${cities.map((city) => city.name).join(" & ")}`}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? (
            <div className="mt-1.5 space-y-2 rounded-[14px] bg-fill px-3 py-2">
              {groups.map((group) => (
                <div key={group.city.id}>
                  {groups.length > 1 ? (
                    <p className="flex items-center gap-1.5 pt-1 text-[13px] font-semibold text-dim">
                      <CityDot color={group.city.color} className="h-2 w-2" />
                      {group.city.name}
                    </p>
                  ) : null}
                  <ul>{group.ideas.map(row)}</ul>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
