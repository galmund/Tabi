"use client";

import { useCallback, useRef, useState, useTransition, type ReactNode } from "react";
import { GripVertical } from "lucide-react";

type Drag = { id: string; from: number; to: number; dy: number; height: number };

function DragHandle({
  label,
  onPointerDown,
  onKeyDown,
  dragging,
}: {
  label: string;
  onPointerDown: (event: React.PointerEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  dragging: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`Reorder ${label}. Use the arrow keys, or drag.`}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={`flex h-11 w-7 shrink-0 items-center justify-center rounded-md ${
        dragging ? "text-accent" : "text-faint active:text-dim"
      }`}
      style={{ touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  labelOf,
  onReorder,
  children,
}: {
  items: T[];
  labelOf: (item: T) => string;
  onReorder: (ids: string[]) => Promise<unknown>;
  children: (item: T, handle: ReactNode, dragging: boolean) => ReactNode;
}) {
  const serverKey = items.map((item) => item.id).join(",");
  const [ordered, setOrdered] = useState(items);
  const [syncedKey, setSyncedKey] = useState(serverKey);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [, startTransition] = useTransition();

  if (syncedKey !== serverKey) {
    setSyncedKey(serverKey);
    setOrdered(items);
  }

  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const rects = useRef<{ top: number; height: number }[]>([]);
  const startY = useRef(0);

  const move = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= ordered.length || to === from) return;
      const next = [...ordered];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setOrdered(next);
      startTransition(async () => {
        await onReorder(next.map((item) => item.id));
      });
    },
    [ordered, onReorder]
  );

  const beginDrag = (index: number) => (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    rects.current = ordered.map((item) => {
      const rect = rowRefs.current.get(item.id)?.getBoundingClientRect();
      return { top: rect?.top ?? 0, height: rect?.height ?? 0 };
    });
    startY.current = event.clientY;
    setDrag({ id: ordered[index].id, from: index, to: index, dy: 0, height: rects.current[index].height });
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {}
  };

  const onDragMove = (event: React.PointerEvent) => {
    setDrag((current) => {
      if (!current) return current;
      const dy = event.clientY - startY.current;
      const source = rects.current[current.from];
      const centre = source.top + source.height / 2 + dy;
      let to = current.from;
      for (let i = 0; i < rects.current.length; i++) {
        if (i === current.from) continue;
        const other = rects.current[i];
        const otherCentre = other.top + other.height / 2;
        if (i < current.from && centre < otherCentre) {
          to = i;
          break;
        }
        if (i > current.from && centre > otherCentre) to = i;
      }
      return { ...current, dy, to };
    });
  };

  const endDrag = () => {
    if (!drag) return;
    if (drag.to !== drag.from) move(drag.from, drag.to);
    setDrag(null);
  };

  const offsetFor = (index: number) => {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -drag.height;
    if (drag.from > drag.to && index < drag.from && index >= drag.to) return drag.height;
    return 0;
  };

  return (
    <ul className="separated" onPointerMove={onDragMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      {ordered.map((item, index) => {
        const dragging = drag?.id === item.id;
        return (
          <li
            key={item.id}
            ref={(node) => {
              if (node) rowRefs.current.set(item.id, node);
              else rowRefs.current.delete(item.id);
            }}
            style={{
              transform: `translateY(${offsetFor(index)}px)`,
              transition: dragging ? "none" : "transform 180ms ease",
              zIndex: dragging ? 20 : undefined,
            }}
          >
            {children(
              item,
              ordered.length > 1 ? (
                <DragHandle
                  label={labelOf(item)}
                  dragging={dragging}
                  onPointerDown={beginDrag(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      move(index, index - 1);
                    } else if (event.key === "ArrowDown") {
                      event.preventDefault();
                      move(index, index + 1);
                    }
                  }}
                />
              ) : null,
              dragging
            )}
          </li>
        );
      })}
    </ul>
  );
}
