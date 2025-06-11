-- CreateTable
CREATE TABLE "UnionChild" (
    "id" TEXT NOT NULL,
    "marriageEdgeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnionChild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnionChild_marriageEdgeId_childId_key" ON "UnionChild"("marriageEdgeId", "childId");

-- AddForeignKey
ALTER TABLE "UnionChild" ADD CONSTRAINT "UnionChild_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnionChild" ADD CONSTRAINT "UnionChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
