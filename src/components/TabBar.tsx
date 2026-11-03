"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, CalendarDays, House, Lightbulb, ListChecks } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/days", label: "Days", icon: CalendarDays },
  { href: "/bookings", label: "Bookings", icon: BedDouble },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/todos", label: "To-dos", icon: ListChecks },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bar backdrop-blur-2xl backdrop-saturate-150"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto flex h-[var(--tabbar-h)] max-w-lg">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" || pathname === "/settings" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-[3px] text-[10px] font-medium tracking-normal transition-colors ${
                  active ? "text-accent" : "text-[#8e8e93] active:text-ink"
                }`}
              >
                <Icon className="h-[25px] w-[25px]" strokeWidth={active ? 2.3 : 1.9} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
