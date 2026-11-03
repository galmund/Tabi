"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionResult } from "@/app/actions";
import { useDragDismiss } from "@/lib/useDragDismiss";

function useSheetDialog(onDone: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const dismiss = () => dialogRef.current?.close();

  const { handlers } = useDragDismiss({
    target: dialogRef,
    onDismiss: dismiss,
    onProgress: (progress) => dialogRef.current?.style.setProperty("--drag", String(progress)),
  });

  const dialogProps = {
    ref: dialogRef,
    className: "sheet",
    onClose: () => setTimeout(onDone, 300),
    onClick: (event: React.MouseEvent) => {
      if (event.target === dialogRef.current) dismiss();
    },
  };

  return { dialogRef, dismiss, dragHandlers: handlers, dialogProps };
}

function SheetHeader({
  dragHandlers,
  leading,
  title,
  trailing,
}: {
  dragHandlers: ReturnType<typeof useDragDismiss>["handlers"];
  leading: ReactNode;
  title: string;
  trailing: ReactNode;
}) {
  return (
    <div
      className="relative shrink-0 touch-none border-b border-line"
      {...dragHandlers}
      onPointerDown={(event) => {
        if ((event.target as Element).closest("button")) return;
        dragHandlers.onPointerDown(event);
      }}
    >
      <span className="absolute left-1/2 top-1.5 h-[5px] w-9 -translate-x-1/2 rounded-full bg-elev3" />
      <div className="flex h-14 items-center justify-between gap-2 px-4 pt-1">
        <div className="flex min-w-16 justify-start">{leading}</div>
        <h3 className="truncate text-[17px] font-semibold">{title}</h3>
        <div className="flex min-w-16 justify-end">{trailing}</div>
      </div>
    </div>
  );
}

function SheetBody({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-4 pt-5"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 28px)" }}
    >
      {children}
    </div>
  );
}

const barButton = "px-1 text-[17px] text-accent active:opacity-50 disabled:text-faint";

export function FormSheet({
  title,
  submitLabel,
  action,
  onDone,
  children,
  footer,
}: {
  title: string;
  submitLabel: string;
  action: (previous: ActionResult | null, form: FormData) => Promise<ActionResult>;
  onDone: () => void;
  children: ReactNode;
  footer?: (close: () => void) => ReactNode;
}) {
  const { dialogRef, dismiss, dragHandlers, dialogProps } = useSheetDialog(onDone);
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) dialogRef.current?.close();
  }, [state, dialogRef]);

  return (
    <dialog {...dialogProps} aria-label={title}>
      <form action={formAction} className="flex min-h-0 flex-col">
        <SheetHeader
          dragHandlers={dragHandlers}
          title={title}
          leading={
            <button type="button" onClick={dismiss} className={`-ml-1 ${barButton}`}>
              Cancel
            </button>
          }
          trailing={
            <button type="submit" disabled={pending} className={`-mr-1 font-semibold ${barButton}`}>
              {pending ? "Saving…" : submitLabel}
            </button>
          }
        />
        <SheetBody>
          {children}
          {state && !state.ok ? (
            <p className="rounded-[12px] bg-bad/15 px-4 py-3 text-[15px] text-bad">{state.error}</p>
          ) : null}
          {footer?.(dismiss)}
        </SheetBody>
      </form>
    </dialog>
  );
}

export function Sheet({
  title,
  onDone,
  children,
}: {
  title: string;
  onDone: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const { dismiss, dragHandlers, dialogProps } = useSheetDialog(onDone);

  return (
    <dialog {...dialogProps} aria-label={title}>
      <div className="flex min-h-0 flex-col">
        <SheetHeader
          dragHandlers={dragHandlers}
          title={title}
          leading={null}
          trailing={
            <button type="button" onClick={dismiss} className={`-mr-1 font-semibold ${barButton}`}>
              Done
            </button>
          }
        />
        <SheetBody>{children(dismiss)}</SheetBody>
      </div>
    </dialog>
  );
}
