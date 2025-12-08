/*
  Warnings:

  - You are about to drop the `password_resets` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTIVO', 'DOCENTE', 'FAMILIA');

-- DropForeignKey
ALTER TABLE "public"."password_resets" DROP CONSTRAINT "password_resets_userId_fkey";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "file_reference" TEXT,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "max_points" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- DropTable
DROP TABLE "public"."password_resets";

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
