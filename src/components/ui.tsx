import type { CSSProperties, ReactNode } from "react";
import { Map as MapIcon, Navigation } from "lucide-react";
import { appleMapsUrl, googleMapsUrl } from "@/lib/labels";

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`rounded-card bg-elev p-4 ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  trailing,
  className = "",
}: {
  title: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-2.5 flex items-baseline justify-between gap-3 px-1 ${className}`}>
      <h2 className="text-[22px] font-bold tracking-tight">{title}</h2>
      {trailing ? <div className="shrink-0 text-[15px] text-dim">{trailing}</div> : null}
    </div>
  );
}

export function SectionFooter({ children }: { children: ReactNode }) {
  return <p className="mt-2 px-4 text-[13px] leading-snug text-dim">{children}</p>;
}

export function GroupedList({
  children,
  inset = 16,
  clip = true,
}: {
  children: ReactNode;
  inset?: number;
  clip?: boolean;
}) {
  return (
    <ul
      className={`separated rounded-card bg-elev ${clip ? "overflow-hidden" : ""}`}
      style={{ "--inset": `${inset}px` } as CSSProperties}
    >
      {children}
    </ul>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  children,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-card bg-elev px-6 py-10 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fill text-dim">
          {icon}
        </div>
      ) : null}
      <p className="text-[17px] font-semibold text-ink">{title}</p>
      {hint ? <p className="mt-1 text-[15px] text-dim">{hint}</p> : null}
      {children}
    </div>
  );
}

export function CityDot({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

export function CityTag({ city }: { city: { name: string; nameJa: string | null; color: string } }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold"
      style={{ color: city.color, backgroundColor: `${city.color}26` }}
    >
      {city.name}
      {city.nameJa ? <span className="font-medium opacity-75">{city.nameJa}</span> : null}
    </span>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "good" | "bad" | "orange";
}) {
  const tones = {
    neutral: "bg-fill text-dim",
    accent: "bg-accent/15 text-accent",
    good: "bg-good/15 text-good",
    bad: "bg-bad/15 text-bad",
    orange: "bg-orange/15 text-orange",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function MapButtons({ query, mapsUrl }: { query: string; mapsUrl?: string | null }) {
  const button =
    "pressable flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-fill text-[15px] font-semibold text-accent";
  return (
    <div className="flex gap-2">
      <a href={mapsUrl ?? googleMapsUrl(query)} target="_blank" rel="noreferrer" className={button}>
        <MapIcon className="h-4 w-4" />
        Google Maps
      </a>
      <a href={appleMapsUrl(query)} target="_blank" rel="noreferrer" className={button}>
        <Navigation className="h-4 w-4" />
        Apple Maps
      </a>
    </div>
  );
}

export function IconCircle({
  color,
  children,
  size = 36,
}: {
  color: string;
  children: ReactNode;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, color, backgroundColor: `${color}24` }}
    >
      {children}
    </span>
  );
}
