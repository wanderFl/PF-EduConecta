/*
  Warnings:

  - Changed the type of `status` on the `attendance_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_UNJUSTIFIED', 'ABSENT_JUSTIFIED_PENDING', 'ABSENT_JUSTIFIED_ACCEPTED');

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL;
