"use client";

import { useSyncExternalStore } from "react";
import { todayIn } from "@/lib/dates";

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const deviceToday = () => todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

export function useToday(serverToday: string): string {
  return useSyncExternalStore(subscribe, deviceToday, () => serverToday);
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useIsOffline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => !navigator.onLine,
    () => false
  );
}

const deviceClock = () => {
  const now = new Date();
  return `${deviceToday()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export function useNow(): { day: string; time: string } | null {
  const value = useSyncExternalStore(subscribe, deviceClock, () => null);
  if (!value) return null;
  const [day, time] = value.split(" ");
  return { day, time };
}
