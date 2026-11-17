"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberTimeZone } from "@/app/actions";
import { useIsOffline } from "@/lib/device";
import { TIME_ZONE_COOKIE } from "@/lib/cookies";

export function DeviceSync() {
  const offline = useIsOffline();
  const pathname = usePathname();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.split("=")[1];
    if (timeZone && decodeURIComponent(saved ?? "") !== timeZone) {
      rememberTimeZone(timeZone).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || offline) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage("save-for-offline"))
      .catch(() => {});
  }, [pathname, offline]);

  return null;
}
