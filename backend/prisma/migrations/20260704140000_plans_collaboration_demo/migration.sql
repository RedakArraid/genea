-- Migration idempotente (compatible db push existant)

DO $$ BEGIN CREATE TYPE "Plan" AS ENUM ('SOLO', 'FAMILY', 'PATRIMONY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TreeVisibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" "Plan" NOT NULL DEFAULT 'SOLO';

ALTER TABLE "FamilyTree" ADD COLUMN IF NOT EXISTS "visibility" "TreeVisibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "FamilyTree" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;

UPDATE "FamilyTree" SET "visibility" = 'PUBLIC' WHERE "isPublic" = true AND "visibility" = 'PRIVATE';

CREATE TABLE IF NOT EXISTS "TreeCollaborator" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreeCollaborator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TreeInvite" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreeInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TreeCollaborator_treeId_userId_key" ON "TreeCollaborator"("treeId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "TreeInvite_token_key" ON "TreeInvite"("token");
CREATE INDEX IF NOT EXISTS "TreeInvite_email_idx" ON "TreeInvite"("email");

DO $$ BEGIN
  ALTER TABLE "TreeCollaborator" ADD CONSTRAINT "TreeCollaborator_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TreeCollaborator" ADD CONSTRAINT "TreeCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TreeInvite" ADD CONSTRAINT "TreeInvite_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TreeInvite" ADD CONSTRAINT "TreeInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
