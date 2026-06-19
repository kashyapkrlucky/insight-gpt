/*
  Warnings:

  - You are about to drop the column `fileId` on the `chats` table. All the data in the column will be lost.
  - Added the required column `documentId` to the `chats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chats" DROP COLUMN "fileId",
ADD COLUMN     "documentId" TEXT NOT NULL;
