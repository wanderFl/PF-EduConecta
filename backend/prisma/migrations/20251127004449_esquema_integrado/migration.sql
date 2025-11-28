/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `student_comment` on the `submissions_grades` table. All the data in the column will be lost.
  - You are about to drop the `Communication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expires_at` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `submissions_grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_communication_id_fkey";

-- DropForeignKey
ALTER TABLE "MessageAttachment" DROP CONSTRAINT "MessageAttachment_message_id_fkey";

-- DropForeignKey
ALTER TABLE "password_resets" DROP CONSTRAINT "password_resets_userId_fkey";

-- DropIndex
DROP INDEX "password_resets_expiresAt_idx";

-- DropIndex
DROP INDEX "password_resets_userId_idx";

-- AlterTable
ALTER TABLE "password_resets" DROP COLUMN "expiresAt",
DROP COLUMN "tokenHash",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "submissions_grades" DROP COLUMN "student_comment",
ADD COLUMN     "comment_student" TEXT,
ADD COLUMN     "comment_teacher" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "graded_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "file_reference" TEXT,
ADD COLUMN     "max_points" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Communication";

-- DropTable
DROP TABLE "Message";

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

-- CreateIndex
CREATE INDEX "communications_student_external_id_idx" ON "communications"("student_external_id");

-- CreateIndex
CREATE INDEX "communications_teacher_external_id_idx" ON "communications"("teacher_external_id");

-- CreateIndex
CREATE INDEX "communications_parent_id_idx" ON "communications"("parent_id");

-- CreateIndex
CREATE INDEX "messages_communication_id_idx" ON "messages"("communication_id");

-- CreateIndex
CREATE INDEX "attendance_records_course_external_id_date_idx" ON "attendance_records"("course_external_id", "date");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE INDEX "tasks_trimestre_idx" ON "tasks"("trimestre");

-- CreateIndex
CREATE INDEX "tasks_aporte_idx" ON "tasks"("aporte");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
