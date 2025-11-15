-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "aporte" INTEGER,
ADD COLUMN     "trimestre" INTEGER;

-- CreateIndex
CREATE INDEX "tasks_trimestre_idx" ON "tasks"("trimestre");

-- CreateIndex
CREATE INDEX "tasks_aporte_idx" ON "tasks"("aporte");
