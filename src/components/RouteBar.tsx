import type { CSSProperties } from "react";
import { addDays, formatShortDay, plural } from "@/lib/dates";
import type { RouteSegment } from "@/lib/plan";

function tileStyle(segment: RouteSegment): CSSProperties | undefined {
  const color = segment.city?.color;
  if (segment.kind !== "stay" || !color) return undefined;
  return {
    background: `linear-gradient(180deg, ${color} 0, ${color} 36%, color-mix(in srgb, ${color} 34%, var(--color-elev)) 100%)`,
  };
}

export function RouteBar({
  segments,
  startDate,
  endDate,
}: {
  segments: RouteSegment[];
  startDate: string;
  endDate: string;
}) {
  const legend = segments.filter((segment) => segment.kind === "stay");

  return (
    <div>
      <div className="flex h-8 gap-[2px]" role="img" aria-label="Where we sleep each night">
        {segments.flatMap((segment) =>
          Array.from({ length: segment.nights }, (_, index) => {
            const night = addDays(segment.from, index);
            const place = segment.city?.name ?? (segment.kind === "transit" ? "In transit" : "No hotel");
            return (
              <span
                key={night}
                title={`${formatShortDay(night)} · ${place} · ${plural(segment.nights, "night")}`}
                className={`min-w-0 flex-1 rounded-[3px] ${
                  segment.kind === "missing" ? "hatched-edge opacity-80" : segment.kind === "transit" ? "bg-elev3" : ""
                }`}
                style={tileStyle(segment)}
              />
            );
          })
        )}
      </div>
      <div className="tnum mt-2 flex justify-between text-[12px] font-medium text-dim">
        <span>{formatShortDay(startDate)}</span>
        <span>{formatShortDay(endDate)}</span>
      </div>
      {legend.length > 0 ? (
        <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 border-t-[0.5px] border-line pt-3.5">
          {legend.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5 text-[14px]">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: segment.city?.color }} />
              <span className="font-medium">{segment.city?.name}</span>
              <span className="tnum text-dim">{segment.nights}n</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
