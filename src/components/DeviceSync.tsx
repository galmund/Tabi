"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CloudOff } from "lucide-react";
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

  if (!offline) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
      style={{ bottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 10px)" }}
    >
      <span className="flex items-center gap-1.5 rounded-full bg-elev2 px-3.5 py-1.5 text-[13px] font-semibold text-dim shadow-[var(--shadow-lift)]">
        <CloudOff className="h-3.5 w-3.5" />
        Offline · showing the saved trip
      </span>
    </div>
  );
}
