"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveDayNote, setTodoDone, setWishBought, type ActionResult } from "@/app/actions";
import { safely, useToast } from "@/components/Toast";
import { dequeue, enqueue, forget, isNetworkError, queuedEdits, useQueuedEdits, type QueuedEdit } from "@/lib/queue";

const RETRY_MS = 30_000;

function send(edit: QueuedEdit): Promise<ActionResult> {
  switch (edit.action) {
    case "todoDone":
      return setTodoDone(...edit.args);
    case "wishBought":
      return setWishBought(...edit.args);
    case "dayNote":
      return saveDayNote(...edit.args);
  }
}

export async function saveOrQueue(edit: QueuedEdit): Promise<{ ok: true; queued?: boolean } | { ok: false; error: string }> {
  if (navigator.onLine === false) {
    enqueue(edit);
    return { ok: true, queued: true };
  }
  const result = await safely(send(edit));
  if (!result.ok && "offline" in result && result.offline) {
    enqueue(edit);
    return { ok: true, queued: true };
  }
  if (result.ok) forget(edit.key);
  return result;
}

export function QueueSync() {
  const router = useRouter();
  const toast = useToast();
  const waiting = useQueuedEdits().length;
  const running = useRef(false);

  useEffect(() => {
    if (waiting === 0) return;

    const flush = async () => {
      if (running.current || navigator.onLine === false) return;
      running.current = true;
      let synced = 0;
      let dropped = 0;
      try {
        for (const edit of queuedEdits()) {
          try {
            const result = await send(edit);
            dequeue(edit);
            if (result.ok) synced += 1;
            else dropped += 1;
          } catch (error) {
            if (isNetworkError(error)) break;
            dequeue(edit);
            dropped += 1;
          }
        }
      } finally {
        running.current = false;
      }
      if (synced + dropped === 0) return;
      router.refresh();
      if (dropped > 0) {
        toast({ message: `${dropped === 1 ? "1 change" : `${dropped} changes`} couldn't be saved — the item may have been deleted.`, tone: "bad" });
      } else {
        toast({ message: `Synced ${synced === 1 ? "1 change" : `${synced} changes`} made offline` });
      }
    };

    void flush();
    const timer = setInterval(flush, RETRY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void flush();
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [waiting, router, toast]);

  return null;
}
