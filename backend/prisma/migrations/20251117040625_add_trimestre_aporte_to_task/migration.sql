-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "course_external_id" INTEGER,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "submissions_grades" ADD COLUMN     "course_external_id" INTEGER,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "subject_external_id" INTEGER,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "aporte" INTEGER,
ADD COLUMN     "subject_external_id" INTEGER,
ADD COLUMN     "trimestre" INTEGER;

-- CreateIndex
CREATE INDEX "attendance_records_course_external_id_idx" ON "attendance_records"("course_external_id");

-- CreateIndex
CREATE INDEX "attendance_records_year_month_course_external_id_idx" ON "attendance_records"("year", "month", "course_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_course_external_id_idx" ON "submissions_grades"("course_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_subject_external_id_idx" ON "submissions_grades"("subject_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_year_month_course_external_id_idx" ON "submissions_grades"("year", "month", "course_external_id");

-- CreateIndex
CREATE INDEX "tasks_subject_external_id_idx" ON "tasks"("subject_external_id");
