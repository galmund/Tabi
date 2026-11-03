"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { deletePhoto, uploadPhoto, type PhotoOwner } from "@/app/actions";
import { GroupLabel } from "@/components/form";
import { usePhotoViewer, type PhotoRef } from "@/components/PhotoViewer";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

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

type Pending = { key: string; preview: string };

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const openViewer = usePhotoViewer();

  if (!ownerId) {
    return (
      <div>
        <GroupLabel>Photos</GroupLabel>
        <p className="flex items-center gap-2 rounded-[12px] bg-group px-4 py-3 text-[15px] text-dim">
          <Camera className="h-4 w-4 shrink-0" />
          Add it first, then reopen it to add photos.
        </p>
      </div>
    );
  }

  const upload = async (files: File[]) => {
    setError(null);
    const queued = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file, index) => ({ file, key: `${Date.now()}-${index}`, preview: URL.createObjectURL(file) }));
    if (queued.length < files.length) setError("Some of those files weren't images.");
    setPending((current) => [...current, ...queued.map(({ key, preview }) => ({ key, preview }))]);

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
      setPending((current) => current.filter((entry) => entry.key !== item.key));
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
          if (files.length > 0) void upload(files);
        }}
      />
      <div className="grid grid-cols-4 gap-2">
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
        {pending.map((item) => (
          <span key={item.key} className="relative aspect-square overflow-hidden rounded-[12px] bg-group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt="" className="h-full w-full object-cover opacity-60" />
            <span className="absolute inset-0 grid place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          </span>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="pressable flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] bg-group text-[12px] font-semibold text-accent"
        >
          <ImagePlus className="h-6 w-6" />
          Add
        </button>
      </div>
      <p className="mt-1.5 px-4 text-[13px] text-dim">
        {error ? <span className="text-bad">{error}</span> : "Room, entrance, menu, a ticket's QR code — from your library or the camera."}
      </p>
    </div>
  );
}
