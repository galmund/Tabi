import { Star } from "lucide-react";
import { IDEA_ICON, TRAVEL_COLOR, TRAVEL_ICON } from "@/components/icons";
import { IconCircle } from "@/components/ui";
import { formatShortDay } from "@/lib/dates";
import { IDEA_KIND_COLOR } from "@/lib/labels";
import type { IdeaRow, LegRow } from "@/lib/trip";

export function legTimes(leg: LegRow): string {
  const depart = leg.departTime ?? "";
  const arrive = leg.arriveTime
    ? `${leg.arriveTime}${leg.arriveDate && leg.arriveDate !== leg.departDate ? ` (${formatShortDay(leg.arriveDate)})` : ""}`
    : "";
  if (depart && arrive) return `${depart} → ${arrive}`;
  return depart || arrive;
}

export function LegSummary({ leg, showDate = false }: { leg: LegRow; showDate?: boolean }) {
  const Icon = TRAVEL_ICON[leg.mode];
  const detail = [showDate ? formatShortDay(leg.departDate) : null, legTimes(leg), leg.carrier, leg.seat]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <IconCircle color={TRAVEL_COLOR}>
        <Icon className="h-[18px] w-[18px]" />
      </IconCircle>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold leading-tight">
          {leg.origin} → {leg.destination}
        </p>
        {detail ? <p className="tnum mt-0.5 truncate text-[14px] text-dim">{detail}</p> : null}
      </div>
    </div>
  );
}

export function IdeaSummary({
  idea,
  showCity = false,
  trailing,
}: {
  idea: IdeaRow;
  showCity?: boolean;
  trailing?: React.ReactNode;
}) {
  const Icon = IDEA_ICON[idea.kind];
  const detail = [idea.time, showCity ? idea.city?.name : null].filter(Boolean).join(" · ");
  const cover = idea.photos[0];
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {cover ? (
        <Thumb src={cover.src} size={36} />
      ) : (
        <IconCircle color={IDEA_KIND_COLOR[idea.kind]}>
          <Icon className="h-[18px] w-[18px]" />
        </IconCircle>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[17px] leading-tight">
          <span className="truncate">{idea.name}</span>
          {idea.priority === "MUST" ? (
            <Star className="h-3.5 w-3.5 shrink-0 fill-yellow text-yellow" aria-label="Must-do" />
          ) : null}
        </p>
        {detail || trailing ? (
          <p className="tnum mt-0.5 flex items-center gap-1.5 truncate text-[14px] text-dim">
            {detail}
            {trailing}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function Thumb({ src, size }: { src: string; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      width={size}
      height={size}
      className="shrink-0 bg-elev2 object-cover"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    />
  );
}
