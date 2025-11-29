-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "paralelo" TEXT;

-- CreateIndex
CREATE INDEX "tasks_course_external_id_paralelo_idx" ON "tasks"("course_external_id", "paralelo");
