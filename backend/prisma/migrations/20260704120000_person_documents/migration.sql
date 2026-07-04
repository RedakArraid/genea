-- CreateTable PersonDocument
CREATE TABLE "PersonDocument" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonDocument_personId_idx" ON "PersonDocument"("personId");
CREATE INDEX "PersonDocument_treeId_idx" ON "PersonDocument"("treeId");

ALTER TABLE "PersonDocument" ADD CONSTRAINT "PersonDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
