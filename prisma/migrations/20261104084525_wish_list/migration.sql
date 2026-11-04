-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "wishId" TEXT;

-- CreateTable
CREATE TABLE "WishItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "forWhom" TEXT,
    "cityId" TEXT,
    "price" DOUBLE PRECISION,
    "currency" "Currency",
    "url" TEXT,
    "notes" TEXT,
    "bought" BOOLEAN NOT NULL DEFAULT false,
    "boughtAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Photo_wishId_idx" ON "Photo"("wishId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "WishItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishItem" ADD CONSTRAINT "WishItem_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
