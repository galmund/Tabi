"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useDragDismiss } from "@/lib/useDragDismiss";

export type PhotoRef = { id: string; src: string };

type Gallery = {
  title: string;
  photos: PhotoRef[];
  index: number;
  onDelete?: (photo: PhotoRef) => Promise<boolean>;
};

const ViewerContext = createContext<(gallery: Gallery) => void>(() => {});

export function PhotoViewerProvider({ children }: { children: ReactNode }) {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const open = useCallback((next: Gallery) => setGallery(next), []);

  return (
    <ViewerContext.Provider value={open}>
      {children}
      <Viewer gallery={gallery} onChange={setGallery} onClose={() => setGallery(null)} />
    </ViewerContext.Provider>
  );
}

export function usePhotoViewer() {
  return useContext(ViewerContext);
}

function Viewer({
  gallery,
  onChange,
  onClose,
}: {
  gallery: Gallery | null;
  onChange: (gallery: Gallery) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (gallery && !dialog.open) dialog.showModal();
    if (!gallery && dialog.open) dialog.close();
  }, [gallery]);

  useEffect(() => {
    if (!gallery) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [gallery]);

  const { handlers, reset } = useDragDismiss({
    target: figureRef,
    scaleWithDrag: true,
    onDismiss: () => {
      onClose();
      requestAnimationFrame(reset);
    },
    onProgress: (progress) => {
      const figure = figureRef.current;
      if (figure) figure.style.opacity = String(Math.max(0.3, 1 - progress * 1.6));
    },
  });

  const photo = gallery?.photos[gallery.index];
  const count = gallery?.photos.length ?? 0;

  const step = (delta: number) => {
    if (!gallery) return;
    const index = gallery.index + delta;
    if (index < 0 || index >= count) return;
    setArmed(false);
    onChange({ ...gallery, index });
  };

  const remove = async () => {
    if (!gallery?.onDelete || !photo) return;
    if (!armed) {
      setArmed(true);
      return;
    }
    setDeleting(true);
    const removed = await gallery.onDelete(photo);
    setDeleting(false);
    setArmed(false);
    if (!removed) return;
    const photos = gallery.photos.filter((entry) => entry.id !== photo.id);
    if (photos.length === 0) onClose();
    else onChange({ ...gallery, photos, index: Math.min(gallery.index, photos.length - 1) });
  };

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={gallery ? `Photos of ${gallery.title}` : undefined}
      onClose={() => {
        setArmed(false);
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") step(-1);
        if (event.key === "ArrowRight") step(1);
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {gallery && photo ? (
        <>
          {gallery.onDelete ? (
            <button type="button" onClick={remove} disabled={deleting} className="lightbox-delete">
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting…" : armed ? "Tap to confirm" : "Delete"}
            </button>
          ) : null}
          <button type="button" onClick={onClose} aria-label="Close photo" className="lightbox-close">
            <X className="h-5 w-5" />
          </button>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                disabled={gallery.index === 0}
                onClick={() => step(-1)}
                className="lightbox-step left-3"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                disabled={gallery.index === count - 1}
                onClick={() => step(1)}
                className="lightbox-step right-3"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <figure ref={figureRef} className="lightbox-figure" {...handlers}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={photo.id} src={photo.src} alt={gallery.title} className="lightbox-img" draggable={false} />
            <figcaption className="lightbox-caption">
              {gallery.title}
              {count > 1 ? (
                <span className="lightbox-count">
                  {gallery.index + 1} / {count}
                </span>
              ) : null}
            </figcaption>
          </figure>
        </>
      ) : null}
    </dialog>
  );
}

export function PhotoStrip({ title, photos, size = 64 }: { title: string; photos: PhotoRef[]; size?: number }) {
  const open = usePhotoViewer();
  if (photos.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          aria-label={`View photo ${index + 1} of ${title}`}
          onClick={() => open({ title, photos, index })}
          className="pressable shrink-0 overflow-hidden rounded-[12px] bg-elev2"
          style={{ width: size, height: size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
