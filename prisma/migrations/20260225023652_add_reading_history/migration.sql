-- CreateTable
CREATE TABLE "reading_histories" (
    "id" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "reading_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_histories_userId_readAt_idx" ON "reading_histories"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "reading_histories_userId_novelId_key" ON "reading_histories"("userId", "novelId");

-- AddForeignKey
ALTER TABLE "reading_histories" ADD CONSTRAINT "reading_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_histories" ADD CONSTRAINT "reading_histories_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_histories" ADD CONSTRAINT "reading_histories_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
