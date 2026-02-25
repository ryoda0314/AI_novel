-- AlterTable
ALTER TABLE "chapters" ADD COLUMN "previewToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chapters_previewToken_key" ON "chapters"("previewToken");
