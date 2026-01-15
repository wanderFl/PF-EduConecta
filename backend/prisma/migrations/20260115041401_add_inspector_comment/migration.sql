-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "inspector_comment" TEXT;

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "parent_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_reports_student_external_id_idx" ON "ai_reports"("student_external_id");

-- CreateIndex
CREATE INDEX "ai_reports_parent_id_idx" ON "ai_reports"("parent_id");

-- CreateIndex
CREATE INDEX "ai_reports_report_type_idx" ON "ai_reports"("report_type");

-- CreateIndex
CREATE INDEX "ai_reports_created_at_idx" ON "ai_reports"("created_at");
