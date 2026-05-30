-- CreateEnum
CREATE TYPE "Status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DetectionType" AS ENUM ('UNSAFE_ACT', 'UNSAFE_CONDITION');

-- CreateEnum
CREATE TYPE "CorrectiveActionStatus" AS ENUM ('PENDING_ACCEPTANCE', 'OPEN', 'PENDING', 'EXPIRED', 'CLOSURE_REVIEW', 'CLOSED', 'REJECTED', 'REOPENED');

-- CreateTable
CREATE TABLE "Walkthrough" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Walkthrough_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "walkthroughId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "type" "DetectionType" NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL,
    "detectionId" TEXT NOT NULL,
    "correctivePlan" TEXT,
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "currentCommitmentDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveCommitment" (
    "id" TEXT NOT NULL,
    "correctiveActionId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "commitmentDate" DATE NOT NULL,
    "signatureFileKey" TEXT NOT NULL,
    "signedById" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,
    "previousCommitmentId" TEXT,

    CONSTRAINT "CorrectiveCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Walkthrough_folio_key" ON "Walkthrough"("folio");

-- CreateIndex
CREATE INDEX "Walkthrough_inspectorId_idx" ON "Walkthrough"("inspectorId");

-- CreateIndex
CREATE INDEX "Walkthrough_startedAt_idx" ON "Walkthrough"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Detection_folio_key" ON "Detection"("folio");

-- CreateIndex
CREATE INDEX "Detection_walkthroughId_idx" ON "Detection"("walkthroughId");

-- CreateIndex
CREATE INDEX "Detection_responsibleId_idx" ON "Detection"("responsibleId");

-- CreateIndex
CREATE INDEX "Detection_createdAt_idx" ON "Detection"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveAction_detectionId_key" ON "CorrectiveAction"("detectionId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_status_idx" ON "CorrectiveAction"("status");

-- CreateIndex
CREATE INDEX "CorrectiveAction_currentCommitmentDate_idx" ON "CorrectiveAction"("currentCommitmentDate");

-- CreateIndex
CREATE INDEX "CorrectiveCommitment_correctiveActionId_idx" ON "CorrectiveCommitment"("correctiveActionId");

-- CreateIndex
CREATE INDEX "CorrectiveCommitment_signedById_idx" ON "CorrectiveCommitment"("signedById");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveCommitment_correctiveActionId_sequenceNumber_key" ON "CorrectiveCommitment"("correctiveActionId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "Walkthrough" ADD CONSTRAINT "Walkthrough_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_walkthroughId_fkey" FOREIGN KEY ("walkthroughId") REFERENCES "Walkthrough"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "Detection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveCommitment" ADD CONSTRAINT "CorrectiveCommitment_correctiveActionId_fkey" FOREIGN KEY ("correctiveActionId") REFERENCES "CorrectiveAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveCommitment" ADD CONSTRAINT "CorrectiveCommitment_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveCommitment" ADD CONSTRAINT "CorrectiveCommitment_previousCommitmentId_fkey" FOREIGN KEY ("previousCommitmentId") REFERENCES "CorrectiveCommitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
