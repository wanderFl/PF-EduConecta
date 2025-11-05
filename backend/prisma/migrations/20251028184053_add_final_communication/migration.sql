/*
  Warnings:

  - You are about to drop the `communications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CommunicationKind" AS ENUM ('THREAD', 'NOTICE');

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_communication_id_fkey";

-- DropTable
DROP TABLE "public"."communications";

-- DropTable
DROP TABLE "public"."messages";

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "kind" "CommunicationKind" NOT NULL DEFAULT 'THREAD',
    "subject" TEXT,
    "student_external_id" INTEGER NOT NULL,
    "teacher_external_id" INTEGER NOT NULL,
    "parent_id" TEXT NOT NULL,
    "is_behavioral_note" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_by_parent" BOOLEAN NOT NULL DEFAULT false,
    "archived_by_teacher" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
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

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "Communication_student_external_id_idx" ON "Communication"("student_external_id");

-- CreateIndex
CREATE INDEX "Communication_teacher_external_id_idx" ON "Communication"("teacher_external_id");

-- CreateIndex
CREATE INDEX "Communication_parent_id_idx" ON "Communication"("parent_id");

-- CreateIndex
CREATE INDEX "Message_communication_id_idx" ON "Message"("communication_id");

-- CreateIndex
CREATE INDEX "MessageAttachment_message_id_idx" ON "MessageAttachment"("message_id");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
