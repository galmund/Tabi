"use client";

import { useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@/app/actions";
import { DangerButton } from "@/components/form";

export function ConfirmDelete({
  label,
  run,
  onDeleted,
}: {
  label: string;
  run: () => Promise<ActionResult>;
  onDeleted: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <div>
      <DangerButton
        disabled={pending}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          startTransition(async () => {
            const result = await run();
            if (result.ok) onDeleted();
            else setError(result.error);
          });
        }}
      >
        {pending ? "Deleting…" : armed ? "Tap again to delete" : label}
      </DangerButton>
      {error ? <p className="mt-2 px-4 text-[13px] text-bad">{error}</p> : null}
    </div>
  );
}
