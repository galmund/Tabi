-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stayId" TEXT,
    "legId" TEXT,
    "ideaId" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Photo_stayId_idx" ON "Photo"("stayId");

-- CreateIndex
CREATE INDEX "Photo_legId_idx" ON "Photo"("legId");

-- CreateIndex
CREATE INDEX "Photo_ideaId_idx" ON "Photo"("ideaId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "Stay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_legId_fkey" FOREIGN KEY ("legId") REFERENCES "TravelLeg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
