"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Check, Copy, MapPin } from "lucide-react";
import { googleMapsUrl } from "@/lib/labels";

export function ideaMapsHref(idea: { name: string; mapsUrl: string | null; city: { name: string } | null }): string {
  return idea.mapsUrl ?? googleMapsUrl([idea.name, idea.city?.name, "Japan"].filter(Boolean).join(", "));
}

export function legTransitHref(leg: { mode: string; destination: string }): string {
  const destination = leg.mode === "FLIGHT" ? leg.destination : `${leg.destination}, Japan`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

export function stayDirectionsHref(stay: { name: string; address: string | null; city: { name: string } }): string {
  const destination = stay.address ?? `${stay.name}, ${stay.city.name}, Japan`;
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
      className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent hover:bg-fill active:bg-fill"
    >
      <MapPin className="h-[18px] w-[18px]" />
    </a>
  );
}

function copyWithSelection(value: string): boolean {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, value.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const done = () => setCopied(true);
    if (!navigator.clipboard) {
      if (copyWithSelection(value)) done();
      return;
    }
    navigator.clipboard.writeText(value).then(done, () => {
      if (copyWithSelection(value)) done();
    });
  };

  return { copied, copy };
}

export function CopyText({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
  const { copied, copy } = useCopy(value);
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy name"
      aria-label={`Copy ${value}`}
      className={`press-fade group inline text-left ${className}`}
    >
      {children}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
      {copied ? (
        <span aria-hidden className="pop-in ml-1.5 inline-flex translate-y-[-2px] items-center gap-0.5 rounded-full bg-good/15 px-1.5 py-0.5 align-middle text-[12px] font-semibold text-good">
          <Check className="h-3 w-3" />
          Copied
        </span>
      ) : (
        <Copy className="ml-1.5 inline h-[0.7em] w-[0.7em] translate-y-[-1px] align-middle text-faint transition-colors group-hover:text-dim" />
      )}
    </button>
  );
}

// Rendered as a span so it can sit inside a row's <button> without nesting buttons.
export function CopyIcon({ value, className = "" }: { value: string; className?: string }) {
  const { copied, copy } = useCopy(value);

  return (
    <span
      role="button"
      tabIndex={0}
      title="Copy name"
      aria-label={`Copy ${value}`}
      onClick={copy}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") copy(event);
      }}
      className={`pressable hit-area inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-fill ${
        copied ? "text-good" : "text-faint hover:text-dim"
      } ${className}`}
    >
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
      {copied ? (
        <Check key="copied" aria-hidden className="pop-in h-4 w-4" strokeWidth={2.6} />
      ) : (
        <Copy key="copy" aria-hidden className="h-[15px] w-[15px]" />
      )}
    </span>
  );
}

export function CopyChip({ value, prefix = "" }: { value: string; prefix?: string }) {
  const { copied, copy } = useCopy(value);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Copy ${value}`}
      onClick={copy}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") copy(event);
      }}
      className={`pressable tnum inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[14px] font-medium ${
        copied ? "bg-good/15 text-good" : "bg-fill text-ink"
      }`}
    >
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
      <span key={copied ? "copied" : "value"} aria-hidden className={`truncate ${copied ? "pop-in" : ""}`}>
        {copied ? "Copied" : `${prefix}${value}`}
      </span>
      {copied ? <Check className="pop-in h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-dim" />}
    </span>
  );
}
