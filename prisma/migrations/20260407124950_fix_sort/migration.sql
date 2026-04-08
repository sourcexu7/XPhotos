/*
  Warnings:

  - Made the column `sort` on table `images_albums_relation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "images_albums_relation" ALTER COLUMN "sort" SET NOT NULL;
