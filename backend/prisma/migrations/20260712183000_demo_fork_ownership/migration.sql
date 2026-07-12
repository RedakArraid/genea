-- AlterTable
ALTER TABLE "FamilyTree" ADD COLUMN IF NOT EXISTS "demoForkOwnerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FamilyTree_demoForkOwnerId_key" ON "FamilyTree"("demoForkOwnerId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "DemoForkMapping" (
    "id" TEXT NOT NULL,
    "forkTreeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "forkedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoForkMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DemoForkMapping_forkTreeId_entityType_originalId_key" ON "DemoForkMapping"("forkTreeId", "entityType", "originalId");
CREATE INDEX IF NOT EXISTS "DemoForkMapping_forkTreeId_entityType_forkedId_idx" ON "DemoForkMapping"("forkTreeId", "entityType", "forkedId");
