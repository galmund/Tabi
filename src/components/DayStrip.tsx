"use client";

import { useEffect, useRef, useState } from "react";
import { formatShortDay } from "@/lib/dates";
import type { DayOption } from "@/lib/plan";

function tint(colors: string[], alpha: string): string | undefined {
  if (colors.length === 0) return undefined;
  if (colors.length === 1) return `${colors[0]}${alpha}`;
  const step = 100 / colors.length;
  const stops = colors.map((color, index) => `${color}${alpha} ${index * step}% ${(index + 1) * step}%`);
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

export function DayStrip({ days, today, missing }: { days: DayOption[]; today: string; missing: string[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const lockedUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const strip = stripRef.current;
      if (!strip || Date.now() < lockedUntil.current) return;
      const line = strip.getBoundingClientRect().bottom + 24;
      let current: string | null = null;
      for (const option of days) {
        const card = document.getElementById(`day-${option.day}`);
        if (card && card.getBoundingClientRect().top <= line) current = option.day;
      }
      setActive(current ?? days[0]?.day ?? null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [days]);

  useEffect(() => {
    const strip = stripRef.current;
    const chip = active ? strip?.querySelector<HTMLElement>(`[data-day="${active}"]`) : null;
    if (!strip || !chip) return;
    const left = chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <div
      className="sticky z-20 -mx-4 mb-4 border-b border-line bg-bar backdrop-blur-xl backdrop-saturate-150 top-[calc(var(--safe-top)+44px)] lg:-mx-8 lg:top-[calc(var(--safe-top)+52px)]"
    >
      <div ref={stripRef} className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2 lg:px-8">
        {days.map((option) => {
          const colors = option.cities.map((city) => city.color);
          const isActive = option.day === active;
          const isToday = option.day === today;
          return (
            <button
              key={option.day}
              type="button"
              data-day={option.day}
              aria-label={`Day ${option.number}, ${formatShortDay(option.day)}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                lockedUntil.current = Date.now() + 800;
                setActive(option.day);
                document.getElementById(`day-${option.day}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`relative flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-[12px] transition-[transform,background] duration-150 active:scale-95 ${
                colors.length === 0 ? (isActive ? "bg-ink text-bg" : "bg-fill") : isActive ? "text-white" : ""
              } ${isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-bg" : ""}`}
              style={colors.length > 0 ? { background: tint(colors, isActive ? "" : "33") } : undefined}
            >
              <span className={`text-[10px] font-semibold uppercase leading-none ${isActive ? "opacity-90" : "text-dim"}`}>
                D{option.number}
              </span>
              <span className="num mt-1 text-[17px] font-bold leading-none">{Number(option.day.slice(8))}</span>
              {missing.includes(option.day) ? (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-bad" aria-label="No hotel" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
