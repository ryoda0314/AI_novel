-- AlterTable
ALTER TABLE "novels" ADD COLUMN     "seriesId" TEXT,
ADD COLUMN     "seriesOrder" INTEGER;

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "series_authorId_idx" ON "series"("authorId");

-- CreateIndex
CREATE INDEX "novels_seriesId_idx" ON "novels"("seriesId");

-- AddForeignKey
ALTER TABLE "novels" ADD CONSTRAINT "novels_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
