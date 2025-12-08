/*
  Warnings:

  - You are about to drop the column `justification_reason` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `archived_by_parent` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `archived_by_teacher` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `student_external_id` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `teacher_external_id` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `editedAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `reply_to_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sender_parent_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sender_role` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sender_teacher_external_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `course_external_id` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `subject_external_id` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the column `subject_external_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `MessageAttachment` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `status` on the `attendance_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `author_teacher_external_id` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Made the column `subject` on table `communications` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `paralelo` to the `disciplinary_reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MessageAttachment" DROP CONSTRAINT "MessageAttachment_message_id_fkey";

-- DropIndex
DROP INDEX "public"."attendance_records_course_external_id_idx";

-- DropIndex
DROP INDEX "public"."attendance_records_student_external_id_date_key";

-- DropIndex
DROP INDEX "public"."attendance_records_year_month_course_external_id_idx";

-- DropIndex
DROP INDEX "public"."communications_parent_id_idx";

-- DropIndex
DROP INDEX "public"."communications_student_external_id_idx";

-- DropIndex
DROP INDEX "public"."communications_teacher_external_id_idx";

-- DropIndex
DROP INDEX "public"."disciplinary_reports_course_external_id_idx";

-- DropIndex
DROP INDEX "public"."messages_communication_id_idx";

-- DropIndex
DROP INDEX "public"."submissions_grades_course_external_id_idx";

-- DropIndex
DROP INDEX "public"."submissions_grades_subject_external_id_idx";

-- DropIndex
DROP INDEX "public"."submissions_grades_year_month_course_external_id_idx";

-- DropIndex
DROP INDEX "public"."tasks_subject_external_id_idx";

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "justification_reason",
DROP COLUMN "month",
DROP COLUMN "year",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "communications" DROP COLUMN "archived_by_parent",
DROP COLUMN "archived_by_teacher",
DROP COLUMN "createdAt",
DROP COLUMN "kind",
DROP COLUMN "lastMessageAt",
DROP COLUMN "parent_id",
DROP COLUMN "status",
DROP COLUMN "student_external_id",
DROP COLUMN "teacher_external_id",
DROP COLUMN "updatedAt",
ADD COLUMN     "author_teacher_external_id" INTEGER NOT NULL,
ALTER COLUMN "subject" SET NOT NULL;

-- AlterTable
ALTER TABLE "disciplinary_reports" ADD COLUMN     "paralelo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "editedAt",
DROP COLUMN "reply_to_id",
DROP COLUMN "sender_parent_id",
DROP COLUMN "sender_role",
DROP COLUMN "sender_teacher_external_id";

-- AlterTable
ALTER TABLE "password_resets" DROP COLUMN "used";

-- AlterTable
ALTER TABLE "submissions_grades" DROP COLUMN "course_external_id",
DROP COLUMN "month",
DROP COLUMN "subject_external_id",
DROP COLUMN "year",
ALTER COLUMN "submitted_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "subject_external_id",
ADD COLUMN     "paralelo" TEXT;

-- DropTable
DROP TABLE "public"."MessageAttachment";

-- DropEnum
DROP TYPE "public"."AttendanceStatus";

-- DropEnum
DROP TYPE "public"."CommunicationKind";

-- DropEnum
DROP TYPE "public"."CommunicationStatus";

-- DropEnum
DROP TYPE "public"."SenderRole";

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
CREATE INDEX "communications_author_teacher_external_id_idx" ON "communications"("author_teacher_external_id");

-- CreateIndex
CREATE INDEX "disciplinary_reports_course_external_id_paralelo_idx" ON "disciplinary_reports"("course_external_id", "paralelo");

-- CreateIndex
CREATE INDEX "tasks_course_external_id_paralelo_idx" ON "tasks"("course_external_id", "paralelo");

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
