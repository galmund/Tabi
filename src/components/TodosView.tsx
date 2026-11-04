"use client";

import { useOptimistic, useState, useTransition } from "react";
import { BedDouble, Check, Lightbulb, ListChecks, Plus } from "lucide-react";
import { setTodoDone } from "@/app/actions";
import { CheckButton } from "@/components/CheckButton";
import { TRAVEL_ICON } from "@/components/icons";
import { NavBar } from "@/components/NavBar";
import { SegmentedTrack, segmentClass } from "@/components/Segmented";
import { TodoSheet } from "@/components/TodoSheet";
import { EmptyState, GroupedList, SectionHeader } from "@/components/ui";
import { WishList, WishSheet } from "@/components/WishList";
import { daysBetween, formatDay, plural } from "@/lib/dates";
import { useToday } from "@/lib/device";
import type { TodoRow, TripData, WishRow } from "@/lib/trip";

export type ListTab = "todos" | "wish";

type Editing = { kind: "todo"; todo?: TodoRow } | { kind: "wish"; wish?: WishRow } | null;

export function TodosView({
  data,
  serverToday,
  initialList,
}: {
  data: TripData;
  serverToday: string;
  initialList: ListTab;
}) {
  const today = useToday(serverToday);
  const { todos, stays, legs, ideas, wishes, cities } = data;
  const [list, setList] = useState<ListTab>(initialList);
  const [editing, setEditing] = useState<Editing>(null);
  const [showDone, setShowDone] = useState(false);

  const open = todos.filter((todo) => !todo.done);
  const done = todos.filter((todo) => todo.done);
  const toBuy = wishes.filter((wish) => !wish.bought).length;

  return (
    <>
      <NavBar
        title={list === "todos" ? "To-dos" : "Wish List"}
        eyebrow={
          list === "todos"
            ? open.length === 0
              ? "All done"
              : `${open.length} to do`
            : `${plural(toBuy, "thing")} to buy`
        }
        trailing={
          <button
            type="button"
            aria-label={list === "todos" ? "Add to-do" : "Add to wish list"}
            onClick={() => setEditing(list === "todos" ? { kind: "todo" } : { kind: "wish" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent active:bg-fill"
          >
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </button>
        }
      />

      <SegmentedTrack label="Lists" className="mb-5">
        {(["todos", "wish"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={list === value}
            onClick={() => {
              setList(value);
              window.history.replaceState(null, "", value === "todos" ? "/todos" : "/todos?list=wish");
            }}
            className={segmentClass(list === value)}
          >
            {value === "todos" ? "To-dos" : "Wish List"}
          </button>
        ))}
      </SegmentedTrack>

      {list === "wish" ? (
        <div className="rise-in">
          <WishList wishes={wishes} onEdit={(wish) => setEditing({ kind: "wish", wish })} />
        </div>
      ) : (
        <div className="rise-in space-y-8">
          {todos.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-6 w-6" />}
              title="Nothing to do yet"
              hint="Book teamLab, order a Suica, decide on the JR Pass… Ideas marked “needs booking” land here too."
            />
          ) : (
            <section>
              {open.length > 0 ? (
                <GroupedList inset={16 + 26 + 12}>
                  {open.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} today={today} onEdit={() => setEditing({ kind: "todo", todo })} />
                  ))}
                </GroupedList>
              ) : (
                <EmptyState icon={<Check className="h-6 w-6" />} title="All done" hint="Nothing left on the list." />
              )}
            </section>
          )}

          {done.length > 0 ? (
            <section>
              <SectionHeader
                title="Done"
                trailing={
                  <button type="button" onClick={() => setShowDone((value) => !value)} className="text-accent">
                    {showDone ? "Hide" : `Show ${done.length}`}
                  </button>
                }
              />
              {showDone ? (
                <GroupedList inset={16 + 26 + 12}>
                  {done.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} today={today} onEdit={() => setEditing({ kind: "todo", todo })} />
                  ))}
                </GroupedList>
              ) : null}
            </section>
          ) : null}
        </div>
      )}

      {editing?.kind === "todo" ? (
        <TodoSheet
          key={editing.todo?.id ?? "new"}
          todo={editing.todo}
          stays={stays}
          legs={legs}
          ideas={ideas}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === "wish" ? (
        <WishSheet key={editing.wish?.id ?? "new"} wish={editing.wish} cities={cities} onDone={() => setEditing(null)} />
      ) : null}
    </>
  );
}

function TodoItem({ todo, today, onEdit }: { todo: TodoRow; today: string; onEdit: () => void }) {
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(todo.done);
  const overdue = !done && todo.dueDate !== null && todo.dueDate < today;
  const soon = !done && todo.dueDate !== null && !overdue && daysBetween(today, todo.dueDate) <= 7;
  const LegIcon = todo.leg ? TRAVEL_ICON[todo.leg.mode] : null;
  const linked = todo.stay
    ? { icon: <BedDouble className="h-3.5 w-3.5" />, label: todo.stay.name }
    : todo.leg && LegIcon
      ? { icon: <LegIcon className="h-3.5 w-3.5" />, label: `${todo.leg.origin} → ${todo.leg.destination}` }
      : todo.idea
        ? { icon: <Lightbulb className="h-3.5 w-3.5" />, label: todo.idea.name }
        : null;

  return (
    <li className="flex items-center">
      <CheckButton
        checked={done}
        label={done ? `Mark “${todo.title}” as not done` : `Mark “${todo.title}” as done`}
        onToggle={() =>
          startTransition(async () => {
            setDone(!done);
            await setTodoDone(todo.id, !done);
          })
        }
      />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 py-3 pr-4 text-left active:bg-fill">
        <span className={`block text-[17px] leading-tight ${done ? "text-dim line-through" : ""}`}>{todo.title}</span>
        {todo.dueDate || linked ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] text-dim">
            {todo.dueDate ? (
              <span className={`tnum ${overdue ? "font-semibold text-bad" : soon ? "text-orange" : ""}`}>
                {overdue ? "Overdue · " : ""}
                {formatDay(todo.dueDate)}
              </span>
            ) : null}
            {linked ? (
              <span className="flex min-w-0 items-center gap-1">
                {linked.icon}
                <span className="truncate">{linked.label}</span>
              </span>
            ) : null}
          </span>
        ) : null}
      </button>
    </li>
  );
}
