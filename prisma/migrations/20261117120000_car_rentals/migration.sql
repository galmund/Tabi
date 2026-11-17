-- CreateTable
CREATE TABLE "CarRental" (
    "id" TEXT NOT NULL,
    "status" "StayStatus" NOT NULL DEFAULT 'BOOKED',
    "company" TEXT NOT NULL,
    "pickupDate" TEXT NOT NULL,
    "pickupTime" TEXT,
    "pickupPlace" TEXT,
    "returnDate" TEXT NOT NULL,
    "returnTime" TEXT,
    "returnPlace" TEXT,
    "bookingRef" TEXT,
    "url" TEXT,
    "price" DOUBLE PRECISION,
    "currency" "Currency",
    "payment" "Payment",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarRental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarRental_pickupDate_idx" ON "CarRental"("pickupDate");
