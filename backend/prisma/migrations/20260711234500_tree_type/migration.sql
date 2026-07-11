-- Tree type: genealogy (default) or organization (enterprise org chart)
CREATE TYPE "TreeType" AS ENUM ('GENEALOGY', 'ORGANIZATION');

ALTER TABLE "FamilyTree" ADD COLUMN IF NOT EXISTS "treeType" "TreeType" NOT NULL DEFAULT 'GENEALOGY';
