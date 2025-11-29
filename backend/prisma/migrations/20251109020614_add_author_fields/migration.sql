-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "author_id" INTEGER,
ADD COLUMN     "author_type" TEXT DEFAULT 'docente';

-- CreateIndex
CREATE INDEX "tasks_author_type_idx" ON "tasks"("author_type");
