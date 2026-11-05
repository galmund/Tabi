import type { ReactNode } from "react";

export function SegmentedTrack({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid auto-cols-fr lg:max-w-sm grid-flow-col gap-0.5 rounded-[10px] bg-fill p-[2px] ${className}`}
    >
      {children}
    </div>
  );
}

export function segmentClass(active: boolean): string {
  return `flex h-8 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-200 ${
    active
      ? "bg-thumb text-ink shadow-[var(--shadow-thumb)]"
      : "text-dim active:text-ink"
  }`;
}
