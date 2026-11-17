"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionResult } from "@/app/actions";
import { safely, useToast } from "@/components/Toast";
import { useDragDismiss } from "@/lib/useDragDismiss";

function useSheetDialog(onDone: () => void, isDirty?: () => boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const close = () => dialogRef.current?.close();

  const allowDismiss = () => {
    if (!isDirty?.()) return true;
    setConfirming(true);
    return false;
  };

  const dismiss = () => {
    if (allowDismiss()) close();
  };

  const { handlers } = useDragDismiss({
    target: dialogRef,
    onDismiss: close,
    canDismiss: allowDismiss,
    onProgress: (progress) => dialogRef.current?.style.setProperty("--drag", String(progress)),
  });

  const dialogProps = {
    ref: dialogRef,
    className: "sheet",
    onClose: () => setTimeout(onDone, 300),
    onCancel: (event: React.SyntheticEvent) => {
      if (!allowDismiss()) event.preventDefault();
    },
    onClick: (event: React.MouseEvent) => {
      if (event.target === dialogRef.current) dismiss();
    },
  };

  return { dialogRef, close, dismiss, confirming, setConfirming, dragHandlers: handlers, dialogProps };
}

function DiscardPrompt({ onDiscard, onKeep }: { onDiscard: () => void; onKeep: () => void }) {
  return (
    <div className="fade-in absolute inset-0 z-10 flex items-end bg-black/35 p-3" onClick={onKeep}>
      <div
        role="alertdialog"
        aria-label="Discard changes?"
        className="rise-in w-full space-y-2"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-hidden rounded-[14px] bg-elev2 text-center">
          <p className="px-4 pb-2 pt-3.5 text-[13px] text-dim">You have changes that aren’t saved yet.</p>
          <button
            type="button"
            autoFocus
            onClick={onDiscard}
            className="h-14 w-full border-t border-line text-[18px] text-bad active:bg-fill"
          >
            Discard Changes
          </button>
        </div>
        <button
          type="button"
          onClick={onKeep}
          className="h-14 w-full rounded-[14px] bg-elev2 text-[18px] font-semibold text-accent active:bg-fill"
        >
          Keep Editing
        </button>
      </div>
    </div>
  );
}

function snapshot(form: HTMLFormElement | null): string {
  if (!form) return "";
  return JSON.stringify(
    [...new FormData(form).entries()].map(([key, value]) => [key, typeof value === "string" ? value : `${value.name}:${value.size}`])
  );
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
        if (event.pointerType === "mouse" || (event.target as Element).closest("button")) return;
        dragHandlers.onPointerDown(event);
      }}
    >
      <span className="absolute left-1/2 top-1.5 h-[5px] w-9 -translate-x-1/2 rounded-full bg-elev3 lg:hidden" />
      <div className="flex h-14 items-center justify-between gap-2 px-4 pt-1 lg:h-13 lg:pt-0">
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

const barButton = "press-fade px-1 text-[17px] text-accent disabled:text-faint";

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
  const formRef = useRef<HTMLFormElement>(null);
  const initial = useRef<string | null>(null);
  const { dialogRef, close, dismiss, confirming, setConfirming, dragHandlers, dialogProps } = useSheetDialog(
    onDone,
    () => initial.current !== null && snapshot(formRef.current) !== initial.current
  );
  const [state, formAction, pending] = useActionState(
    (previous: ActionResult | null, form: FormData) => safely(action(previous, form)),
    null
  );

  useEffect(() => {
    initial.current = snapshot(formRef.current);
  }, []);

  const toast = useToast();

  useEffect(() => {
    if (!state?.ok) return;
    dialogRef.current?.close();
    if (state.warning) toast({ message: state.warning, tone: "warn" });
  }, [state, dialogRef, toast]);

  return (
    <dialog {...dialogProps} aria-label={title}>
      <form ref={formRef} action={formAction} className="flex min-h-0 flex-col">
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
            <p role="alert" className="rise-in rounded-[12px] bg-bad/15 px-4 py-3 text-[15px] text-bad">
              {state.error}
            </p>
          ) : null}
          {footer?.(close)}
        </SheetBody>
      </form>
      {confirming ? <DiscardPrompt onDiscard={close} onKeep={() => setConfirming(false)} /> : null}
    </dialog>
  );
}

export function Sheet({
  title,
  onDone,
  leading,
  children,
}: {
  title: string;
  onDone: () => void;
  leading?: { label: string; onClick: () => void };
  children: (close: () => void) => ReactNode;
}) {
  const { dismiss, dragHandlers, dialogProps } = useSheetDialog(onDone);

  return (
    <dialog {...dialogProps} aria-label={title}>
      <div className="flex min-h-0 flex-col">
        <SheetHeader
          dragHandlers={dragHandlers}
          title={title}
          leading={
            leading ? (
              <button type="button" onClick={leading.onClick} className={`-ml-1 ${barButton}`}>
                {leading.label}
              </button>
            ) : null
          }
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
