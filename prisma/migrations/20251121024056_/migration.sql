/*
  Warnings:

  - You are about to drop the column `categoryId` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the `tag_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_categoryId_fkey";

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "categoryId",
ADD COLUMN     "category" VARCHAR(200);

-- DropTable
DROP TABLE "tag_categories";
