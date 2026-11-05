-- CreateTable
CREATE TABLE "DayCity" (
    "day" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayCity_pkey" PRIMARY KEY ("day","cityId")
);

-- AddForeignKey
ALTER TABLE "DayCity" ADD CONSTRAINT "DayCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
