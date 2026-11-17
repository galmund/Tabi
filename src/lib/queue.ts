"use client";

import { useSyncExternalStore } from "react";

export type QueuedEdit =
  | { key: string; action: "todoDone"; args: [id: string, done: boolean] }
  | { key: string; action: "wishBought"; args: [id: string, bought: boolean] }
  | { key: string; action: "dayNote"; args: [day: string, text: string] };

const STORAGE_KEY = "tabi-queue";
const CHANGE_EVENT = "tabi-queue-change";
const EMPTY: QueuedEdit[] = [];

let cachedRaw: string | null = null;
let cachedEntries: QueuedEdit[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function queuedEdits(): QueuedEdit[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedEntries;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedEntries = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedEntries = EMPTY;
  }
  return cachedEntries;
}

function write(entries: QueuedEdit[]) {
  try {
    if (entries.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function enqueue(edit: QueuedEdit) {
  write([...queuedEdits().filter((entry) => entry.key !== edit.key), edit]);
}

export function forget(key: string) {
  if (queuedEdits().some((entry) => entry.key === key)) write(queuedEdits().filter((entry) => entry.key !== key));
}

export function dequeue(edit: QueuedEdit) {
  const sent = JSON.stringify(edit);
  write(queuedEdits().filter((entry) => JSON.stringify(entry) !== sent));
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useQueuedEdits(): QueuedEdit[] {
  return useSyncExternalStore(subscribe, queuedEdits, () => EMPTY);
}

export function useQueuedValue<T extends boolean | string>(key: string): T | undefined {
  const entry = useQueuedEdits().find((edit) => edit.key === key);
  return entry ? (entry.args[1] as T) : undefined;
}

export const isNetworkError = (error: unknown) =>
  error instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false);
