"use client";

import { useState, useTransition } from "react";
import { Check, Undo2 } from "lucide-react";
import { deleteIdea, saveIdea, scheduleIdea } from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  ChoiceChips,
  CityField,
  FormGroup,
  GroupLabel,
  InputRow,
  NotesField,
  Section,
  TextRow,
  ToggleRow,
} from "@/components/form";
import { IDEA_ICON } from "@/components/icons";
import { FormSheet, Sheet } from "@/components/Sheet";
import { CityDot, MapButtons } from "@/components/ui";
import { formatDay } from "@/lib/dates";
import { IDEA_KINDS, IDEA_KIND_COLOR, IDEA_KIND_LABEL, PRIORITY_LABEL } from "@/lib/labels";
import type { DayOption } from "@/lib/plan";
import type { CityRow, IdeaRow } from "@/lib/trip";

export function IdeaSheet({
  idea,
  cities,
  defaultDay,
  defaultCity,
  onDone,
}: {
  idea?: IdeaRow;
  cities: CityRow[];
  defaultDay?: string;
  defaultCity?: string;
  onDone: () => void;
}) {
  const day = idea ? idea.day : defaultDay;
  return (
    <FormSheet
      title={idea ? "Edit Idea" : day ? "New Activity" : "New Idea"}
      submitLabel={idea ? "Save" : "Add"}
      action={saveIdea}
      onDone={onDone}
      footer={(close) =>
        idea ? <ConfirmDelete label="Delete Idea" run={() => deleteIdea(idea.id)} onDeleted={close} /> : null
      }
    >
      {idea ? <input type="hidden" name="id" value={idea.id} /> : null}
      {day ? <input type="hidden" name="day" value={day} /> : null}

      <Section>
        <TextRow name="name" placeholder="Fushimi Inari at sunrise" defaultValue={idea?.name} required maxLength={120} />
      </Section>

      <div>
        <GroupLabel>Type</GroupLabel>
        <ChoiceChips
          name="kind"
          options={IDEA_KINDS.map((kind) => [kind, IDEA_KIND_LABEL[kind]] as const)}
          defaultValue={idea?.kind ?? "SIGHT"}
          colorOf={(kind) => IDEA_KIND_COLOR[kind]}
          iconOf={(kind) => {
            const Icon = IDEA_ICON[kind];
            return <Icon className="h-4 w-4" />;
          }}
        />
      </div>

      <ChoiceChips
        name="priority"
        options={[
          ["MUST", PRIORITY_LABEL.MUST],
          ["NICE", PRIORITY_LABEL.NICE],
        ]}
        defaultValue={idea?.priority ?? "NICE"}
      />

      <CityField cities={cities} defaultValue={idea?.city?.name ?? defaultCity} />

      {day ? (
        <Section label={`Planned for ${formatDay(day)}`}>
          <InputRow label="Time" name="time" type="time" defaultValue={idea?.time} />
        </Section>
      ) : null}

      <Section label="Details">
        <ToggleRow label="Needs booking in advance" name="needsBooking" defaultChecked={idea?.needsBooking} />
        <InputRow label="Maps link" name="mapsUrl" type="url" defaultValue={idea?.mapsUrl} placeholder="maps.app.goo.gl/…" />
      </Section>

      {idea ? (
        <MapButtons
          query={[idea.name, idea.city?.name, "Japan"].filter(Boolean).join(", ")}
          mapsUrl={idea.mapsUrl}
        />
      ) : null}

      <NotesField name="notes" defaultValue={idea?.notes} placeholder="Opening hours, what to order, closest station…" />
    </FormSheet>
  );
}

export function DayPickerSheet({
  idea,
  days,
  onDone,
}: {
  idea: IdeaRow;
  days: DayOption[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suggested = idea.cityId ? days.filter((day) => day.cities.some((city) => city.id === idea.cityId)) : [];
  const others = days.filter((day) => !suggested.includes(day));

  const pick = (day: string | null, close: () => void) =>
    startTransition(async () => {
      const result = await scheduleIdea(idea.id, day);
      if (result.ok) close();
      else setError(result.error);
    });

  return (
    <Sheet title={idea.name} onDone={onDone}>
      {(close) => (
        <>
          {idea.day ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => pick(null, close)}
              className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-group text-[17px] text-accent"
            >
              <Undo2 className="h-[18px] w-[18px]" />
              Move back to Ideas
            </button>
          ) : null}
          {error ? <p className="rounded-[12px] bg-bad/15 px-4 py-3 text-[15px] text-bad">{error}</p> : null}
          {suggested.length > 0 ? (
            <DayList
              label={`Days in ${idea.city?.name}`}
              days={suggested}
              current={idea.day}
              disabled={pending}
              onPick={(day) => pick(day, close)}
            />
          ) : null}
          <DayList
            label={suggested.length > 0 ? "Other days" : "Pick a day"}
            days={others}
            current={idea.day}
            disabled={pending}
            onPick={(day) => pick(day, close)}
          />
        </>
      )}
    </Sheet>
  );
}

function DayList({
  label,
  days,
  current,
  disabled,
  onPick,
}: {
  label: string;
  days: DayOption[];
  current: string | null;
  disabled: boolean;
  onPick: (day: string) => void;
}) {
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      <FormGroup>
        {days.map((option) => (
          <button
            key={option.day}
            type="button"
            disabled={disabled}
            onClick={() => onPick(option.day)}
            className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left active:bg-fill"
          >
            <span className="tnum w-12 shrink-0 text-[13px] text-dim">Day {option.number}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px]">{formatDay(option.day)}</span>
              {option.cities.length > 0 ? (
                <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-dim">
                  {option.cities.map((city) => (
                    <span key={city.id} className="flex items-center gap-1">
                      <CityDot color={city.color} className="h-2 w-2" />
                      {city.name}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
            {option.planned > 0 ? (
              <span className="tnum shrink-0 text-[13px] text-dim">{option.planned} planned</span>
            ) : null}
            {current === option.day ? <Check className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.6} /> : null}
          </button>
        ))}
      </FormGroup>
    </div>
  );
}
