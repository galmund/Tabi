"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, Check, CloudOff, RefreshCw } from "lucide-react";
import type { ActionResult } from "@/app/actions";
import { useIsOffline } from "@/lib/device";
import { isNetworkError, useQueuedEdits } from "@/lib/queue";

type Tone = "good" | "bad" | "warn";
type ToastInput = { message: string; tone?: Tone; action?: { label: string; run: () => void } };
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export const CONNECTION_ERROR = "Couldn't save — check the connection and try again.";

type Failed = { ok: false; error: string; offline?: boolean };

export async function safely<T extends ActionResult>(work: Promise<T>): Promise<T | Failed> {
  try {
    return await work;
  } catch (error) {
    return { ok: false, error: CONNECTION_ERROR, offline: isNetworkError(error) };
  }
}

const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextId = useRef(0);
  const offline = useIsOffline();
  const waiting = useQueuedEdits().length;

  const show = useCallback((input: ToastInput) => {
    nextId.current += 1;
    setToast({ ...input, id: nextId.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), DURATION);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4 bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+10px)] lg:bottom-[calc(var(--safe-bottom)+20px)] lg:pl-[var(--sidebar-w)]"
      >
        <div role="status" aria-live="polite" className="flex justify-center">
          {toast ? (
            <span
              key={toast.id}
              className="rise-in pointer-events-auto flex max-w-md items-center gap-2 rounded-[20px] bg-elev2 py-2 pl-3.5 pr-2 text-[14px] font-semibold shadow-[var(--shadow-lift)]"
            >
              {toast.tone === "bad" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-bad" />
              ) : toast.tone === "warn" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-orange" />
              ) : (
                <Check className="h-4 w-4 shrink-0 text-good" strokeWidth={2.6} />
              )}
              <span className="min-w-0 pr-1.5">{toast.message}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.run();
                    setToast(null);
                  }}
                  className="pressable -my-1 shrink-0 rounded-full px-3 py-1.5 text-accent hover:bg-fill"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </span>
          ) : null}
        </div>
        {offline || waiting > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-elev2 px-3.5 py-1.5 text-[13px] font-semibold text-dim shadow-[var(--shadow-lift)]">
            {offline ? <CloudOff className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {offline ? "Offline" : "Syncing"}
            {waiting > 0 ? ` · ${waiting === 1 ? "1 change" : `${waiting} changes`} waiting` : " · showing the saved trip"}
          </span>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
