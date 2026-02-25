-- AlterTable
ALTER TABLE "novels" ADD COLUMN "serialNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "novels_serialNumber_key" ON "novels"("serialNumber");
