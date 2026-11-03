"use client";

import { ChevronsUpDown } from "lucide-react";
import { deleteTodo, saveTodo } from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FieldRow, InputRow, Section, SectionNote, TextRow } from "@/components/form";
import { FormSheet } from "@/components/Sheet";
import { formatShortDay } from "@/lib/dates";
import type { IdeaRow, LegRow, StayRow, TodoRow } from "@/lib/trip";

export function TodoSheet({
  todo,
  stays,
  legs,
  ideas,
  onDone,
}: {
  todo?: TodoRow;
  stays: StayRow[];
  legs: LegRow[];
  ideas: IdeaRow[];
  onDone: () => void;
}) {
  const link = todo?.stayId
    ? `stay:${todo.stayId}`
    : todo?.legId
      ? `leg:${todo.legId}`
      : todo?.ideaId
        ? `idea:${todo.ideaId}`
        : "";

  return (
    <FormSheet
      title={todo ? "Edit To-do" : "New To-do"}
      submitLabel={todo ? "Save" : "Add"}
      action={saveTodo}
      onDone={onDone}
      footer={(close) =>
        todo ? <ConfirmDelete label="Delete To-do" run={() => deleteTodo(todo.id)} onDeleted={close} /> : null
      }
    >
      {todo ? <input type="hidden" name="id" value={todo.id} /> : null}

      <Section>
        <TextRow name="title" placeholder="Get a Suica card" defaultValue={todo?.title} required maxLength={200} autoFocus={!todo} />
        <InputRow label="Due" name="dueDate" type="date" defaultValue={todo?.dueDate} />
      </Section>

      {todo?.fromIdea ? (
        <SectionNote>Added because “{todo.idea?.name}” needs booking in advance. Untick that on the idea to remove it.</SectionNote>
      ) : (
        <Section label="Linked to">
          <FieldRow label="Booking or idea">
            <span className="flex min-w-0 items-center gap-1 text-dim">
              <select
                name="link"
                defaultValue={link}
                className="input min-w-0 cursor-pointer appearance-none truncate text-right text-dim"
                style={{ textAlignLast: "right" }}
              >
                <option value="">Nothing</option>
                {stays.length > 0 ? (
                  <optgroup label="Stays">
                    {stays.map((stay) => (
                      <option key={stay.id} value={`stay:${stay.id}`}>
                        {stay.name} · {formatShortDay(stay.checkIn)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {legs.length > 0 ? (
                  <optgroup label="Travel">
                    {legs.map((leg) => (
                      <option key={leg.id} value={`leg:${leg.id}`}>
                        {leg.origin} → {leg.destination} · {formatShortDay(leg.departDate)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {ideas.length > 0 ? (
                  <optgroup label="Ideas">
                    {ideas.map((idea) => (
                      <option key={idea.id} value={`idea:${idea.id}`}>
                        {idea.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
              <ChevronsUpDown className="h-4 w-4 shrink-0" />
            </span>
          </FieldRow>
        </Section>
      )}
    </FormSheet>
  );
}
