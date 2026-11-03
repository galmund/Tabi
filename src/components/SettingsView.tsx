"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, ChevronRight, Plus } from "lucide-react";
import { deleteCity, saveCity, saveTrip, setAppearance } from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { GroupLabel, InputRow, Section, SectionNote, TextRow } from "@/components/form";
import { NavBar } from "@/components/NavBar";
import { SegmentedTrack, segmentClass } from "@/components/Segmented";
import { FormSheet } from "@/components/Sheet";
import { CityDot, GroupedList, SectionFooter, SectionHeader } from "@/components/ui";
import type { ThemeChoice } from "@/lib/cookies";
import { CITY_COLORS } from "@/lib/labels";
import type { CityRow, TripData } from "@/lib/trip";

const APPEARANCES: [ThemeChoice, string][] = [
  ["auto", "Automatic"],
  ["light", "Light"],
  ["dark", "Dark"],
];

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

export function SettingsView({ data, theme }: { data: TripData; theme: ThemeChoice }) {
  const { trip, cities, stays, ideas } = data;
  const [state, formAction, pending] = useActionState(saveTrip, null);
  const [appearance, setLocalAppearance] = useState(theme);
  const [, startTransition] = useTransition();
  const [editingCity, setEditingCity] = useState<CityRow | "new" | null>(null);

  const chooseAppearance = (choice: ThemeChoice) => {
    setLocalAppearance(choice);
    applyTheme(choice);
    startTransition(async () => {
      await setAppearance(choice);
    });
  };

  return (
    <>
      <NavBar title="Settings" back={{ href: "/", label: "Home" }} />

      <div className="rise-in space-y-8">
        <form action={formAction} className="space-y-2">
          <Section label="Trip">
            <TextRow name="name" placeholder="Trip name" defaultValue={trip.name} required maxLength={60} />
            <InputRow label="Starts" name="startDate" type="date" defaultValue={trip.startDate} required />
            <InputRow label="Ends" name="endDate" type="date" defaultValue={trip.endDate} required />
          </Section>
          <SectionNote>
            The end date is the day you fly home. If you shorten the trip, activities on removed days go back to
            Ideas, and bookings outside the dates stay, marked “outside trip dates”.
          </SectionNote>
          {state && !state.ok ? (
            <p className="rounded-[12px] bg-bad/15 px-4 py-3 text-[15px] text-bad">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="pressable mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-accent text-[17px] font-semibold text-on-accent disabled:opacity-60"
          >
            {pending ? "Saving…" : state?.ok ? (
              <>
                <Check className="h-5 w-5" strokeWidth={2.6} />
                Saved
              </>
            ) : (
              "Save Trip"
            )}
          </button>
        </form>

        <section>
          <GroupLabel>Appearance</GroupLabel>
          <SegmentedTrack label="Appearance">
            {APPEARANCES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={appearance === value}
                onClick={() => chooseAppearance(value)}
                className={segmentClass(appearance === value)}
              >
                {label}
              </button>
            ))}
          </SegmentedTrack>
          <SectionFooter>Automatic follows your phone’s light and dark mode.</SectionFooter>
        </section>

        <section>
          <SectionHeader
            title="Cities"
            trailing={
              <button
                type="button"
                onClick={() => setEditingCity("new")}
                className="flex items-center gap-1 text-accent"
              >
                <Plus className="h-4 w-4" strokeWidth={2.6} />
                Add
              </button>
            }
          />
          {cities.length === 0 ? (
            <SectionNote>Cities are added automatically when you type one on a stay or an idea.</SectionNote>
          ) : (
            <GroupedList inset={16 + 12 + 12}>
              {cities.map((city) => {
                const stayCount = stays.filter((stay) => stay.cityId === city.id).length;
                const ideaCount = ideas.filter((idea) => idea.cityId === city.id).length;
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => setEditingCity(city)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fill"
                    >
                      <CityDot color={city.color} className="h-3 w-3" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px]">
                          {city.name}
                          {city.nameJa ? <span className="ml-2 text-dim">{city.nameJa}</span> : null}
                        </span>
                        <span className="block text-[14px] text-dim">
                          {stayCount} {stayCount === 1 ? "stay" : "stays"} · {ideaCount}{" "}
                          {ideaCount === 1 ? "idea" : "ideas"}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                    </button>
                  </li>
                );
              })}
            </GroupedList>
          )}
        </section>
      </div>

      {editingCity ? (
        <CitySheet
          key={editingCity === "new" ? "new" : editingCity.id}
          city={editingCity === "new" ? undefined : editingCity}
          inUse={editingCity !== "new" && stays.some((stay) => stay.cityId === editingCity.id)}
          onDone={() => setEditingCity(null)}
        />
      ) : null}
    </>
  );
}

function CitySheet({ city, inUse, onDone }: { city?: CityRow; inUse: boolean; onDone: () => void }) {
  const [color, setColor] = useState(city?.color ?? CITY_COLORS[0]);
  return (
    <FormSheet
      title={city ? "Edit City" : "New City"}
      submitLabel={city ? "Save" : "Add"}
      action={saveCity}
      onDone={onDone}
      footer={(close) =>
        city ? (
          inUse ? (
            <SectionNote>Stays still use this city, so it can’t be deleted.</SectionNote>
          ) : (
            <ConfirmDelete label="Delete City" run={() => deleteCity(city.id)} onDeleted={close} />
          )
        ) : null
      }
    >
      {city ? <input type="hidden" name="id" value={city.id} /> : null}
      <input type="hidden" name="color" value={color} />
      <Section>
        <TextRow name="name" placeholder="Kyoto" defaultValue={city?.name} required maxLength={60} />
        <TextRow name="nameJa" placeholder="Japanese name — 京都" defaultValue={city?.nameJa} maxLength={30} />
      </Section>
      <div>
        <GroupLabel>Colour</GroupLabel>
        <div className="grid grid-cols-5 gap-3 rounded-[12px] bg-group p-4">
          {CITY_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Colour ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
              className="pressable mx-auto flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: swatch,
                boxShadow: color === swatch ? `0 0 0 3px var(--color-group), 0 0 0 5px ${swatch}` : undefined,
              }}
            >
              {color === swatch ? <Check className="h-5 w-5 text-white" strokeWidth={3} /> : null}
            </button>
          ))}
        </div>
      </div>
    </FormSheet>
  );
}
