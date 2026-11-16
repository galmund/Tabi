"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type NavBarProps = {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  large?: boolean;
  trailing?: ReactNode;
  children?: ReactNode;
};

const HERO_PX = 200;

export function NavBar({ title, subtitle, back, large = true, trailing, children }: NavBarProps) {
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
      <header className="on-sky sticky top-0 z-30 -mx-4 lg:-mx-8" style={{ paddingTop: "var(--safe-top)" }}>
        <div
          aria-hidden
          className={`absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-sky-deep shadow-[0_1px_0_rgb(0_0_0/0.12)] transition-opacity duration-200 lg:w-[calc(100vw-var(--sidebar-w))] ${
            collapsed ? "opacity-100" : "opacity-0"
          }`}
        />
        <div ref={barRef} className="relative flex h-[var(--navbar-h)] items-center justify-between gap-2 px-4 lg:px-8">
          <div className="min-w-0 flex-1">
            {back ? (
              <Link
                href={back.href}
                className="press-fade -ml-2 inline-flex h-11 items-center pr-2 text-[17px] lg:hidden"
              >
                <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
                <span className="-ml-0.5 truncate">{back.label}</span>
              </Link>
            ) : null}
          </div>
          <span
            aria-hidden={!collapsed}
            className={`pointer-events-none absolute left-1/2 max-w-[48%] -translate-x-1/2 truncate text-[17px] font-semibold transition-[opacity,translate] duration-200 ease-[var(--ease-out)] ${
              collapsed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {title}
          </span>
          <div className="flex shrink-0 justify-end">{trailing}</div>
        </div>
      </header>

      {large ? (
        <div className="sky on-sky relative px-1 pb-14 pt-1 lg:pb-16 lg:pt-3">
          <h1 className="text-[34px] font-bold leading-[40px] tracking-[-0.03em] lg:text-[40px] lg:leading-[46px]">{title}</h1>
          {subtitle ? <p className="tnum mt-1 text-[15px] font-medium text-dim">{subtitle}</p> : null}
          {children}
          <div ref={markerRef} />
        </div>
      ) : (
        <div ref={markerRef} aria-hidden className="h-0" />
      )}
    </>
  );
}
