import { formatShortDay, plural } from "@/lib/dates";
import type { RouteSegment } from "@/lib/plan";

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
      <div className="flex h-4 gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Where we sleep each night">
        {segments.map((segment) => (
          <span
            key={segment.key}
            title={`${segment.city?.name ?? (segment.kind === "transit" ? "In transit" : "No hotel")} · ${plural(segment.nights, "night")}`}
            className={`h-full ${segment.kind === "missing" ? "hatched" : segment.kind === "transit" ? "bg-elev3" : ""}`}
            style={{
              flexGrow: segment.nights,
              flexBasis: 0,
              backgroundColor: segment.city?.color,
            }}
          />
        ))}
      </div>
      <div className="tnum mt-1.5 flex justify-between text-[12px] text-dim">
        <span>{formatShortDay(startDate)}</span>
        <span>{formatShortDay(endDate)}</span>
      </div>
      {legend.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {legend.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5 text-[14px]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.city?.color }} />
              <span className="font-medium">{segment.city?.name}</span>
              <span className="tnum text-dim">{segment.nights}n</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
