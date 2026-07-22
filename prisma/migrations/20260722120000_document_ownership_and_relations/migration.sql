-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "userId" TEXT;

-- Backfill existing rows from the owning chat (a document is created together
-- with exactly one chat, so this recovers the original owner).
UPDATE "documents" d
SET "userId" = c."userId"
FROM "chats" c
WHERE c."documentId" = d.id
  AND d."userId" IS NULL;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
