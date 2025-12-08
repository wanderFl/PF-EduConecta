/*
  Warnings:

  - You are about to drop the column `author_teacher_external_id` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `paralelo` on the `disciplinary_reports` table. All the data in the column will be lost.
  - You are about to drop the column `paralelo` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `conversation_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[student_external_id,date]` on the table `attendance_records` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `attendance_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `student_external_id` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_external_id` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_role` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_UNJUSTIFIED', 'ABSENT_JUSTIFIED_PENDING', 'ABSENT_JUSTIFIED_ACCEPTED');

-- CreateEnum
CREATE TYPE "CommunicationKind" AS ENUM ('THREAD', 'NOTICE');

-- CreateEnum
CREATE TYPE "SenderRole" AS ENUM ('PARENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('OPEN', 'CLOSED');

-- DropForeignKey
ALTER TABLE "public"."conversation_messages" DROP CONSTRAINT "conversation_messages_conversation_id_fkey";

-- DropIndex
DROP INDEX "public"."communications_author_teacher_external_id_idx";

-- DropIndex
DROP INDEX "public"."disciplinary_reports_course_external_id_paralelo_idx";

-- DropIndex
DROP INDEX "public"."tasks_course_external_id_paralelo_idx";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "justification_reason" TEXT,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "year" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "communications" DROP COLUMN "author_teacher_external_id",
ADD COLUMN     "archived_by_parent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archived_by_teacher" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "kind" "CommunicationKind" NOT NULL DEFAULT 'THREAD',
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "status" "CommunicationStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "student_external_id" INTEGER NOT NULL,
ADD COLUMN     "teacher_external_id" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "subject" DROP NOT NULL;

-- AlterTable
ALTER TABLE "disciplinary_reports" DROP COLUMN "paralelo";

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "reply_to_id" TEXT,
ADD COLUMN     "sender_parent_id" TEXT,
ADD COLUMN     "sender_role" "SenderRole" NOT NULL,
ADD COLUMN     "sender_teacher_external_id" INTEGER;

-- AlterTable
ALTER TABLE "password_resets" ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "submissions_grades" ADD COLUMN     "course_external_id" INTEGER,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "subject_external_id" INTEGER,
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "submitted_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "paralelo",
ADD COLUMN     "subject_external_id" INTEGER;

-- DropTable
DROP TABLE "public"."conversation_messages";

-- DropTable
DROP TABLE "public"."conversations";

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

-- CreateIndex
CREATE INDEX "MessageAttachment_message_id_idx" ON "MessageAttachment"("message_id");

-- CreateIndex
CREATE INDEX "attendance_records_course_external_id_idx" ON "attendance_records"("course_external_id");

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
CREATE INDEX "disciplinary_reports_course_external_id_idx" ON "disciplinary_reports"("course_external_id");

-- CreateIndex
CREATE INDEX "messages_communication_id_idx" ON "messages"("communication_id");

-- CreateIndex
CREATE INDEX "submissions_grades_course_external_id_idx" ON "submissions_grades"("course_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_subject_external_id_idx" ON "submissions_grades"("subject_external_id");

-- CreateIndex
CREATE INDEX "submissions_grades_year_month_course_external_id_idx" ON "submissions_grades"("year", "month", "course_external_id");

-- CreateIndex
CREATE INDEX "tasks_subject_external_id_idx" ON "tasks"("subject_external_id");

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
