/*
  Warnings:

  - You are about to drop the column `created_at` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `author_type` on the `tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[task_id,student_external_id]` on the table `submissions_grades` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."tasks_author_type_idx";

-- AlterTable
ALTER TABLE "submissions_grades" DROP COLUMN "created_at",
DROP COLUMN "feedback",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "author_id",
DROP COLUMN "author_type";

-- CreateIndex
CREATE UNIQUE INDEX "submissions_grades_task_id_student_external_id_key" ON "submissions_grades"("task_id", "student_external_id");
