"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Check, Copy, MapPin } from "lucide-react";
import { googleMapsUrl } from "@/lib/labels";

export function ideaMapsHref(idea: { name: string; mapsUrl: string | null; city: { name: string } | null }): string {
  return idea.mapsUrl ?? googleMapsUrl([idea.name, idea.city?.name, "Japan"].filter(Boolean).join(", "));
}

export function legTransitHref(leg: { mode: string; destination: string }): string {
  const destination = leg.mode === "FLIGHT" ? leg.destination : `${leg.destination}, Japan`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

export function PinLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title="Open in Google Maps"
      onClick={(event) => event.stopPropagation()}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent hover:bg-fill active:bg-fill"
    >
      <MapPin className="h-[18px] w-[18px]" />
    </a>
  );
}

// Rendered as a span so it can sit inside a row's <button> without nesting buttons.
export function CopyChip({ value, prefix = "" }: { value: string; prefix?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    event.preventDefault();
    navigator.clipboard?.writeText(value).then(
      () => setCopied(true),
      () => undefined
    );
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Copy ${value}`}
      onClick={copy}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") copy(event);
      }}
      className={`tnum inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[14px] font-medium transition-colors active:opacity-60 ${
        copied ? "bg-good/15 text-good" : "bg-fill text-ink"
      }`}
    >
      <span className="truncate">{copied ? "Copied" : `${prefix}${value}`}</span>
      {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-dim" />}
    </span>
  );
}
