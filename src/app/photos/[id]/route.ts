import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { data: true, contentType: true, createdAt: true },
  });

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": photo.createdAt.toUTCString(),
    },
  });
}
