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
      className="fixed inset-x-0 bottom-0 z-30 border-t-[0.5px] border-line bg-bar backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
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
                className={`group flex h-full flex-col items-center justify-center gap-[3px] text-[10px] font-medium tracking-normal transition-colors duration-200 ${
                  active ? "text-accent" : "text-dim active:text-ink"
                }`}
              >
                <Icon
                  className="h-[25px] w-[25px] transition-transform duration-150 ease-[var(--ease-out)] group-active:scale-90"
                  strokeWidth={active ? 2.25 : 1.75}
                />
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
    <aside className="sidebar on-sky fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] flex-col bg-sky-deep lg:flex">
      <div className="flex items-center gap-3 px-5 pb-7 pt-7">
        <Image src="/icon.svg" alt="" width={34} height={34} className="rounded-[9px]" priority />
        <div className="min-w-0">
          <p className="flex items-baseline gap-1.5 text-[16px] font-semibold leading-tight">
            Tabi <span className="jp text-[13px] font-normal text-dim">旅</span>
          </p>
          <p className="truncate text-[13px] leading-tight text-dim">{tripName}</p>
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
                className={`flex h-9 items-center gap-3 rounded-[9px] px-3 text-[14px] font-medium transition-[background-color,color,scale] duration-150 active:scale-[0.98] ${
                  active ? "bg-white/[0.14] text-ink shadow-[inset_0_0.5px_0_rgb(255_255_255/0.12)]" : "text-dim hover:bg-white/[0.07] hover:text-ink"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
