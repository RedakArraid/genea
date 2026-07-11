-- matchingOptIn on FamilyTree + person revision history
ALTER TABLE "FamilyTree" ADD COLUMN IF NOT EXISTS "matchingOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "PersonRevision" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PersonRevision_personId_createdAt_idx" ON "PersonRevision"("personId", "createdAt");

ALTER TABLE "PersonRevision" DROP CONSTRAINT IF EXISTS "PersonRevision_personId_fkey";
ALTER TABLE "PersonRevision" ADD CONSTRAINT "PersonRevision_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
