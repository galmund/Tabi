-- CreateEnum
CREATE TYPE "StayStatus" AS ENUM ('BOOKED', 'OPTION');

-- CreateEnum
CREATE TYPE "TravelMode" AS ENUM ('FLIGHT', 'SHINKANSEN', 'TRAIN', 'BUS', 'FERRY', 'CAR', 'OTHER');

-- CreateEnum
CREATE TYPE "IdeaKind" AS ENUM ('SIGHT', 'FOOD', 'SHOPPING', 'ONSEN', 'EXPERIENCE', 'NIGHTLIFE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('MUST', 'NICE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('JPY', 'ILS', 'USD');

-- CreateEnum
CREATE TYPE "Payment" AS ENUM ('PAID', 'DEPOSIT', 'PAY_LATER');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL DEFAULT 'trip',
    "name" TEXT NOT NULL DEFAULT 'Japan 2027',
    "startDate" TEXT NOT NULL DEFAULT '2027-09-23',
    "endDate" TEXT NOT NULL DEFAULT '2027-10-26',

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJa" TEXT,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stay" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "StayStatus" NOT NULL DEFAULT 'BOOKED',
    "cityId" TEXT NOT NULL,
    "checkIn" TEXT NOT NULL,
    "checkOut" TEXT NOT NULL,
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "address" TEXT,
    "bookingRef" TEXT,
    "url" TEXT,
    "price" DOUBLE PRECISION,
    "currency" "Currency",
    "payment" "Payment",
    "cancelBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelLeg" (
    "id" TEXT NOT NULL,
    "mode" "TravelMode" NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departDate" TEXT NOT NULL,
    "departTime" TEXT,
    "arriveDate" TEXT,
    "arriveTime" TEXT,
    "carrier" TEXT,
    "bookingRef" TEXT,
    "seat" TEXT,
    "url" TEXT,
    "price" DOUBLE PRECISION,
    "currency" "Currency",
    "payment" "Payment",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "IdeaKind" NOT NULL DEFAULT 'SIGHT',
    "priority" "Priority" NOT NULL DEFAULT 'NICE',
    "cityId" TEXT,
    "mapsUrl" TEXT,
    "notes" TEXT,
    "needsBooking" BOOLEAN NOT NULL DEFAULT false,
    "day" TEXT,
    "time" TEXT,
    "dayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "fromIdea" BOOLEAN NOT NULL DEFAULT false,
    "stayId" TEXT,
    "legId" TEXT,
    "ideaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayNote" (
    "day" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "DayNote_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "Stay_checkIn_idx" ON "Stay"("checkIn");

-- CreateIndex
CREATE INDEX "TravelLeg_departDate_idx" ON "TravelLeg"("departDate");

-- CreateIndex
CREATE INDEX "Idea_day_idx" ON "Idea"("day");

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "Stay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_legId_fkey" FOREIGN KEY ("legId") REFERENCES "TravelLeg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
