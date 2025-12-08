-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'INSPECTOR';

-- CreateTable
CREATE TABLE "disciplinary_reports" (
    "id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "course_external_id" INTEGER NOT NULL,
    "inspector_external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENVIADA',
    "parent_viewed_at" TIMESTAMP(3),
    "parent_response" TEXT,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinary_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disciplinary_reports_student_external_id_idx" ON "disciplinary_reports"("student_external_id");

-- CreateIndex
CREATE INDEX "disciplinary_reports_course_external_id_idx" ON "disciplinary_reports"("course_external_id");

-- CreateIndex
CREATE INDEX "disciplinary_reports_inspector_external_id_idx" ON "disciplinary_reports"("inspector_external_id");

-- CreateIndex
CREATE INDEX "disciplinary_reports_incident_date_idx" ON "disciplinary_reports"("incident_date");

-- CreateIndex
CREATE INDEX "disciplinary_reports_status_idx" ON "disciplinary_reports"("status");
