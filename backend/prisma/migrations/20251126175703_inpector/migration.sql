-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'THREAD',
    "student_external_id" INTEGER NOT NULL,
    "teacher_external_id" INTEGER NOT NULL,
    "parent_id" TEXT,
    "subject" TEXT,
    "is_behavioral_note" BOOLEAN NOT NULL DEFAULT false,
    "archived_by_parent" BOOLEAN NOT NULL DEFAULT false,
    "archived_by_teacher" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinary_reports" (
    "id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "course_external_id" INTEGER NOT NULL,
    "paralelo" TEXT NOT NULL,
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
CREATE INDEX "conversations_student_external_id_idx" ON "conversations"("student_external_id");

-- CreateIndex
CREATE INDEX "conversations_teacher_external_id_idx" ON "conversations"("teacher_external_id");

-- CreateIndex
CREATE INDEX "conversations_parent_id_idx" ON "conversations"("parent_id");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_messages_created_at_idx" ON "conversation_messages"("created_at");

-- CreateIndex
CREATE INDEX "disciplinary_reports_student_external_id_idx" ON "disciplinary_reports"("student_external_id");

-- CreateIndex
CREATE INDEX "disciplinary_reports_course_external_id_paralelo_idx" ON "disciplinary_reports"("course_external_id", "paralelo");

-- CreateIndex
CREATE INDEX "disciplinary_reports_inspector_external_id_idx" ON "disciplinary_reports"("inspector_external_id");

-- CreateIndex
CREATE INDEX "disciplinary_reports_incident_date_idx" ON "disciplinary_reports"("incident_date");

-- CreateIndex
CREATE INDEX "disciplinary_reports_status_idx" ON "disciplinary_reports"("status");

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
