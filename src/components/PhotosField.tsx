"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { deletePhoto, uploadPhoto, type PhotoOwner } from "@/app/actions";
import { GroupLabel } from "@/components/form";
import { usePhotoViewer, type PhotoRef } from "@/components/PhotoViewer";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;
const MAX_DRAFT_BYTES = 3.3 * 1024 * 1024;
const HINT = "Room, entrance, menu, a ticket's QR code — from your library or the camera.";

async function downscale(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 600_000 && file.type !== "image/heic") {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

type Local = { key: string; preview: string };
type Draft = Local & { file: File };

const localKey = (index: number) => `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;

function Picker({
  onPick,
  error,
  children,
}: {
  onPick: (files: File[]) => void;
  error: string | null;
  children: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <GroupLabel>Photos</GroupLabel>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        className="hidden"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) onPick(files);
        }}
      />
      <div className="grid grid-cols-4 gap-2">
        {children}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="pressable flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] bg-group text-[12px] font-semibold text-accent"
        >
          <ImagePlus className="h-6 w-6" />
          Add
        </button>
      </div>
      <p className="mt-1.5 px-4 text-[13px] text-dim">{error ? <span className="text-bad">{error}</span> : HINT}</p>
    </div>
  );
}

function LocalTile({ item, busy, onRemove }: { item: Local; busy: boolean; onRemove?: () => void }) {
  return (
    <span className="relative aspect-square overflow-hidden rounded-[12px] bg-group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.preview} alt="" className={`h-full w-full object-cover ${busy ? "opacity-60" : ""}`} />
      {busy ? (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </span>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove photo"
          onClick={onRemove}
          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      ) : null}
    </span>
  );
}

function images(files: File[]) {
  const accepted = files.filter((file) => file.type.startsWith("image/"));
  return { accepted, rejected: accepted.length < files.length };
}

function DraftPhotos() {
  const formInputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [shrinking, setShrinking] = useState<Local[]>([]);
  const [error, setError] = useState<string | null>(null);
  const draftBytes = useRef(0);

  useEffect(() => {
    draftBytes.current = drafts.reduce((sum, draft) => sum + draft.file.size, 0);
    const input = formInputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    for (const draft of drafts) transfer.items.add(draft.file);
    input.files = transfer.files;
  }, [drafts]);

  const add = async (files: File[]) => {
    const { accepted, rejected } = images(files);
    setError(rejected ? "Some of those files weren't images." : null);
    const queued = accepted.map((file, index) => ({ file, key: localKey(index), preview: URL.createObjectURL(file) }));
    setShrinking((current) => [...current, ...queued.map(({ key, preview }) => ({ key, preview }))]);

    const shrunk = await Promise.all(queued.map(async (item) => ({ ...item, file: await downscale(item.file) })));
    setShrinking((current) => current.filter((entry) => !queued.some((item) => item.key === entry.key)));

    const kept: Draft[] = [];
    let total = draftBytes.current;
    for (const item of shrunk) {
      if (total + item.file.size > MAX_DRAFT_BYTES) {
        URL.revokeObjectURL(item.preview);
        setError("That's a lot of photos for one go — save first, then add the rest.");
        continue;
      }
      total += item.file.size;
      kept.push(item);
    }
    draftBytes.current = total;
    setDrafts((current) => [...current, ...kept]);
  };

  const remove = (key: string) =>
    setDrafts((current) => {
      const draft = current.find((entry) => entry.key === key);
      if (draft) URL.revokeObjectURL(draft.preview);
      return current.filter((entry) => entry.key !== key);
    });

  return (
    <>
      <input ref={formInputRef} type="file" name="newPhotos" multiple className="hidden" tabIndex={-1} aria-hidden />
      <Picker onPick={(files) => void add(files)} error={error}>
        {drafts.map((draft) => (
          <LocalTile key={draft.key} item={draft} busy={false} onRemove={() => remove(draft.key)} />
        ))}
        {shrinking.map((item) => (
          <LocalTile key={item.key} item={item} busy />
        ))}
      </Picker>
    </>
  );
}

function SavedPhotos({
  owner,
  ownerId,
  title,
  initial,
}: {
  owner: PhotoOwner;
  ownerId: string;
  title: string;
  initial: PhotoRef[];
}) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState<Local[]>([]);
  const [error, setError] = useState<string | null>(null);
  const openViewer = usePhotoViewer();

  const upload = async (files: File[]) => {
    const { accepted, rejected } = images(files);
    setError(rejected ? "Some of those files weren't images." : null);
    const queued = accepted.map((file, index) => ({ file, key: localKey(index), preview: URL.createObjectURL(file) }));
    setUploading((current) => [...current, ...queued.map(({ key, preview }) => ({ key, preview }))]);

    for (const item of queued) {
      const form = new FormData();
      form.set("owner", owner);
      form.set("ownerId", ownerId);
      form.set("photo", await downscale(item.file));
      try {
        const result = await uploadPhoto(form);
        if (result.ok) setPhotos((current) => [...current, result.photo]);
        else setError(result.error);
      } catch {
        setError("Couldn't upload — check the connection and try again.");
      }
      setUploading((current) => current.filter((entry) => entry.key !== item.key));
      URL.revokeObjectURL(item.preview);
    }
  };

  const remove = async (photo: PhotoRef) => {
    try {
      const result = await deletePhoto(photo.id);
      if (!result.ok) return false;
      setPhotos((current) => current.filter((entry) => entry.id !== photo.id));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Picker onPick={(files) => void upload(files)} error={error}>
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          aria-label={`View photo ${index + 1}`}
          onClick={() => openViewer({ title, photos, index, onDelete: remove })}
          className="pressable aspect-square overflow-hidden rounded-[12px] bg-group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
      {uploading.map((item) => (
        <LocalTile key={item.key} item={item} busy />
      ))}
    </Picker>
  );
}

export function PhotosField({
  owner,
  ownerId,
  title,
  initial,
}: {
  owner: PhotoOwner;
  ownerId?: string;
  title: string;
  initial: PhotoRef[];
}) {
  return ownerId ? (
    <SavedPhotos owner={owner} ownerId={ownerId} title={title} initial={initial} />
  ) : (
    <DraftPhotos />
  );
}
