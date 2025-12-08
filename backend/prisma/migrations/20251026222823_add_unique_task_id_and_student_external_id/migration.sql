/*
  Warnings:

  - A unique constraint covering the columns `[task_id,student_external_id]` on the table `submissions_grades` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "submissions_grades_task_id_student_external_id_key" ON "submissions_grades"("task_id", "student_external_id");
