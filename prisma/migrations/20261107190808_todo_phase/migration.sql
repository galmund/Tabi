-- CreateEnum
CREATE TYPE "TodoPhase" AS ENUM ('PLANNING', 'BEFORE_TRIP');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "phase" "TodoPhase" NOT NULL DEFAULT 'PLANNING';
