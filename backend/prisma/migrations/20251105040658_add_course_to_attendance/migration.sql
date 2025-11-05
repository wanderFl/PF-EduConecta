/*
  Warnings:

  - Added the required column `course_external_id` to the `attendance_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "course_external_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "attendance_records_course_external_id_date_idx" ON "attendance_records"("course_external_id", "date");
