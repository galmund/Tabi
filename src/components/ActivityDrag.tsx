"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GripVertical } from "lucide-react";

const EDGE = 90;
const MAX_SPEED = 18;
const LINE_INSET = 12;

type Active = { id: string; fromDay: string; fromIndex: number; offsetX: number; offsetY: number; width: number };
type Target = { day: string; index: number };

export function useActivityDrag({
  days,
  order,
  onDrop,
  renderGhost,
  ordered = true,
}: {
  days: string[];
  order: (day: string) => string[];
  onDrop: (id: string, day: string, ids: string[], fromDay: string) => void;
  renderGhost: (id: string) => ReactNode;
  ordered?: boolean;
}) {
  const dayNodes = useRef(new Map<string, HTMLElement>());
  const rowNodes = useRef(new Map<string, HTMLElement>());
  const anchorNodes = useRef(new Map<string, HTMLElement>());
  const ghostRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const targetRef = useRef<Target | null>(null);
  const latest = useRef({ order, onDrop });
  const [active, setActive] = useState<Active | null>(null);
  const [targetDay, setTargetDay] = useState<string | null>(null);

  useLayoutEffect(() => {
    latest.current = { order, onDrop };
  });

  const measure = useCallback(() => {
    if (!active) return;
    const { x, y } = pointer.current;

    let day = targetRef.current?.day ?? active.fromDay;
    for (const [candidate, node] of dayNodes.current) {
      const rect = node.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right) {
        day = candidate;
        break;
      }
    }

    const rows = (ordered ? latest.current.order(day) : [])
      .filter((id) => id !== active.id)
      .map((id) => rowNodes.current.get(id)?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => !!rect);
    const index = rows.filter((rect) => rect.top + rect.height / 2 < y).length;

    const card = dayNodes.current.get(day)?.getBoundingClientRect();
    const lineY =
      rows.length === 0
        ? (anchorNodes.current.get(day)?.getBoundingClientRect().top ?? card?.top ?? 0)
        : index < rows.length
          ? rows[index].top
          : rows[rows.length - 1].bottom;

    const line = lineRef.current;
    if (line && card) {
      const unchanged = day === active.fromDay && index === active.fromIndex;
      line.style.opacity = unchanged || !ordered ? "0" : "1";
      line.style.width = `${card.width - LINE_INSET * 2}px`;
      line.style.transform = `translate(${card.left + LINE_INSET}px, ${lineY - 1.5}px)`;
    }
    if (ghostRef.current) {
      ghostRef.current.style.transform = `translate(${x - active.offsetX}px, ${y - active.offsetY}px)`;
    }

    if (targetRef.current?.day !== day || targetRef.current.index !== index) {
      targetRef.current = { day, index };
      setTargetDay(day);
    }
  }, [active, ordered]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!active) return;

    const finish = (commit: boolean) => {
      const target = targetRef.current;
      targetRef.current = null;
      setActive(null);
      setTargetDay(null);
      if (!commit || !target) return;
      if (target.day === active.fromDay && (!ordered || target.index === active.fromIndex)) return;
      const ids = ordered ? latest.current.order(target.day).filter((id) => id !== active.id) : [];
      if (ordered) ids.splice(target.index, 0, active.id);
      latest.current.onDrop(active.id, target.day, ids, active.fromDay);
    };

    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      measure();
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };

    let frame = 0;
    const scroll = () => {
      const { y } = pointer.current;
      const top = EDGE + 40;
      const bottom = window.innerHeight - EDGE - 40;
      const speed =
        y < top
          ? -MAX_SPEED * Math.min(1, (top - y) / EDGE)
          : y > bottom
            ? MAX_SPEED * Math.min(1, (y - bottom) / EDGE)
            : 0;
      if (speed) {
        window.scrollBy(0, speed);
        measure();
      }
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);

    const body = document.body.style;
    const previous = { userSelect: body.userSelect, cursor: body.cursor };
    body.userSelect = "none";
    body.cursor = "grabbing";

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      body.userSelect = previous.userSelect;
      body.cursor = previous.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, measure, ordered]);

  const register =
    (map: React.RefObject<Map<string, HTMLElement>>, key: string) => (node: HTMLElement | null) => {
      if (node) map.current.set(key, node);
      else map.current.delete(key);
    };

  const begin = (id: string, day: string) => (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const row = event.currentTarget.closest("[data-drag-row]")?.getBoundingClientRect();
    if (!row) return;
    event.preventDefault();
    const fromIndex = ordered ? latest.current.order(day).indexOf(id) : 0;
    pointer.current = { x: event.clientX, y: event.clientY };
    targetRef.current = { day, index: fromIndex };
    setTargetDay(day);
    setActive({
      id,
      fromDay: day,
      fromIndex,
      offsetX: event.clientX - row.left,
      offsetY: event.clientY - row.top,
      width: row.width,
    });
  };

  const step = (id: string, day: string, direction: -1 | 1) => {
    const ids = ordered ? latest.current.order(day) : [id];
    const next = ids.indexOf(id) + direction;
    let landed = day;
    if (next >= 0 && next < ids.length) {
      const reordered = ids.filter((other) => other !== id);
      reordered.splice(next, 0, id);
      latest.current.onDrop(id, day, reordered, day);
    } else {
      const otherDay = days[days.indexOf(day) + direction];
      if (!otherDay) return;
      const others = ordered ? latest.current.order(otherDay).filter((other) => other !== id) : [];
      latest.current.onDrop(id, otherDay, direction < 0 ? [...others, id] : [id, ...others], day);
      landed = otherDay;
    }
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-drag-handle="${CSS.escape(`${id}@${landed}`)}"]`)?.focus()
    );
  };

  const handle = (id: string, day: string, label: string) => (
    <button
      type="button"
      data-drag-handle={`${id}@${day}`}
      aria-label={`Move ${label}. Drag to another day, or use the arrow keys.`}
      onPointerDown={begin(id, day)}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          step(id, day, event.key === "ArrowUp" ? -1 : 1);
        }
      }}
      className={`flex h-11 w-7 shrink-0 items-center justify-center rounded-md ${
        active?.id === id ? "text-accent" : "text-faint active:text-dim"
      }`}
      style={{ touchAction: "none", cursor: active ? "grabbing" : "grab" }}
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );

  const overlay =
    active && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              ref={lineRef}
              aria-hidden
              className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] rounded-full bg-accent opacity-0 shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_25%,transparent)]"
            />
            <div
              ref={ghostRef}
              aria-hidden
              className="pointer-events-none fixed left-0 top-0 z-[61]"
              style={{ width: active.width }}
            >
              <div className="flex scale-[1.03] items-center rounded-[14px] bg-elev2 py-2.5 pl-4 pr-3 shadow-[var(--shadow-lift)]">
                {renderGhost(active.id)}
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return {
    draggingId: active?.id ?? null,
    targetDay: active ? targetDay : null,
    dayRef: (day: string) => register(dayNodes, day),
    rowRef: (id: string) => register(rowNodes, id),
    anchorRef: (day: string) => register(anchorNodes, day),
    handle,
    overlay,
  };
}
