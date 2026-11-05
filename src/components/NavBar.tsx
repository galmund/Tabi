"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type NavBarProps = {
  title: string;
  eyebrow?: string;
  back?: { href: string; label: string };
  
  large?: boolean;
  trailing?: ReactNode;
};

const HERO_PX = 200;

export function NavBar({ title, eyebrow, back, large = true, trailing }: NavBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bar = barRef.current?.getBoundingClientRect();
      const marker = markerRef.current?.getBoundingClientRect();
      if (bar && marker) setCollapsed(marker.top <= bar.bottom - (large ? 0 : HERO_PX));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [large]);

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 lg:-mx-8" style={{ paddingTop: "var(--safe-top)" }}>
        <div
          aria-hidden
          className={`absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 lg:w-[calc(100vw-var(--sidebar-w))] border-b bg-bar backdrop-blur-xl backdrop-saturate-150 transition-[opacity,border-color] duration-200 ${
            collapsed ? "border-line opacity-100" : "border-transparent opacity-0"
          }`}
        />
        <div ref={barRef} className="relative flex h-11 items-center justify-between gap-2 px-4 lg:h-13 lg:px-8">
          <div className="min-w-0 flex-1">
            {back ? (
              <Link
                href={back.href}
                className="-ml-2 inline-flex h-11 items-center pr-2 text-[17px] text-accent active:opacity-50 lg:hidden"
              >
                <ChevronLeft className="h-7 w-7" strokeWidth={2.4} />
                <span className="-ml-0.5 truncate">{back.label}</span>
              </Link>
            ) : null}
          </div>
          <span
            aria-hidden={!collapsed}
            className={`pointer-events-none absolute left-1/2 max-w-[44%] -translate-x-1/2 truncate text-[17px] font-semibold transition-opacity duration-200 ${
              collapsed ? "opacity-100" : "opacity-0"
            }`}
          >
            {title}
          </span>
          <div className="flex shrink-0 justify-end">{trailing}</div>
        </div>
      </header>

      {large ? (
        <div className="px-1 pb-5 pt-1 lg:pb-6 lg:pt-2">
          {eyebrow ? (
            <p className="text-[13px] font-semibold uppercase tracking-[0.02em] text-dim">{eyebrow}</p>
          ) : null}
          <h1 className="text-[34px] font-bold leading-[41px] tracking-[-0.025em]">{title}</h1>
          <div ref={markerRef} />
        </div>
      ) : (
        <div ref={markerRef} aria-hidden className="h-0" />
      )}
    </>
  );
}
