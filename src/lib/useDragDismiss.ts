/* eslint-disable react-hooks/immutability -- imperative DOM writes keep the drag at 60fps without re-rendering */
"use client";

import { useCallback, useEffect, useRef, type PointerEvent, type RefObject } from "react";

const DECELERATION = 0.998;
const VELOCITY_WINDOW_MS = 100;

export function project(velocity: number, decelerationRate = DECELERATION) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function liveOffsetY(el: HTMLElement) {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === "none") return 0;
  return new DOMMatrixReadOnly(transform).m42;
}

type Options = {
  target: RefObject<HTMLElement | null>;
  onDismiss: () => void;
  
  onProgress?: (progress: number) => void;
  
  scaleWithDrag?: boolean;
};

export function useDragDismiss({ target, onDismiss, onProgress, scaleWithDrag = false }: Options) {
  const drag = useRef<{
    startY: number;
    base: number;
    samples: { y: number; t: number }[];
  } | null>(null);
  const animation = useRef<Animation | null>(null);

  const apply = useCallback(
    (offset: number) => {
      const el = target.current;
      if (!el) return;
      const height = el.offsetHeight || 1;
      const progress = Math.min(1, Math.max(0, offset / height));
      const scale = scaleWithDrag ? Math.max(0.85, 1 - offset / 1200) : 1;
      el.style.transform = `translateY(${offset}px)${scale === 1 ? "" : ` scale(${scale})`}`;
      onProgress?.(progress);
    },
    [target, onProgress, scaleWithDrag]
  );

  const settle = useCallback(
    (to: number, velocity: number, done?: () => void) => {
      const el = target.current;
      if (!el) return;
      const from = liveOffsetY(el);
      const distance = Math.abs(to - from);
      const speed = Math.max(Math.abs(velocity), 1);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 1 : Math.min(420, Math.max(180, (distance / speed) * 1000 * 1.6));

      const frames = (offset: number) => {
        const scale = scaleWithDrag ? Math.max(0.85, 1 - offset / 1200) : 1;
        return { transform: `translateY(${offset}px)${scale === 1 ? "" : ` scale(${scale})`}` };
      };

      animation.current?.cancel();
      const run = el.animate([frames(from), frames(to)], {
        duration,
        easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
        fill: "forwards",
      });
      animation.current = run;

      const height = el.offsetHeight || 1;
      let raf = 0;
      const tick = () => {
        onProgress?.(Math.min(1, Math.max(0, liveOffsetY(el) / height)));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      run.finished
        .then(() => {
          cancelAnimationFrame(raf);
          if (animation.current !== run) return;
          el.style.transform = to === 0 ? "" : `translateY(${to}px)`;
          run.cancel();
          animation.current = null;
          onProgress?.(to === 0 ? 0 : 1);
          done?.();
        })
        .catch(() => cancelAnimationFrame(raf));
    },
    [target, onProgress, scaleWithDrag]
  );

  useEffect(() => () => animation.current?.cancel(), []);

  const onPointerDown = (event: PointerEvent) => {
    const el = target.current;
    if (!el || (event.pointerType === "mouse" && event.button !== 0)) return;

    let base = 0;
    if (animation.current) {
      base = liveOffsetY(el);
      animation.current.cancel();
      animation.current = null;
      el.style.transform = `translateY(${base}px)`;
    }

    drag.current = {
      startY: event.clientY,
      base,
      samples: [{ y: event.clientY, t: event.timeStamp }],
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
  };

  const onPointerMove = (event: PointerEvent) => {
    const el = target.current;
    const current = drag.current;
    if (!el || !current) return;

    current.samples.push({ y: event.clientY, t: event.timeStamp });
    while (current.samples.length > 2 && event.timeStamp - current.samples[0].t > VELOCITY_WINDOW_MS) {
      current.samples.shift();
    }

    const raw = current.base + event.clientY - current.startY;
    apply(raw >= 0 ? raw : -rubberband(-raw, el.offsetHeight || 1, 0.3));
  };

  const end = (event: PointerEvent) => {
    const el = target.current;
    const current = drag.current;
    if (!el || !current) return;
    drag.current = null;

    const first = current.samples[0];
    const elapsed = Math.max(event.timeStamp - first.t, 1);
    const velocity = ((event.clientY - first.y) / elapsed) * 1000;
    const offset = liveOffsetY(el);
    const height = el.offsetHeight || 1;
    const projected = offset + project(velocity);

    if (projected > height * 0.5) {
      settle(height, velocity, onDismiss);
    } else {
      settle(0, velocity);
    }
  };

  const reset = useCallback(() => {
    animation.current?.cancel();
    animation.current = null;
    const el = target.current;
    if (el) el.style.transform = "";
    onProgress?.(0);
  }, [target, onProgress]);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
    reset,
  };
}
