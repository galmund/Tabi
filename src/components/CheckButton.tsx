"use client";

import { Check } from "lucide-react";

export function CheckButton({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onToggle}
      className="flex h-full shrink-0 items-center py-3 pl-4 pr-3"
    >
      <span
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors ${
          checked ? "border-accent bg-accent text-on-accent" : "border-faint"
        }`}
      >
        {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
