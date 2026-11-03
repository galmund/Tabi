"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const looksUnmigrated = /relation .* does not exist|table .* does not exist|DATABASE_URL/i.test(error.message);

  return (
    <div className="rise-in pt-[calc(var(--safe-top)+56px)]">
      <div className="rounded-card bg-elev px-5 py-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bad/15 text-bad">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="text-[20px] font-bold">Something went wrong</p>
        <p className="mt-1.5 text-[15px] text-dim">{error.message}</p>
        {looksUnmigrated ? (
          <p className="mt-4 text-[13px] text-dim">
            First run? Create the tables:
            <code className="mt-1.5 block rounded-[10px] bg-elev2 px-3 py-2 text-[12px] text-ink">
              npm run db:deploy
            </code>
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="pressable mx-auto mt-5 flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent"
        >
          <RotateCw className="h-4 w-4" strokeWidth={2.4} />
          Try Again
        </button>
      </div>
    </div>
  );
}
