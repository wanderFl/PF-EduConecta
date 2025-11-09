/*
  Warnings:

  - Added the required column `updated_at` to the `submissions_grades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "submissions_grades" ADD COLUMN     "comment_student" TEXT,
ADD COLUMN     "comment_teacher" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "graded_at" TIMESTAMP(3),
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
