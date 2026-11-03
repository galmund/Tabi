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
