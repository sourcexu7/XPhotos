-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "parentId" VARCHAR(50);

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
