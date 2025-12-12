-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTIVO', 'DOCENTE', 'FAMILIA', 'INSPECTOR');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_UNJUSTIFIED', 'ABSENT_JUSTIFIED_PENDING', 'ABSENT_JUSTIFIED_ACCEPTED');

-- CreateEnum
CREATE TYPE "CommunicationKind" AS ENUM ('THREAD', 'NOTICE');

-- CreateEnum
CREATE TYPE "SenderRole" AS ENUM ('PARENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "external_id" TEXT,
    "parent_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fcm_token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "cedula" TEXT,
    "home_address" TEXT,
    "work_place" TEXT,
    "security_pin_hash" TEXT NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_links" (
    "parent_id" TEXT NOT NULL,
    "student_external_id" TEXT NOT NULL,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("parent_id","student_external_id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "max_points" INTEGER,
    "file_reference" TEXT,
    "teacher_external_id" INTEGER NOT NULL,
    "course_external_id" INTEGER NOT NULL,
    "trimestre" INTEGER,
    "aporte" INTEGER,
    "subject_external_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions_grades" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "grade" DECIMAL(5,2),
    "file_reference" TEXT,
    "comment_student" TEXT,
    "comment_teacher" TEXT,
    "subject_external_id" INTEGER,
    "course_external_id" INTEGER,
    "year" INTEGER,
    "month" INTEGER,
    "submitted_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "justification_file_reference" TEXT,
    "justification_reason" TEXT,
    "course_external_id" INTEGER,
    "year" INTEGER,
    "month" INTEGER,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "kind" "CommunicationKind" NOT NULL DEFAULT 'THREAD',
    "subject" TEXT,
    "student_external_id" INTEGER NOT NULL,
    "teacher_external_id" INTEGER NOT NULL,
    "parent_id" TEXT,
    "is_behavioral_note" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_by_parent" BOOLEAN NOT NULL DEFAULT false,
    "archived_by_teacher" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "communication_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sender_role" "SenderRole" NOT NULL,
    "sender_parent_id" TEXT,
    "sender_teacher_external_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "reply_to_id" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_parent_id_key" ON "users"("parent_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_external_id_idx" ON "users"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_fcm_token_key" ON "device_tokens"("fcm_token");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "parents_cedula_key" ON "parents"("cedula");

-- CreateIndex
CREATE INDEX "parent_student_links_student_external_id_idx" ON "parent_student_links"("student_external_id");

-- CreateIndex
CREATE INDEX "tasks_teacher_external_id_idx" ON "tasks"("teacher_external_id");

-- CreateIndex
CREATE INDEX "tasks_course_external_id_idx" ON "tasks"("course_external_id");

-- CreateIndex
CREATE INDEX "tasks_trimestre_idx" ON "tasks"("trimestre");

-- CreateIndex
CREATE INDEX "tasks_aporte_idx" ON "tasks"("aporte");

-- CreateIndex
CREATE INDEX "tasks_subject_external_id_idx" ON "tasks"("subject_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_student_external_id_idx" ON "submissions_grades"("student_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_course_external_id_idx" ON "submissions_grades"("course_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_subject_external_id_idx" ON "submissions_grades"("subject_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_year_month_course_external_id_idx" ON "submissions_grades"("year", "month", "course_external_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_grades_task_id_student_external_id_key" ON "submissions_grades"("task_id", "student_external_id");

-- CreateIndex
CREATE INDEX "attendance_records_student_external_id_date_idx" ON "attendance_records"("student_external_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_course_external_id_idx" ON "attendance_records"("course_external_id");

-- CreateIndex
CREATE INDEX "attendance_records_course_external_id_date_idx" ON "attendance_records"("course_external_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_year_month_course_external_id_idx" ON "attendance_records"("year", "month", "course_external_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_student_external_id_date_key" ON "attendance_records"("student_external_id", "date");

-- CreateIndex
CREATE INDEX "communications_student_external_id_idx" ON "communications"("student_external_id");

-- CreateIndex
CREATE INDEX "communications_teacher_external_id_idx" ON "communications"("teacher_external_id");

-- CreateIndex
CREATE INDEX "communications_parent_id_idx" ON "communications"("parent_id");

-- CreateIndex
CREATE INDEX "messages_communication_id_idx" ON "messages"("communication_id");

-- CreateIndex
CREATE INDEX "MessageAttachment_message_id_idx" ON "MessageAttachment"("message_id");

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

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions_grades" ADD CONSTRAINT "submissions_grades_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
