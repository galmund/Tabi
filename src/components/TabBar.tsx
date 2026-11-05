"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BedDouble, CalendarDays, House, Lightbulb, ListChecks, Settings } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/days", label: "Days", icon: CalendarDays },
  { href: "/bookings", label: "Bookings", icon: BedDouble },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/todos", label: "To-dos", icon: ListChecks },
] as const;

function isActive(href: string, pathname: string, sidebar: boolean) {
  if (href === "/") return pathname === "/" || (!sidebar && pathname === "/settings");
  return pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bar backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto flex h-[var(--tabbar-h)] max-w-lg">
        {TABS.map((tab) => {
          const active = isActive(tab.href, pathname, false);
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

export function Sidebar({ tripName }: { tripName: string }) {
  const pathname = usePathname();
  const items = [...TABS, { href: "/settings", label: "Settings", icon: Settings }];

  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] flex-col border-r border-line bg-bar backdrop-blur-2xl backdrop-saturate-150 lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <Image src="/icon.svg" alt="" width={30} height={30} className="rounded-[8px]" priority />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight">Tabi</p>
          <p className="truncate text-[12px] leading-tight text-dim">{tripName}</p>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 px-3">
        {items.map((item) => {
          const active = isActive(item.href, pathname, true);
          const Icon = item.icon;
          return (
            <li key={item.href} className={item.href === "/settings" ? "mt-auto mb-4" : undefined}>
              <Link
                href={item.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={`flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 text-[14px] font-medium transition-colors ${
                  active ? "bg-accent/15 text-accent" : "text-ink hover:bg-fill"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "" : "text-accent"}`} strokeWidth={2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
