/*
  Warnings:

  - You are about to drop the column `signatureFileKey` on the `CorrectiveCommitment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[signatureBlobId]` on the table `CorrectiveCommitment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resolutionPhotoBlobId]` on the table `CorrectiveCommitment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[evidencePhotoBlobId]` on the table `Detection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `signatureBlobId` to the `CorrectiveCommitment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MediaBlobKind" AS ENUM ('DETECTION_EVIDENCE', 'CORRECTIVE_SIGNATURE', 'CORRECTIVE_RESOLUTION');

-- AlterTable
ALTER TABLE "CorrectiveCommitment" DROP COLUMN "signatureFileKey",
ADD COLUMN     "resolutionPhotoBlobId" TEXT,
ADD COLUMN     "signatureBlobId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Detection" ADD COLUMN     "evidencePhotoBlobId" TEXT;

-- CreateTable
CREATE TABLE "MediaBlob" (
    "id" TEXT NOT NULL,
    "kind" "MediaBlobKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaBlob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaBlob_kind_idx" ON "MediaBlob"("kind");

-- CreateIndex
CREATE INDEX "MediaBlob_uploadedById_idx" ON "MediaBlob"("uploadedById");

-- CreateIndex
CREATE INDEX "MediaBlob_createdAt_idx" ON "MediaBlob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveCommitment_signatureBlobId_key" ON "CorrectiveCommitment"("signatureBlobId");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveCommitment_resolutionPhotoBlobId_key" ON "CorrectiveCommitment"("resolutionPhotoBlobId");

-- CreateIndex
CREATE UNIQUE INDEX "Detection_evidencePhotoBlobId_key" ON "Detection"("evidencePhotoBlobId");

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_evidencePhotoBlobId_fkey" FOREIGN KEY ("evidencePhotoBlobId") REFERENCES "MediaBlob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveCommitment" ADD CONSTRAINT "CorrectiveCommitment_signatureBlobId_fkey" FOREIGN KEY ("signatureBlobId") REFERENCES "MediaBlob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveCommitment" ADD CONSTRAINT "CorrectiveCommitment_resolutionPhotoBlobId_fkey" FOREIGN KEY ("resolutionPhotoBlobId") REFERENCES "MediaBlob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaBlob" ADD CONSTRAINT "MediaBlob_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
