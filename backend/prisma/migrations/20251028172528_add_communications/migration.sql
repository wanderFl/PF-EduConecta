/*
  Warnings:

  - You are about to drop the column `author_teacher_external_id` on the `communications` table. All the data in the column will be lost.
  - Added the required column `parent_id` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_external_id` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_external_id` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `communications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_role` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SenderRole" AS ENUM ('PARENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('OPEN', 'CLOSED');

-- DropIndex
DROP INDEX "public"."communications_author_teacher_external_id_idx";

-- AlterTable
ALTER TABLE "communications" DROP COLUMN "author_teacher_external_id",
ADD COLUMN     "archived_by_parent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archived_by_teacher" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "course_external_id" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "parent_id" TEXT NOT NULL,
ADD COLUMN     "status" "CommunicationStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "student_external_id" INTEGER NOT NULL,
ADD COLUMN     "teacher_external_id" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "attachments_json" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "read_by_parent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "read_by_teacher" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sender_parent_id" TEXT,
ADD COLUMN     "sender_role" "SenderRole" NOT NULL,
ADD COLUMN     "sender_teacher_external_id" INTEGER;

-- CreateIndex
CREATE INDEX "communications_student_external_id_idx" ON "communications"("student_external_id");

-- CreateIndex
CREATE INDEX "communications_teacher_external_id_idx" ON "communications"("teacher_external_id");

-- CreateIndex
CREATE INDEX "communications_parent_id_idx" ON "communications"("parent_id");

-- CreateIndex
CREATE INDEX "communications_lastMessageAt_idx" ON "communications"("lastMessageAt");

-- CreateIndex
CREATE INDEX "messages_communication_id_createdAt_idx" ON "messages"("communication_id", "createdAt");
