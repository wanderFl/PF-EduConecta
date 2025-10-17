-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTIVO', 'DOCENTE', 'FAMILIA');

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
    "due_date" TIMESTAMP(3) NOT NULL,
    "teacher_external_id" INTEGER NOT NULL,
    "course_external_id" INTEGER NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions_grades" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "grade" DECIMAL(5,2),
    "file_reference" TEXT,

    CONSTRAINT "submissions_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "student_external_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "justification_file_reference" TEXT,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "is_behavioral_note" BOOLEAN NOT NULL DEFAULT false,
    "author_teacher_external_id" INTEGER NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "communication_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "parents_cedula_key" ON "parents"("cedula");

-- CreateIndex
CREATE INDEX "parent_student_links_student_external_id_idx" ON "parent_student_links"("student_external_id");

-- CreateIndex
CREATE INDEX "tasks_teacher_external_id_idx" ON "tasks"("teacher_external_id");

-- CreateIndex
CREATE INDEX "tasks_course_external_id_idx" ON "tasks"("course_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_student_external_id_idx" ON "submissions_grades"("student_external_id");

-- CreateIndex
CREATE INDEX "attendance_records_student_external_id_date_idx" ON "attendance_records"("student_external_id", "date");

-- CreateIndex
CREATE INDEX "communications_author_teacher_external_id_idx" ON "communications"("author_teacher_external_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions_grades" ADD CONSTRAINT "submissions_grades_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
